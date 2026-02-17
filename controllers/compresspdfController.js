const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const Logger = require('../services/logger');
const archiver = require('archiver');
const execPromise = util.promisify(exec);
const qrService = require('../services/qrService');
const { getBatchLimits } = require('../config/limits');

const sanitizeFilename = (filename) => {
  return filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
};

const getMaxFiles = (req) => {
  return (getBatchLimits(!!req.isProUser)).maxFiles;
};

const MAX_FILE_SIZE = 50 * 1024 * 1024;

const compressBatch = async (files) => {
  const results = [];
  const tempFiles = [];
  
  for (const file of files) {
    let originalTempPath = file.path;
    let sanitizedTempPath = null;
    let outputPath = null;
    
    try {
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File "${file.originalname}" exceeds 50MB limit`);
      }
      
      const originalName = file.originalname;
      const originalSize = file.size;
      const sanitizedName = sanitizeFilename(originalName);
      const tempDir = path.dirname(originalTempPath);
      sanitizedTempPath = path.join(tempDir, sanitizedName);
      
      fs.copyFileSync(originalTempPath, sanitizedTempPath);
      
      const outputDir = 'uploads';
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      const outputName = `compressed_${Date.now()}_${sanitizedName}`;
      outputPath = path.join(outputDir, outputName);
      
      const gsPath = process.platform === 'win32' ? 'gswin64c' : 'gs';
      const inputPathForGs = sanitizedTempPath.replace(/\\/g, '/');
      const outputPathForGs = outputPath.replace(/\\/g, '/');
      
      const gsCommand = [
        `"${gsPath}"`,
        '-sDEVICE=pdfwrite',
        '-dCompatibilityLevel=1.4',
        '-dPDFSETTINGS=/ebook',
        '-dNOPAUSE',
        '-dQUIET',
        '-dBATCH',
        '-dAutoRotatePages=/None',
        '-dColorImageDownsampleType=/Bicubic',
        '-dColorImageResolution=150',
        '-dGrayImageDownsampleType=/Bicubic',
        '-dGrayImageResolution=150',
        '-dMonoImageDownsampleType=/Bicubic',
        '-dMonoImageResolution=150',
        `-sOutputFile="${outputPathForGs}"`,
        `"${inputPathForGs}"`
      ].join(' ');
      
      const { stdout, stderr } = await execPromise(gsCommand, { 
        timeout: 180000, 
        maxBuffer: 1024 * 1024 * 20 
      });
      
      if (stderr && stderr.trim()) {
        console.warn(`GhostScript warnings for ${originalName}:`, stderr);
      }
      
      if (!fs.existsSync(outputPath)) {
        throw new Error('Compressed file was not created');
      }
      
      const compressedSize = fs.statSync(outputPath).size;
      const reductionPercent = originalSize > 0 
        ? Math.max(0, ((originalSize - compressedSize) / originalSize * 100)).toFixed(2)
        : '0.00';
      
      results.push({
        fileName: originalName,
        cleanedName: sanitizedName,
        originalSize,
        compressedSize,
        reductionPercent,
        compressionRatio: originalSize > 0 ? (originalSize / compressedSize).toFixed(2) : '0.00',
        outputPath,
        success: true,
        error: null
      });
      
      tempFiles.push(originalTempPath, sanitizedTempPath, outputPath);
      
    } catch (fileError) {
      console.error(`Error compressing ${file.originalname}:`, fileError.message);
      results.push({
        fileName: file.originalname,
        success: false,
        error: fileError.message,
        originalSize: file.size,
        compressedSize: 0,
        reductionPercent: 0,
        compressionRatio: '0.00'
      });
      
      [originalTempPath, sanitizedTempPath, outputPath]
        .filter(Boolean)
        .forEach(filePath => {
          try {
            if (filePath && fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          } catch (cleanupErr) {
            console.warn(`Cleanup error:`, cleanupErr.message);
          }
        });
    }
  }
  
  return { results, tempFiles };
};

const createZipFromResults = (results, res) => {
  return new Promise((resolve, reject) => {
    const archive = archiver('zip', {
      zlib: { level: 9 } 
    });
    
    const zipFileName = `compressed_pdfs_${Date.now()}.zip`;
    
    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${zipFileName}"`,
      'X-Content-Type': 'application/zip',
      'X-File-Count': results.filter(r => r.success).length.toString()
    });
    
    archive.pipe(res);
    
    let addedCount = 0;
    results.forEach(result => {
      if (result.success && fs.existsSync(result.outputPath)) {
        const fileName = result.cleanedName || result.fileName;
        const displayName = `compressed_${fileName}`;
        archive.file(result.outputPath, { name: displayName });
        addedCount++;
      }
    });
    
    if (addedCount === 0) {
      reject(new Error('No successful compressions to add to ZIP'));
      return;
    }
    
    const successfulResults = results.filter(r => r.success);
    const totalOriginalSize = successfulResults.reduce((sum, r) => sum + r.originalSize, 0);
    const totalCompressedSize = successfulResults.reduce((sum, r) => sum + r.compressedSize, 0);
    const avgReduction = successfulResults.reduce((sum, r) => sum + parseFloat(r.reductionPercent), 0) / successfulResults.length;
    
    const summary = {
      totalFiles: successfulResults.length,
      totalOriginalSize,
      totalCompressedSize,
      totalReduction: ((1 - totalCompressedSize / totalOriginalSize) * 100).toFixed(2),
      averageReduction: avgReduction.toFixed(2),
      files: successfulResults.map(r => ({
        originalName: r.fileName,
        compressedName: r.cleanedName,
        originalSize: r.originalSize,
        compressedSize: r.compressedSize,
        reductionPercent: r.reductionPercent,
        compressionRatio: r.compressionRatio
      })),
      timestamp: new Date().toISOString()
    };
    
    archive.append(JSON.stringify(summary, null, 2), { name: 'compression_summary.json' });
    
    archive.on('error', (err) => {
      reject(err);
    });
    
    archive.on('end', () => {
      resolve({
        fileCount: addedCount,
        totalOriginalSize,
        totalCompressedSize,
        avgReduction: avgReduction.toFixed(2)
      });
    });
    
    archive.finalize();
  });
};

