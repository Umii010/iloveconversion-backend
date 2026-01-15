const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const Logger = require('../services/logger');
const archiver = require('archiver');
const execPromise = util.promisify(exec);

const sanitizeFilename = (filename) => {
  return filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
};

const MAX_FILES = 15;
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
        if (req.files.length > MAX_FILES) {
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
        message: `Maximum ${MAX_FILES} files allowed. You uploaded ${req.files.length} files.`
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
        if (successful.length === 1) {
      const result = successful[0];
      const fileStream = fs.createReadStream(result.outputPath);
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="compressed_${result.cleanedName || result.fileName}"`,
        'Content-Length': result.compressedSize,
        'X-Original-Size': result.originalSize,
        'X-Compressed-Size': result.compressedSize,
        'X-Reduction-Percent': result.reductionPercent,
        'X-Compression-Ratio': result.compressionRatio,
        'X-Successful-Count': '1',
        'X-Failed-Count': failed.length.toString(),
        'X-Total-Files': req.files.length.toString()
      });
      
      fileStream.pipe(res);
      
      fileStream.on('end', () => {
        setTimeout(() => {
          cleanupTempFiles(tempFiles);
        }, 2000);
      });
      
      fileStream.on('error', (err) => {
        console.error('Stream error:', err);
        cleanupTempFiles(tempFiles);
        res.status(500).end();
      });
      
    } else {
      try {
        const zipStats = await createZipFromResults(successful, res);
                res.set({
          'X-Total-Original-Size': totalOriginalSize.toString(),
          'X-Total-Compressed-Size': totalCompressedSize.toString(),
          'X-Total-Reduction-Percent': totalReduction,
          'X-Successful-Count': successful.length.toString(),
          'X-Failed-Count': failed.length.toString(),
          'X-Total-Files': req.files.length.toString(),
          'X-Processing-Time': (Date.now() - startTime).toString()
        });
        
        res.on('finish', () => {
          setTimeout(() => {
            cleanupTempFiles(tempFiles);
          }, 2000);
        });
        
      } catch (zipError) {
        console.error('ZIP creation error:', zipError);
        cleanupTempFiles(tempFiles);
        return res.status(500).json({
          success: false,
          message: 'Failed to create ZIP archive',
          detail: zipError.message
        });
      }
    }
    
  } catch (error) {
    console.error('Batch compression error:', error.message);
    Logger.logUsage(req, 'pdf_compress', false).catch(() => {});
    cleanupTempFiles(tempFiles);
    let errorMessage = 'Compression failed';
    if (error.message.includes('undefinedfilename')) {
      errorMessage = 'Filename contains invalid characters.';
    } else if (error.code === 'ETIMEDOUT' || error.killed) {
      errorMessage = 'Compression timed out. Files might be too large or complex.';
    } else if (error.message.includes('ENOENT') || error.message.includes('No such file')) {
      errorMessage = 'File not found. The upload might have failed.';
    } else if (error.stderr && error.stderr.includes('Permission')) {
      errorMessage = 'Permission error. Make sure GhostScript is installed and accessible.';
    } else if (error.stderr && error.stderr.includes('Error')) {
      errorMessage = 'GhostScript error. The PDF might be corrupted or password-protected.';
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      detail: process.env.NODE_ENV === 'development' ? error.message : undefined,
      processingTime: Date.now() - startTime
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

exports.compressPdfSingle = async (req, res) => {
  let originalTempPath = null;
  let sanitizedTempPath = null;
  let outputPath = null;
  
  try { 
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No PDF uploaded' 
      });
    }
    
    originalTempPath = req.file.path;
    const originalName = req.file.originalname;
    const originalSize = req.file.size;
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
      console.warn('GhostScript warnings:', stderr);
    }

    if (!fs.existsSync(outputPath)) {
      throw new Error('Compressed file was not created');
    }
    
    const compressedSize = fs.statSync(outputPath).size;
    const reductionPercent = originalSize > 0 
      ? Math.max(0, ((originalSize - compressedSize) / originalSize * 100)).toFixed(2)
      : '0.00';
    
    Logger.logUsage(req, 'pdf_compress', true).catch(() => {});
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="compressed_${originalName}"`,
      'Content-Length': compressedSize,
      'X-Original-Filename': originalName,
      'X-Original-Size': originalSize,
      'X-Compressed-Size': compressedSize,
      'X-Reduction-Percent': reductionPercent,
      'X-Compression-Ratio': originalSize > 0 ? (originalSize / compressedSize).toFixed(2) : '0.00'
    });

    const fileStream = fs.createReadStream(outputPath);
    fileStream.pipe(res);

    fileStream.on('end', () => {
      setTimeout(() => {
        const filesToDelete = [
          originalTempPath,
          sanitizedTempPath,
          outputPath
        ].filter(Boolean);
        
        cleanupTempFiles(filesToDelete);
      }, 2000);
    });
  
    fileStream.on('error', (err) => {
      console.error('Stream error:', err);
      cleanupTempFiles([originalTempPath, sanitizedTempPath, outputPath]);
      res.status(500).end();
    });

  } catch (error) {
    console.error('Compression error:', error.message);
    Logger.logUsage(req, 'pdf_compress', false).catch(() => {});
    
    if (error.stdout) console.error('GhostScript stdout:', error.stdout);
    if (error.stderr) console.error('GhostScript stderr:', error.stderr);
    
    cleanupTempFiles([originalTempPath, sanitizedTempPath, outputPath]);
    
    let errorMessage = 'Compression failed';
    if (error.message.includes('undefinedfilename')) {
      errorMessage = 'Filename contains invalid characters. Please rename the file to remove parentheses, brackets, or special symbols.';
    } else if (error.code === 'ETIMEDOUT' || error.killed) {
      errorMessage = 'Compression timed out. The file might be too large or complex. Try a smaller file.';
    } else if (error.message.includes('ENOENT') || error.message.includes('No such file')) {
      errorMessage = 'File not found. The upload might have failed. Please try again.';
    } else if (error.stderr && error.stderr.includes('Permission')) {
      errorMessage = 'Permission error. Make sure GhostScript is installed and accessible.';
    } else if (error.stderr && error.stderr.includes('Error')) {
      errorMessage = 'GhostScript error. The PDF might be corrupted or password-protected.';
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      detail: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};