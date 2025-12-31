const path = require('path');
const os = require('os');
const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');

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
    const totalImages = req.files.length;
    const originalSizes = req.files.map(file => file.size);
    const totalOriginalSize = originalSizes.reduce((sum, size) => sum + size, 0);
    const tempDir = os.tmpdir();
    const timestamp = Date.now();
    outputPdf = path.join(tempDir, `converted_${timestamp}.pdf`);
    const imageFiles = [];
    const imageNames = [];
    const imageSizes = [];

    for (const file of req.files) {
      const ext = path.extname(file.originalname).toLowerCase();
      
      if (!SUPPORTED_FORMATS.includes(ext)) {
        throw new Error(`Unsupported file type: ${ext}. Supported formats: PNG, JPG, JPEG, WebP, BMP, GIF, TIFF, SVG, ICO, HEIC`);
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
    const { stdout, stderr } = await execPromise(command, {
      timeout: 300000, 
      maxBuffer: 1024 * 1024 * 50 
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
      'X-Timestamp': timestamp
    });

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
    console.error('Image to PDF conversion error:', error);
    cleanup(tempFiles);
    let errorMessage = 'Image to PDF conversion failed';
    if (error.message.includes('Unsupported file type')) {
      errorMessage = error.message;
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'Conversion timed out. Too many or very large images. Try fewer images.';
    } else if (error.message.includes('ImageMagick')) {
      errorMessage = 'ImageMagick error. Make sure ImageMagick is installed properly.';
    } else if (error.message.includes('convert') || error.message.includes('magick')) {
      errorMessage = 'Image processing error. Some images might be corrupted or in unsupported format.';
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      detail: process.env.NODE_ENV === 'development' ? error.message : undefined
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