exports.compressPdf = async (req, res) => {
  const startTime = Date.now();
  const tempFiles = [];
  
  try {
    if (!req.files || !req.files.length) {
      return res.status(400).json({ 
        success: false, 
        message: 'No PDF files uploaded' 
      });
    }
    
    const { maxFiles: MAX_FILES, maxTotalSize: MAX_TOTAL_SIZE } = getBatchLimits(!!req.isProUser);
    if (req.files.length > MAX_FILES) {
      req.files.forEach(file => {
        try {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        } catch (err) { console.warn(`Cleanup error:`, err.message); }
      });
      return res.status(400).json({
        success: false,
        message: `Maximum ${MAX_FILES} files allowed. You uploaded ${req.files.length}.`,
        errorCode: 'MAX_FILES_EXCEEDED'
      });
    }

    const totalSize = req.files.reduce((sum, f) => sum + f.size, 0);
    if (totalSize > MAX_TOTAL_SIZE) {
      req.files.forEach(file => {
        try {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        } catch (err) { console.warn(`Cleanup error:`, err.message); }
      });
      return res.status(400).json({
        success: false,
        message: req.isProUser
          ? `Total size exceeds ${(MAX_TOTAL_SIZE / (1024 * 1024)) | 0}MB limit.`
          : `Free users: total size must be ≤7MB. Your selection is ${(totalSize / (1024 * 1024)).toFixed(1)}MB. Upgrade to Pro for 20MB.`,
        errorCode: 'TOTAL_SIZE_EXCEEDED'
      });
    }
    
    const invalidFiles = [];
    req.files.forEach((file, index) => {
      if (file.mimetype !== 'application/pdf') {
        invalidFiles.push(`File #${index + 1} "${file.originalname}" is not a PDF`);
      }
      if (file.size > MAX_FILE_SIZE) {
        invalidFiles.push(`File #${index + 1} "${file.originalname}" exceeds 50MB limit`);
      }
    });
    
    if (invalidFiles.length > 0) {
      req.files.forEach(file => {
        try {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        } catch (err) {
          console.warn(`Cleanup error:`, err.message);
        }
      });
      
      return res.status(400).json({
        success: false,
        message: 'Invalid files detected',
        errors: invalidFiles
      });
    }
    
    const { results, tempFiles: batchTempFiles } = await compressBatch(req.files);
    tempFiles.push(...batchTempFiles);
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    const totalOriginalSize = successful.reduce((sum, r) => sum + r.originalSize, 0);
    const totalCompressedSize = successful.reduce((sum, r) => sum + r.compressedSize, 0);
    const totalReduction = totalOriginalSize > 0 
      ? ((1 - totalCompressedSize / totalOriginalSize) * 100).toFixed(2)
      : '0.00';
    
    if (successful.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'All files failed to compress',
        results: results
      });
    }
    
    Logger.logUsage(req, 'pdf_compress', successful.length > 0).catch(() => {});
    
