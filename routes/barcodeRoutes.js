const express = require('express');
const router = express.Router();
const BarcodeController = require('../controllers/barcodeController');
const { verifyToken } = require('../middleware/auth');

// Barcode routes
router.post('/generate-barcode', verifyToken, BarcodeController.generateBarcode);
router.post('/generate-qrcode', verifyToken, BarcodeController.generateQRCode);
router.post('/generate-product-barcode', verifyToken, BarcodeController.generateProductBarcode);
router.post('/generate-contact-qr', verifyToken, BarcodeController.generateContactQR);
router.post('/generate-wifi-qr', verifyToken, BarcodeController.generateWiFiQR);
router.post('/generate-event-qr', verifyToken, BarcodeController.generateEventQR);
router.post('/batch-generate', verifyToken, BarcodeController.batchGenerateBarcodes);
router.post('/validate-barcode', verifyToken, BarcodeController.validateBarcode);

module.exports = router;