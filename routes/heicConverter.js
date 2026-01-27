const express = require('express');
const router = express.Router();
const {
  upload,
  validateConversionRequest,
  validateProRequest,
  convertHeicFiles,
  getConversionStatus,
  healthCheck,
  freeRateLimit,
  proRateLimit
} = require('../controllers/heicConverterController');

// Health check
router.get('/health', healthCheck);

// Free tier conversion
router.post(
  '/convert',
  freeRateLimit,
  upload.array('files', 10), // Max 10 files for free
  validateConversionRequest,
  convertHeicFiles
);

// Pro tier conversion
router.post(
  '/convert/pro',
  validateProRequest,
  proRateLimit,
  (req, res, next) => {
    req.upload.array('files', 100)(req, res, next); // Max 100 files for pro
  },
  validateConversionRequest,
  convertHeicFiles
);

// Check conversion status
router.get('/status/:conversionId', getConversionStatus);

// Get subscription info
router.get('/limits', (req, res) => {
  res.json({
    success: true,
    data: {
      free: {
        maxFiles: 10,
        maxFileSize: '50MB',
        dailyConversions: 50,
        features: ['Basic conversion', '10 files max', 'Standard quality']
      },
      pro: {
        maxFiles: 100,
        maxFileSize: '100MB',
        dailyConversions: 'Unlimited',
        features: [
          'Priority processing',
          '100 files max',
          'High quality',
          'Batch ZIP',
          'API access',
          'No watermarks'
        ],
        pricing: {
          monthly: '$9.99',
          yearly: '$99.99',
          lifetime: '$299.99'
        }
      }
    }
  });
});

module.exports = router;