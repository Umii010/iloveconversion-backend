const express = require('express');
const router = express.Router();
const codeDiffController = require('../controllers/codeDiffController');
const cookieParser = require('cookie-parser');

router.use(express.json()); 
router.use(cookieParser()); 

router.post('/compare', codeDiffController.compareCode);

module.exports = router;