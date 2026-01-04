const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const Logger = require('../services/logger');

const execPromise = util.promisify(exec);

const sanitizeFilename = (filename) => {
  return filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
};

const escapePathForWindows = (filePath) => {
  return `"${filePath.replace(/\\/g, '/').replace(/"/g, '\\"')}"`;
};

exports.compressPdf = async (req, res) => {
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
        
        filesToDelete.forEach(filePath => {
          try {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
              console.log(`Cleaned up: ${filePath}`);
            }
          } catch (err) {
            console.warn(`Could not delete ${filePath}:`, err.message);
          }
        });
      }, 2000);
    });
  
    fileStream.on('error', (err) => {
      console.error('Stream error:', err);
      res.status(500).end();
    });

  } catch (error) {
    console.error('Compression error:', error.message);
     Logger.logUsage(req, 'pdf_compress', false).catch(() => {}); 
    if (error.stdout) console.error('GhostScript stdout:', error.stdout);
    if (error.stderr) console.error('GhostScript stderr:', error.stderr);
    
    const filesToDelete = [
      originalTempPath,
      sanitizedTempPath,
      outputPath
    ].filter(Boolean);
    
    filesToDelete.forEach(filePath => {
      try {
        if (filePath && fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.warn(`Cleanup error for ${filePath}:`, err.message);
      }
    });
    
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