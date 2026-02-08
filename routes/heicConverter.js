const express = require('express');
const router = express.Router();
const {
  dynamicUpload,
  validateConversionRequest,
  dynamicRateLimit,
  convertHeicFiles,
  getConversionStatus,
  healthCheck,
  getUserLimits
} = require('../controllers/heicConverterController');

// Health check
router.get('/health', healthCheck);

// Get current user's limits based on subscription
router.get('/limits', getUserLimits);

// Main conversion endpoint (handles both free and pro users dynamically)
router.post(
  '/convert',
  dynamicRateLimit,
  (req, res, next) => dynamicUpload(req, res, next),
  validateConversionRequest,
  convertHeicFiles
);

// Check conversion status
router.get('/status/:conversionId', getConversionStatus);

// Get subscription info
router.get('/subscription-info', (req, res) => {
  res.json({
    success: true,
    data: {
      free: {
        maxFiles: 7,
        maxFileSize: '50MB',
        dailyConversions: 50,
        features: ['Basic conversion', '7 files max', 'Standard quality']
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
        ]
      }
    }
  });
});

module.exports = router;