const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const AdmZip = require('adm-zip');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 10 // Max 10 files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/heic',
      'image/heif',
      'image/heic-sequence',
      'image/heif-sequence'
    ];
    
    if (allowedTypes.includes(file.mimetype) || 
        file.originalname.toLowerCase().endsWith('.heic') ||
        file.originalname.toLowerCase().endsWith('.heif')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only HEIC/HEIF files are allowed.'), false);
    }
  }
});

// Validation middleware
const validateConversionRequest = (req, res, next) => {
  const { format, quality, batchConvert } = req.body;
  
  const allowedFormats = ['png', 'jpeg', 'jpg', 'webp', 'bmp', 'gif'];
  
  if (!format || !allowedFormats.includes(format.toLowerCase())) {
    return res.status(400).json({
      success: false,
      error: 'Invalid format. Allowed formats: png, jpeg, webp, bmp, gif'
    });
  }
  
  if (quality && (quality < 10 || quality > 100)) {
    return res.status(400).json({
      success: false,
      error: 'Quality must be between 10 and 100'
    });
  }
  
  if (req.files && req.files.length > 10) {
    return res.status(400).json({
      success: false,
      error: 'Free version limited to 10 files. Upgrade to Pro for more.',
      requiresPro: true,
      maxFreeFiles: 10
    });
  }
  
  next();
};

// Pro version validation middleware
const validateProRequest = (req, res, next) => {
  const { apiKey } = req.headers;
  
  // Check if user has pro subscription
  // In production, you would validate against your database
  const isPro = apiKey && isValidProKey(apiKey); // Implement this function
  
  if (!isPro) {
    return res.status(403).json({
      success: false,
      error: 'Pro subscription required',
      upgradeUrl: '/pricing',
      maxFreeFiles: 10
    });
  }
  
  // Pro users can upload more files
  req.upload = multer({
    storage: storage,
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB for pro
      files: 100 // 100 files for pro
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = [
        'image/heic',
        'image/heif',
        'image/heic-sequence',
        'image/heif-sequence'
      ];
      
      if (allowedTypes.includes(file.mimetype) || 
          file.originalname.toLowerCase().endsWith('.heic') ||
          file.originalname.toLowerCase().endsWith('.heif')) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type'), false);
      }
    }
  });
  
  next();
};

const convertFile = async (fileBuffer, format, quality = 90) => {
  try {
    const outputFormat = format === 'jpg' ? 'jpeg' : format;

    const buffer = await sharp(fileBuffer)
      .toFormat(outputFormat, { quality })
      .toBuffer();

    return {
      success: true,
      buffer,
      format: outputFormat,
      mimeType: `image/${outputFormat}`
    };
  } catch (error) {
    throw new Error(`Failed to convert file: ${error.message}`);
  }
};


// Main conversion controller
const convertHeicFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }
    
    const { format = 'png', quality = 90, batchConvert = false } = req.body;
    const files = req.files;
    
    // Validate file count for free users
    const isPro = req.headers['x-pro-key'] && await validateProKey(req.headers['x-pro-key']);
    const maxFiles = isPro ? 100 : 10;
    
    if (files.length > maxFiles) {
      return res.status(400).json({
        success: false,
        error: `File limit exceeded. Max ${maxFiles} files${isPro ? '' : ' in free version'}`,
        requiresPro: !isPro,
        maxFiles,
        upgradeUrl: !isPro ? '/pricing' : null
      });
    }
    
    const conversionPromises = files.map(async (file, index) => {
      try {
        const result = await convertFile(file.buffer, format, quality);
        
        return {
          success: true,
          originalName: file.originalname,
          fileName: `${path.parse(file.originalname).name}.${format}`,
          buffer: result.buffer,
          size: result.buffer.length,
          mimeType: result.mimeType,
          index
        };
      } catch (error) {
        return {
          success: false,
          originalName: file.originalname,
          error: error.message,
          index
        };
      }
    });
    
    const results = await Promise.all(conversionPromises);
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    if (batchConvert && successful.length > 0) {
      // Create ZIP file
      const zip = new AdmZip();
      
      successful.forEach(result => {
        zip.addFile(result.fileName, result.buffer);
      });
      
      const zipBuffer = zip.toBuffer();
      
      return res.json({
        success: true,
        message: `Converted ${successful.length} file(s)${failed.length > 0 ? `, ${failed.length} failed` : ''}`,
        data: {
          batch: true,
          zipSize: zipBuffer.length,
          fileCount: successful.length,
          format,
          failedFiles: failed.map(f => ({
            name: f.originalName,
            error: f.error
          }))
        },
        zip: zipBuffer.toString('base64')
      });
    } else {
      // Return individual files
      return res.json({
        success: true,
        message: `Converted ${successful.length} file(s)${failed.length > 0 ? `, ${failed.length} failed` : ''}`,
        data: {
          batch: false,
          files: successful.map(f => ({
            name: f.fileName,
            size: f.size,
            mimeType: f.mimeType,
            data: f.buffer.toString('base64')
          })),
          failedFiles: failed.map(f => ({
            name: f.originalName,
            error: f.error
          }))
        }
      });
    }
    
  } catch (error) {
    console.error('Controller error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};

// Get conversion status
const getConversionStatus = async (req, res) => {
  try {
    const { conversionId } = req.params;
    
    // In production, you would fetch from database/redis
    const status = req.app.get('conversionStatus')[conversionId];
    
    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'Conversion not found'
      });
    }
    
    return res.json({
      success: true,
      data: status
    });
    
  } catch (error) {
    console.error('Status error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Health check endpoint
const healthCheck = (req, res) => {
  return res.json({
    success: true,
    message: 'HEIC Converter API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    limits: {
      free: {
        maxFiles: 10,
        maxFileSize: '50MB',
        allowedFormats: ['png', 'jpeg', 'webp', 'bmp', 'gif']
      },
      pro: {
        maxFiles: 100,
        maxFileSize: '100MB',
        allowedFormats: ['png', 'jpeg', 'webp', 'bmp', 'gif', 'tiff']
      }
    }
  });
};

// Rate limiting middleware (using express-rate-limit)
const rateLimiter = require('express-rate-limit');

const freeRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per windowMs for free
  message: {
    success: false,
    error: 'Too many conversion requests. Please try again later.',
    retryAfter: 900 // seconds
  },
  standardHeaders: true,
  legacyHeaders: false
});

const proRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 500, // 500 requests for pro
  message: {
    success: false,
    error: 'Rate limit exceeded for pro account'
  }
});

module.exports = {
  upload,
  validateConversionRequest,
  validateProRequest,
  convertHeicFiles,
  getConversionStatus,
  healthCheck,
  freeRateLimit,
  proRateLimit
};