// ============ PRO USER QR CODE RESPONSE ============
// In your compresspdfController.js - around where you handle pro users

// ============ PRO USER QR CODE RESPONSE ============
if (req.isProUser) {
  console.log('✅ Pro user detected, generating QR code...');
  try {
    // Generate a unique download token
    const downloadToken = `compress_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // Require QRCode
    const QRCode = require('qrcode');
    
    // Generate QR code data URL
    const downloadUrl = `${req.protocol}://${req.get('host')}/api/download/${downloadToken}`;
    const qrCodeDataURL = await QRCode.toDataURL(downloadUrl);
    
    // Use process-wide store (initialized in index.js so send-to-email finds it)
    if (typeof global !== 'undefined' && !global.downloadTokens) global.downloadTokens = new Map();
    global.downloadTokens.set(downloadToken, {
      results: successful.map(r => ({
        outputPath: r.outputPath,
        fileName: r.cleanedName || r.fileName,
        originalName: r.fileName,
        compressedSize: r.compressedSize,
        originalSize: r.originalSize
      })),
      timestamp: Date.now(),
      expiry: Date.now() + (10 * 60 * 1000) // 10 minutes
    });
    
    // Set cleanup timeout
    setTimeout(() => {
      if (global.downloadTokens.has(downloadToken)) {
        const tokenData = global.downloadTokens.get(downloadToken);
        // Clean up files
        tokenData.results.forEach(result => {
          try {
            if (result.outputPath && fs.existsSync(result.outputPath)) {
              fs.unlinkSync(result.outputPath);
            }
          } catch (err) {
            console.warn(`Cleanup error:`, err.message);
          }
        });
        global.downloadTokens.delete(downloadToken);
      }
    }, 10 * 60 * 1000);
    
    // Generate filename
    const fileName = successful.length === 1
      ? `compressed_${successful[0].cleanedName || successful[0].fileName}`
      : `compressed_files_${Date.now()}.zip`;
    
    console.log('📤 Sending JSON response for Pro user');
    
    // ============ CRITICAL: Return JSON, NOT a file ============
    return res.status(200).json({
      success: true,
      isProUser: true,           // ✅ This flag is crucial
      qrCode: qrCodeDataURL,
      downloadToken: downloadToken,
      fileName: fileName,
      fileSize: totalCompressedSize,
      stats: {
        fileCount: successful.length,
        totalOriginalSize,
        totalCompressedSize,
        totalReduction,
        failedCount: failed.length,
        files: successful.map(r => ({
          name: r.fileName,
          cleanedName: r.cleanedName,
          originalSize: r.originalSize,
          compressedSize: r.compressedSize,
          reductionPercent: r.reductionPercent
        }))
      }
    });
    
  } catch (qrError) {
    console.error('❌ QR Code generation error:', qrError);
    // Fallback to direct download if QR fails
    // Continue to free user flow
  }
}
    
    // ============ FREE USERS OR FALLBACK - DIRECT DOWNLOAD ============
    if (successful.length === 1) {
      const result = successful[0];
      
      // Check if file exists
      if (!fs.existsSync(result.outputPath)) {
        throw new Error('Compressed file not found');
      }
      
      const fileStream = fs.createReadStream(result.outputPath);
      const fileName = `compressed_${result.cleanedName || result.fileName}`;
      
      // Set headers for file download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', result.compressedSize);
      res.setHeader('X-Original-Size', result.originalSize);
      res.setHeader('X-Compressed-Size', result.compressedSize);
      res.setHeader('X-Reduction-Percent', result.reductionPercent);
      res.setHeader('X-Compression-Ratio', result.compressionRatio);
      res.setHeader('X-Successful-Count', '1');
      res.setHeader('X-Failed-Count', failed.length.toString());
      res.setHeader('X-Total-Files', req.files.length.toString());
      res.setHeader('X-Is-Pro-User', 'false');
      
      // Pipe the file
      fileStream.pipe(res);
      
      fileStream.on('end', () => {
        setTimeout(() => {
          cleanupTempFiles(tempFiles);
        }, 2000);
      });
      
      fileStream.on('error', (err) => {
        console.error('Stream error:', err);
        cleanupTempFiles(tempFiles);
        // Can't send response here because headers already sent
      });
      
    } else {
      // Multiple files - create ZIP
      try {
        // Create a temporary zip file
        const zipPath = path.join('uploads', `compressed_${Date.now()}.zip`);
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });
        
        archive.pipe(output);
        
        successful.forEach(result => {
          if (fs.existsSync(result.outputPath)) {
            const fileName = `compressed_${result.cleanedName || result.fileName}`;
            archive.file(result.outputPath, { name: fileName });
          }
        });
        
        // Add summary JSON
        const summary = {
          totalFiles: successful.length,
          totalOriginalSize,
          totalCompressedSize,
          totalReduction,
          files: successful.map(r => ({
            originalName: r.fileName,
            compressedName: `compressed_${r.cleanedName || r.fileName}`,
            originalSize: r.originalSize,
            compressedSize: r.compressedSize,
            reductionPercent: r.reductionPercent
          })),
          timestamp: new Date().toISOString()
        };
        
        archive.append(JSON.stringify(summary, null, 2), { name: 'compression_summary.json' });
        
        await new Promise((resolve, reject) => {
          output.on('close', resolve);
          archive.on('error', reject);
          archive.finalize();
        });
        
        // Send the zip file
        const zipFileName = `compressed_files_${Date.now()}.zip`;
        
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${zipFileName}"`);
        res.setHeader('Content-Length', fs.statSync(zipPath).size);
        res.setHeader('X-Total-Original-Size', totalOriginalSize.toString());
        res.setHeader('X-Total-Compressed-Size', totalCompressedSize.toString());
        res.setHeader('X-Total-Reduction-Percent', totalReduction);
        res.setHeader('X-Successful-Count', successful.length.toString());
        res.setHeader('X-Failed-Count', failed.length.toString());
        res.setHeader('X-Total-Files', req.files.length.toString());
        res.setHeader('X-Processing-Time', (Date.now() - startTime).toString());
        res.setHeader('X-Is-Pro-User', 'false');
        
        const zipStream = fs.createReadStream(zipPath);
        zipStream.pipe(res);
        
        zipStream.on('end', () => {
          setTimeout(() => {
            cleanupTempFiles([...tempFiles, zipPath]);
          }, 2000);
        });
        
        zipStream.on('error', (err) => {
          console.error('ZIP stream error:', err);
          cleanupTempFiles([...tempFiles, zipPath]);
        });
        
      } catch (zipError) {
        console.error('ZIP creation error:', zipError);
        cleanupTempFiles(tempFiles);
        
        // Only send error if headers haven't been sent yet
        if (!res.headersSent) {
          return res.status(500).json({
            success: false,
            message: 'Failed to create ZIP archive',
            detail: zipError.message
          });
        }
      }
    }
    
  } catch (error) {
    console.error('Batch compression error:', error.message);
    Logger.logUsage(req, 'pdf_compress', false).catch(() => {});
    cleanupTempFiles(tempFiles);
    
    let errorMessage = 'Compression failed';
    
    if (error.message.includes('undefinedfilename')) {
      errorMessage = 'Filename contains invalid characters. Our system auto-renamed the file, but please use only letters, numbers, dots, dashes, and underscores.';
    } else if (error.code === 'ETIMEDOUT' || error.killed) {
      errorMessage = 'Compression timed out. Files might be too large or complex.';
    } else if (error.message.includes('ENOENT') || error.message.includes('No such file')) {
      errorMessage = 'File not found. The upload might have failed.';
    } else if (error.stderr && error.stderr.includes('Permission')) {
      errorMessage = 'Permission error. Make sure GhostScript is installed and accessible.';
    } else if (error.stderr && error.stderr.includes('Error')) {
      errorMessage = 'GhostScript error. The PDF might be corrupted or password-protected.';
    }
    
    // Only send error if headers haven't been sent
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: errorMessage,
        detail: process.env.NODE_ENV === 'development' ? error.message : undefined,
        processingTime: Date.now() - startTime
      });
    }
  }
};
// ============ ADD THIS DOWNLOAD HANDLER ============
exports.downloadCompressedFile = async (req, res) => {
  const { token } = req.params;
  
  try {
    // Check if token exists
    if (!global.downloadTokens || !global.downloadTokens.has(token)) {
      return res.status(404).json({
        success: false,
        message: 'Download link expired or invalid'
      });
    }
    
    const tokenData = global.downloadTokens.get(token);
    
    // Check expiry
    if (tokenData.expiry < Date.now()) {
      global.downloadTokens.delete(token);
      return res.status(404).json({
        success: false,
        message: 'Download link expired'
      });
    }
    
    // Handle single file vs multiple files
    if (tokenData.results.length === 1) {
      const result = tokenData.results[0];
      
      if (!fs.existsSync(result.outputPath)) {
        throw new Error('File not found');
      }
      
      const fileStream = fs.createReadStream(result.outputPath);
      const fileName = `compressed_${result.cleanedName || result.fileName}`;
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': result.compressedSize
      });
      
      fileStream.pipe(res);
      
      fileStream.on('end', () => {
        // Don't delete immediately - let QR expiry handle it
        console.log(`Download completed for token: ${token}`);
      });
      
    } else {
      // Multiple files - create ZIP on demand
      const archive = archiver('zip', { zlib: { level: 9 } });
      const zipFileName = `compressed_files_${Date.now()}.zip`;
      
      res.set({
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipFileName}"`
      });
      
      archive.pipe(res);
      
      tokenData.results.forEach(result => {
        if (fs.existsSync(result.outputPath)) {
          const fileName = `compressed_${result.cleanedName || result.fileName}`;
          archive.file(result.outputPath, { name: fileName });
        }
      });
      
      archive.on('error', (err) => {
        console.error('Archive error:', err);
        res.status(500).end();
      });
      
      archive.finalize();
    }
    
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      success: false,
      message: 'Download failed'
    });
  }
};

