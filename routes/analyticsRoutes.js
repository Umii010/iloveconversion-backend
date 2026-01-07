const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

router.get('/dashboard', analyticsController.getDashboardStats);
router.get('/tools/performance', analyticsController.getToolPerformance);
router.get('/trends/usage', analyticsController.getUsageTrends);
router.get('/trends/users', analyticsController.getUserGrowth);
router.get('/stats/devices-countries', analyticsController.getDeviceCountryStats);

module.exports = router;