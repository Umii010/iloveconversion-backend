const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const AdmZip = require('adm-zip');
const User = require('../models/User'); // Import your User model

// Configure multer for memory storage
const storage = multer.memoryStorage();

// Base upload configuration (for free users)
const freeUpload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for free
    files: 7 // Max 7 files for free users
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

// Pro upload configuration
const proUpload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for pro
    files: 100 // Max 100 files for pro users
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

// Helper function to get user from session/token
const getUserFromRequest = async (req) => {
  try {
    // Check if user is authenticated via session
    if (req.session && req.session.userId) {
      const user = await User.getById(req.session.userId);
      return user;
    }
    
    // Check for JWT token in headers
    if (req.headers.authorization) {
      const token = req.headers.authorization.replace('Bearer ', '');
      // Verify JWT token and get user (you need to implement this)
      // const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // const user = await User.getById(decoded.userId);
      // return user;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user from request:', error);
    return null;
  }
};

// Dynamic upload middleware based on user subscription
const dynamicUpload = async (req, res, next) => {
  try {
    const user = await getUserFromRequest(req);
    const isPro = user ? user.is_pro : false;
    
    req.isProUser = isPro;
    req.userId = user ? user.id : null;
    
    if (isPro) {
      proUpload.array('files', 100)(req, res, (err) => {
        if (err) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              success: false,
              error: 'File too large. Pro users max 100MB per file.'
            });
          }
          if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
              success: false,
              error: 'Too many files. Pro users max 100 files.'
            });
          }
          return res.status(400).json({
            success: false,
            error: err.message
          });
        }
        next();
      });
    } else {
      freeUpload.array('files', 7)(req, res, (err) => {
        if (err) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              success: false,
              error: 'File too large. Free users max 50MB per file.'
            });
          }
          if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
              success: false,
              error: 'Too many files. Free users max 7 files. Upgrade to Pro for more.',
              requiresPro: true,
              maxFreeFiles: 7
            });
          }
          return res.status(400).json({
            success: false,
            error: err.message
          });
        }
        next();
      });
    }
  } catch (error) {
    console.error('Error in dynamic upload:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during upload'
    });
  }
};

// Validation middleware with subscription check
const validateConversionRequest = async (req, res, next) => {
  try {
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
    
    // Get user info if not already set
    if (!req.isProUser) {
      const user = await getUserFromRequest(req);
      req.isProUser = user ? user.is_pro : false;
      req.userId = user ? user.id : null;
    }
    
    const isPro = req.isProUser;
    const maxFiles = isPro ? 100 : 7;
    
    if (req.files && req.files.length > maxFiles) {
      return res.status(400).json({
        success: false,
        error: `File limit exceeded. Max ${maxFiles} files${isPro ? '' : ' in free version'}`,
        requiresPro: !isPro,
        maxFiles,
        upgradeUrl: !isPro ? '/pricing' : null
      });
    }
    
    next();
  } catch (error) {
    console.error('Validation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during validation'
    });
  }
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
    const isPro = req.isProUser || false;
    const userId = req.userId;
    
    console.log(`Processing ${files.length} files for ${isPro ? 'Pro' : 'Free'} user${userId ? ` (ID: ${userId})` : ''}`);
    
    // Additional validation based on subscription
    const maxFiles = isPro ? 100 : 7;
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
        console.error(`Error converting ${file.originalname}:`, error);
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
    
    // Track conversion for analytics (optional)
    if (userId) {
      try {
        // You could log conversion stats to database here
        console.log(`User ${userId} converted ${successful.length} files, ${failed.length} failed`);
      } catch (logError) {
        console.error('Error logging conversion:', logError);
      }
    }
    
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
          isProUser: isPro,
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
          isProUser: isPro,
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
        maxFiles: 7,
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

// Rate limiting middleware
const rateLimiter = require('express-rate-limit');

// Dynamic rate limiting based on subscription
const dynamicRateLimit = async (req, res, next) => {
  try {
    const user = await getUserFromRequest(req);
    const isPro = user ? user.is_pro : false;
    
    const limiter = rateLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: isPro ? 500 : 50, // 500 for pro, 50 for free
      message: {
        success: false,
        error: `Too many requests. ${isPro ? 'Pro' : 'Free'} users limited to ${isPro ? 500 : 50} requests per 15 minutes.`,
        retryAfter: 900
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => {
        // Use user ID if authenticated, IP if not
        return user ? `user:${user.id}` : `ip:${req.ip}`;
      }
    });
    
    limiter(req, res, next);
  } catch (error) {
    console.error('Rate limit error:', error);
    // Fallback to free rate limit
    const freeLimiter = rateLimiter({
      windowMs: 15 * 60 * 1000,
      max: 50,
      message: {
        success: false,
        error: 'Too many requests. Please try again later.',
        retryAfter: 900
      }
    });
    freeLimiter(req, res, next);
  }
};

// Pro-only endpoint validation (for special pro features)
const validateProEndpoint = async (req, res, next) => {
  try {
    const user = await getUserFromRequest(req);
    
    if (!user || !user.is_pro) {
      return res.status(403).json({
        success: false,
        error: 'Pro subscription required for this feature',
        upgradeUrl: '/pricing',
        currentPlan: user ? 'free' : 'none'
      });
    }
    
    req.isProUser = true;
    req.userId = user.id;
    next();
  } catch (error) {
    console.error('Pro validation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get user's conversion limits
const getUserLimits = async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    const isPro = user ? user.is_pro : false;
    
    return res.json({
      success: true,
      data: {
        isPro,
        maxFiles: isPro ? 100 : 7,
        maxFileSize: isPro ? '100MB' : '50MB',
        rateLimit: isPro ? '500/15min' : '50/15min',
        features: isPro ? [
          'Up to 100 files per conversion',
          '100MB max file size',
          'Priority processing',
          'Batch ZIP downloads',
          'No watermarks'
        ] : [
          'Up to 7 files per conversion',
          '50MB max file size',
          'Basic conversion'
        ]
      }
    });
  } catch (error) {
    console.error('Get limits error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

module.exports = {
  dynamicUpload, // Use this instead of separate upload middlewares
  validateConversionRequest,
  validateProEndpoint, // For pro-only features
  convertHeicFiles,
  getConversionStatus,
  healthCheck,
  dynamicRateLimit, // Use dynamic rate limiting
  getUserLimits
};