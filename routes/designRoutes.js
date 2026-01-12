const express = require('express');
const router = express.Router();
const { extractDesign } = require('../controllers/designExtractorController');

router.post('/extract', extractDesign);

module.exports = router;