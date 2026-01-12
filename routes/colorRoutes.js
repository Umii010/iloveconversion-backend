const express = require('express');
const router = express.Router();
const colorExtractorController = require('../controllers/colorExtractorController');

router.post('/extract', colorExtractorController.extractColors);

module.exports = router;