const express = require('express');
const router = express.Router();
const codeDiffController = require('../controllers/codeDiffController');

router.post('/compare', codeDiffController.compareCode);

module.exports = router;