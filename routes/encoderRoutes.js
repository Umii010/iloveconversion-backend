const express = require('express');
const router = express.Router();
const EncoderController = require('../controllers/encoderController');

// Simple middleware that allows all requests
const allowAll = (req, res, next) => {
  next();
};

// URL Encoding/Decoding
router.post('/url-encode', allowAll, EncoderController.urlEncode);
router.post('/url-decode', allowAll, EncoderController.urlDecode);

// Base64 Encoding/Decoding
router.post('/base64-encode', allowAll, EncoderController.base64Encode);
router.post('/base64-decode', allowAll, EncoderController.base64Decode);

// ASCII Conversion
router.post('/ascii-to-text', allowAll, EncoderController.asciiToText);
router.post('/text-to-ascii', allowAll, EncoderController.textToAscii);

// HTML Encoding/Decoding
router.post('/html-encode', allowAll, EncoderController.htmlEncode);
router.post('/html-decode', allowAll, EncoderController.htmlDecode);

router.post('/hex-encode', allowAll, EncoderController.hexEncode);
router.post('/hex-decode', allowAll, EncoderController.hexDecode);
router.post('/binary-encode', allowAll, EncoderController.binaryEncode);
router.post('/binary-decode', allowAll, EncoderController.binaryDecode);
router.post('/utf8-encode', allowAll, EncoderController.utf8Encode);

// Utility methods
router.post('/validate-encoding', allowAll, EncoderController.validateEncoding);
router.post('/batch-process', allowAll, EncoderController.batchProcess);

module.exports = router;