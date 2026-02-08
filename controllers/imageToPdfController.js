const path = require('path');
const os = require('os');
const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');
const Logger = require('../services/logger');

const execPromise = util.promisify(exec);
const MAGICK_PATH = process.platform === 'win32' 
  ? '"C:\\Program Files\\ImageMagick-7.1.2-Q16-HDRI\\magick.exe"'
  : 'convert';

const SUPPORTED_FORMATS = [
  '.png', '.jpg', '.jpeg', '.webp', '.bmp', '.gif', '.tiff', '.tif',
  '.ico', '.svg', '.heic', '.heif'
];

const formatMapping = {
  '.heic': 'heic',
  '.heif': 'heif',
  '.svg': 'svg',
  '.ico': 'ico'
};

exports.imageToPdf = async (req, res) => {
  let tempFiles = [];
  let outputPdf = null;
  
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images uploaded'
      });
    }
    
    // Get limits from middleware (added by checkSubscription middleware)
    const isProUser = req.isProUser || false;
    const maxFiles = req.maxFiles || 7;
    const maxFileSize = req.maxFileSize || (100 * 1024 * 1024); // 100MB default
    
    console.log('📊 Image to PDF processing with limits:', {
      isProUser,
      maxFiles,
      maxFileSize: formatBytes(maxFileSize),
      uploadedFiles: req.files.length,
      userId: req.session?.userId || 'guest'
    });

    // Check file count against user's limit
    if (req.files.length > maxFiles) {
      Logger.logUsage(req, 'image_to_pdf', false).catch(() => {});
      return res.status(400).json({
        success: false,
        message: isProUser 
          ? `Maximum ${maxFiles} images allowed per batch. Please split your files into smaller batches.`
          : `Free users can process only ${maxFiles} images at once. Upgrade to Pro for unlimited processing.`,
        errorCode: 'MAX_FILES_EXCEEDED',
        maxAllowed: maxFiles,
        uploadedCount: req.files.length,
        isProUser: isProUser
      });
    }

    const totalImages = req.files.length;
    const originalSizes = req.files.map(file => file.size);
    const totalOriginalSize = originalSizes.reduce((sum, size) => sum + size, 0);
    
    // Check total size against user's limit
    if (totalOriginalSize > (maxFileSize * maxFiles)) {
      const totalSizeLimit = formatBytes(maxFileSize * maxFiles);
      Logger.logUsage(req, 'image_to_pdf', false).catch(() => {});
      return res.status(400).json({
        success: false,
        message: isProUser 
          ? `Total file size exceeds ${totalSizeLimit} limit. Please reduce file sizes.`
          : `Total file size exceeds ${totalSizeLimit} limit. Upgrade to Pro for larger file support.`,
        errorCode: 'TOTAL_SIZE_EXCEEDED',
        totalSize: formatBytes(totalOriginalSize),
        sizeLimit: totalSizeLimit,
        isProUser: isProUser
      });
    }
    
    const tempDir = os.tmpdir();
    const timestamp = Date.now();
    outputPdf = path.join(tempDir, `converted_${timestamp}.pdf`);
    const imageFiles = [];
    const imageNames = [];
    const imageSizes = [];

    for (const file of req.files) {
      const ext = path.extname(file.originalname).toLowerCase();
      
      if (!SUPPORTED_FORMATS.includes(ext)) {
        Logger.logUsage(req, 'image_to_pdf', false).catch(() => {});
        throw new Error(`Unsupported file type: ${ext}. Supported formats: PNG, JPG, JPEG, WebP, BMP, GIF, TIFF, SVG, ICO, HEIC`);
      }

      // Check individual file size against user's limit
      if (file.size > maxFileSize) {
        const fileSizeLimit = formatBytes(maxFileSize);
        const actualFileSize = formatBytes(file.size);
        throw new Error(`File "${file.originalname}" exceeds size limit (${actualFileSize} > ${fileSizeLimit}). ${isProUser ? 'Maximum file size is ' + fileSizeLimit + '.' : 'Upgrade to Pro for larger file support.'}`);
      }

      imageFiles.push(file);
      imageNames.push(file.originalname);
      imageSizes.push(file.size);
      tempFiles.push(file.path);
    }
    
    const imagePaths = imageFiles.map(file => `"${file.path}"`);
    const command = [
      MAGICK_PATH,
      ...imagePaths,
      '-density 300',         
      '-quality 100',         
      '-compress jpeg',       
      '-alpha remove',         
      '-background white',     
      '-auto-orient',          
      '-units pixelsperinch', 
      '-resize 2480x3508',     
      '-gravity center',       
      '-extent 2480x3508',    
      `"${outputPdf}"`
    ].join(' ');
    
    console.log(`🔄 Converting ${totalImages} images to PDF...`);
    
    const { stdout, stderr } = await execPromise(command, {
      timeout: isProUser ? 600000 : 300000, // 10 minutes for Pro, 5 minutes for free
      maxBuffer: 1024 * 1024 * (isProUser ? 100 : 50) // 100MB for Pro, 50MB for free
    });

    if (stderr && stderr.trim() && !stderr.includes('warning')) {
      console.warn('ImageMagick warnings:', stderr);
    }

    if (!fs.existsSync(outputPdf)) {
      throw new Error('PDF was not created');
    }

    const pdfSize = fs.statSync(outputPdf).size;
    tempFiles.push(outputPdf);
    const avgImageSize = totalOriginalSize / totalImages;
    const compressionRatio = totalOriginalSize > 0 ? (totalOriginalSize / pdfSize).toFixed(2) : '0.00';
    
    Logger.logUsage(req, 'image_to_pdf', true).catch(() => {});

    // Add user plan info to response headers
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="images_${timestamp}.pdf"`,
      'Content-Length': pdfSize,
      'X-Image-Count': totalImages,
      'X-Total-Original-Size': totalOriginalSize,
      'X-PDF-Size': pdfSize,
      'X-Compression-Ratio': compressionRatio,
      'X-Avg-Image-Size': avgImageSize.toFixed(0),
      'X-Supported-Formats': SUPPORTED_FORMATS.join(','),
      'X-Timestamp': timestamp,
      'X-User-Plan': isProUser ? 'pro' : 'free',
      'X-Max-Files': maxFiles,
      'X-Max-File-Size': maxFileSize,
      'X-User-Id': req.session?.userId || 'guest'
    });

    console.log(`✅ Conversion successful: ${totalImages} images, ${formatBytes(totalOriginalSize)} → ${formatBytes(pdfSize)} (${compressionRatio}x compression)`);
    
    const fileStream = fs.createReadStream(outputPdf);
    fileStream.pipe(res);

    fileStream.on('end', () => {
      setTimeout(() => {
        cleanup(tempFiles);
      }, 5000);
    });

    fileStream.on('error', (err) => {
      console.error('Stream error:', err);
      cleanup(tempFiles);
      res.status(500).end();
    });

  } catch (error) {
    console.error('❌ Image to PDF conversion error:', error);
    cleanup(tempFiles);
    
    let errorMessage = 'Image to PDF conversion failed';
    let statusCode = 500;
    let errorCode = 'INTERNAL_ERROR';
    
    if (error.message.includes('Unsupported file type')) {
      errorMessage = error.message;
      statusCode = 400;
      errorCode = 'UNSUPPORTED_FORMAT';
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'Conversion timed out. Too many or very large images. Try fewer images.';
      statusCode = 408;
      errorCode = 'TIMEOUT';
    } else if (error.message.includes('ImageMagick')) {
      errorMessage = 'ImageMagick error. Make sure ImageMagick is installed properly.';
      statusCode = 500;
      errorCode = 'IMAGEMAGICK_ERROR';
    } else if (error.message.includes('convert') || error.message.includes('magick')) {
      errorMessage = 'Image processing error. Some images might be corrupted or in unsupported format.';
      statusCode = 400;
      errorCode = 'PROCESSING_ERROR';
    } else if (error.message.includes('exceeds size limit')) {
      errorMessage = error.message;
      statusCode = 400;
      errorCode = 'FILE_TOO_LARGE';
    } else if (error.message.includes('Maximum') && error.message.includes('allowed')) {
      errorMessage = error.message;
      statusCode = 400;
      errorCode = 'MAX_FILES_EXCEEDED';
    }
    
    // Include user plan info in error response
    const isProUser = req.isProUser || false;
    const maxFiles = req.maxFiles || 7;
    
    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      errorCode: errorCode,
      detail: process.env.NODE_ENV === 'development' ? error.message : undefined,
      userPlan: isProUser ? 'pro' : 'free',
      maxAllowedFiles: maxFiles,
      isProUser: isProUser
    });
  }
};

function cleanup(files) {
  setTimeout(() => {
    files.forEach(filePath => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.warn(`Could not delete ${filePath}:`, err.message);
      }
    });
  }, 3000);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}