const cleanupTempFiles = (filePaths) => {
  filePaths.forEach(filePath => {
    try {
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Cleaned up: ${filePath}`);
      }
    } catch (err) {
      console.warn(`Could not delete ${filePath}:`, err.message);
    }
  });
};

// ============ FIXED: PREVIEW GENERATION FOR COMPRESSED PDFS ============

exports.generatePreview = async (req, res) => {
  try {
    const { token } = req.params;
    console.log('\n=== 🔍 COMPRESS PREVIEW (single + multiple files, uses first file) ===');
    console.log('Token:', token);
    
    // Check authentication via session
    if (!req.session.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        errorCode: 'AUTH_REQUIRED'
      });
    }
    
    // Check Pro status
    if (!req.isProUser) {
      return res.status(403).json({
        success: false,
        message: 'Preview is only available for Pro users',
        errorCode: 'PRO_FEATURE_REQUIRED'
      });
    }

    // ✅ FIX: Check global.downloadTokens instead of qrService
    if (!global.downloadTokens || !global.downloadTokens.has(token)) {
      console.log('❌ Token not found in global.downloadTokens');
      return res.status(404).json({
        success: false,
        message: 'File not found or expired',
        errorCode: 'FILE_NOT_FOUND'
      });
    }

    const tokenData = global.downloadTokens.get(token);
    console.log('Token data found:', tokenData);

    if (!tokenData.results || tokenData.results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No files to preview',
        errorCode: 'FILE_NOT_FOUND'
      });
    }

    // Check expiry
    if (tokenData.expiry < Date.now()) {
      console.log('❌ Token expired');
      global.downloadTokens.delete(token);
      return res.status(404).json({
        success: false,
        message: 'Download link expired',
        errorCode: 'LINK_EXPIRED'
      });
    }

    // Preview: single or multiple files – use first file (same as Merge: one PDF to preview)
    if (tokenData.results.length >= 1) {
      const result = tokenData.results[0];
      console.log('Processing file (first of batch):', result.fileName, 'total files:', tokenData.results.length);

      const absolutePath = path.isAbsolute(result.outputPath)
        ? result.outputPath
        : path.join(process.cwd(), result.outputPath);

      if (!fs.existsSync(absolutePath)) {
        console.log('❌ File not found at path:', absolutePath);
        return res.status(404).json({
          success: false,
          message: 'Compressed file not found or already expired',
          errorCode: 'FILE_NOT_FOUND'
        });
      }

      const pdfBytes = fs.readFileSync(absolutePath);
      if (!pdfBytes || pdfBytes.length === 0) {
        console.log('❌ File is empty:', absolutePath);
        return res.status(500).json({
          success: false,
          message: 'Compressed file is empty',
          errorCode: 'EMPTY_FILE'
        });
      }
      console.log(`📄 PDF loaded: ${pdfBytes.length} bytes`);

      const PDFDocument = require('pdf-lib').PDFDocument;
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pageCount = pdfDoc.getPageCount();
      console.log(`📄 PDF loaded. Total pages: ${pageCount}`);

      const maxPreviewPages = Math.min(pageCount, 20);
      const pages = [];

      for (let i = 0; i < maxPreviewPages; i++) {
        try {
          const page = pdfDoc.getPage(i);
          const { width, height } = page.getSize();
          const svgContent = generateSVGThumbnail(i + 1, width, height);
          const base64Svg = Buffer.from(svgContent).toString('base64');

          pages.push({
            pageNumber: i + 1,
            width: Math.round(width),
            height: Math.round(height),
            thumbnail: `data:image/svg+xml;base64,${base64Svg}`,
            previewFailed: false,
            pageIndex: i
          });
        } catch (pageError) {
          console.error(`❌ Failed to generate thumbnail for page ${i + 1}:`, pageError.message);
          const fallbackSvg = generateFallbackSVG(i + 1);
          const base64Fallback = Buffer.from(fallbackSvg).toString('base64');
          pages.push({
            pageNumber: i + 1,
            width: 350,
            height: 495,
            thumbnail: `data:image/svg+xml;base64,${base64Fallback}`,
            previewFailed: true,
            pageIndex: i
          });
        }
      }

      // Same as Merge: ensure Buffer and base64 for client PDF.js
      const pdfBuffer = Buffer.isBuffer(pdfBytes) ? pdfBytes : Buffer.from(pdfBytes);
      const pdfBase64 = pdfBuffer.toString('base64');
      console.log(`✅ PDF data encoded (${pdfBase64.length} chars)`);

      res.json({
        success: true,
        pageCount: pages.length,
        pages,
        fileName: result.fileName,
        fileSize: result.compressedSize,
        pdfData: pdfBase64,
        totalPages: pageCount,
        hasMorePages: pageCount > maxPreviewPages
      });
    } else {
      return res.status(404).json({
        success: false,
        message: 'No files to preview',
        errorCode: 'FILE_NOT_FOUND'
      });
    }

  } catch (error) {
    console.error('\n❌❌❌ PREVIEW GENERATION FAILED ❌❌❌');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Failed to generate preview',
      errorCode: 'PREVIEW_FAILED',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Helper function for fallback SVG
function generateFallbackSVG(pageNumber) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="350" height="495" viewBox="0 0 350 495" xmlns="http://www.w3.org/2000/svg">
  <rect width="350" height="495" fill="white"/>
  <rect x="20" y="20" width="310" height="455" fill="#f8f9fa" stroke="#dee2e6" stroke-width="2"/>
  <text x="50" y="150" font-family="Arial, sans-serif" font-size="32" fill="#2c3e50">Page ${pageNumber}</text>
  <text x="50" y="230" font-family="Arial, sans-serif" font-size="24" fill="#6c757d">Preview Unavailable</text>
</svg>`;
}

function generateSVGThumbnail(pageNumber, width, height) {
  const thumbWidth = 350;
  const thumbHeight = Math.round((height / width) * 350);
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${thumbWidth}" height="${thumbHeight}" viewBox="0 0 ${Math.round(width)} ${Math.round(height)}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${Math.round(width)}" height="${Math.round(height)}" fill="white"/>
  <rect x="20" y="20" width="${Math.round(width - 40)}" height="${Math.round(height - 40)}" fill="#f8f9fa" stroke="#dee2e6" stroke-width="2"/>
  <text x="50" y="120" font-family="Arial, sans-serif" font-size="48" fill="#2c3e50">Page ${pageNumber}</text>
  <text x="50" y="200" font-family="Arial, sans-serif" font-size="32" fill="#6c757d">${Math.round(width)} × ${Math.round(height)}</text>
  <text x="50" y="280" font-family="Arial, sans-serif" font-size="24" fill="#868e96">Click to view actual PDF</text>
</svg>`;
}

// ============ FIXED: PROCESS COMPRESSED PDF (EDITING) ============

exports.processPDF = async (req, res) => {
  try {
    const { token } = req.params;
    const { action, order, removePages } = req.body;

    console.log('Processing PDF with token:', token);
    console.log('Action:', action);
    console.log('Order:', order);
    console.log('Remove pages:', removePages);

    // Check authentication
    if (!req.session.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        errorCode: 'AUTH_REQUIRED'
      });
    }

    // Check Pro status
    if (!req.isProUser) {
      return res.status(403).json({
        success: false,
        message: 'PDF editing is only available for Pro users',
        errorCode: 'PRO_FEATURE_REQUIRED'
      });
    }

    // ✅ FIX: Check global.downloadTokens instead of qrService
    if (!global.downloadTokens || !global.downloadTokens.has(token)) {
      return res.status(404).json({
        success: false,
        message: 'File not found or expired',
        errorCode: 'FILE_NOT_FOUND'
      });
    }

    const tokenData = global.downloadTokens.get(token);

    if (!tokenData.results || tokenData.results.length < 1) {
      return res.status(404).json({
        success: false,
        message: 'No file to edit',
        errorCode: 'FILE_NOT_FOUND'
      });
    }

    const result = tokenData.results[0];
    const absolutePath = path.isAbsolute(result.outputPath)
      ? result.outputPath
      : path.join(process.cwd(), result.outputPath);

    if (!fs.existsSync(absolutePath)) {
      throw new Error('File not found');
    }

    const pdfBytes = fs.readFileSync(absolutePath);
    
    // Load the original PDF
    const PDFDocument = require('pdf-lib').PDFDocument;
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // Create a new PDF document
    const newPdfDoc = await PDFDocument.create();
    
    // Determine which pages to include
    let pageIndices = [];
    
    if (action === 'reorder' && order && Array.isArray(order)) {
      pageIndices = order;
    } else {
      pageIndices = pdfDoc.getPageIndices();
    }
    
    // Filter out removed pages
    if (removePages && Array.isArray(removePages) && removePages.length > 0) {
      pageIndices = pageIndices.filter(index => !removePages.includes(index));
    }
    
    // Copy selected pages to new document
    if (pageIndices.length > 0) {
      const pages = await newPdfDoc.copyPages(pdfDoc, pageIndices);
      pages.forEach(page => newPdfDoc.addPage(page));
    }
    
    // Save the processed PDF
    const processedPdfBytes = await newPdfDoc.save();
    
    // Create a temporary file for the processed PDF
    const tempDir = require('os').tmpdir();
    const tempFileName = `processed_${Date.now()}_${result.fileName}`;
    const tempFilePath = path.join(tempDir, tempFileName);
    
    fs.writeFileSync(tempFilePath, processedPdfBytes);
    
    // Generate new token for processed file
    const newToken = `compress_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // Store in global tokens
    if (!global.downloadTokens) global.downloadTokens = new Map();
    
    global.downloadTokens.set(newToken, {
      results: [{
        outputPath: tempFilePath,
        fileName: `edited-${result.fileName}`,
        originalName: result.fileName,
        compressedSize: processedPdfBytes.length,
        originalSize: result.compressedSize
      }],
      timestamp: Date.now(),
      expiry: Date.now() + (10 * 60 * 1000) // 10 minutes
    });

    // Set cleanup timeout
    setTimeout(() => {
      if (global.downloadTokens.has(newToken)) {
        const tokenData = global.downloadTokens.get(newToken);
        tokenData.results.forEach(result => {
          try {
            if (result.outputPath && fs.existsSync(result.outputPath)) {
              fs.unlinkSync(result.outputPath);
            }
          } catch (err) {
            console.warn(`Cleanup error:`, err.message);
          }
        });
        global.downloadTokens.delete(newToken);
      }
    }, 10 * 60 * 1000);

    res.json({
      success: true,
      newToken: newToken,
      fileName: `edited-${result.fileName}`,
      fileSize: processedPdfBytes.length,
      pageCount: pageIndices.length,
      expiresAt: Date.now() + (10 * 60 * 1000)
    });

  } catch (error) {
    console.error('PDF processing failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process PDF',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};