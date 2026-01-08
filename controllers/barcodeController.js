const bwipjs = require('bwip-js'); // For barcode generation
const QRCode = require('qrcode'); // For QR code generation
const JsBarcode = require('jsbarcode'); // For additional barcode support
const Logger = require('../services/logger');

class BarcodeController {
  
  // Generate Barcode
  generateBarcode = async (req, res) => {
    try {
      const { 
        text, 
        type = 'code128', 
        scale = 3, 
        height = 100,
        background = '#ffffff',
        foreground = '#000000',
        includeText = true,
        textMargin = 10,
        fontSize = 20
      } = req.body;

      if (!text || text.trim() === '') {
        return res.status(400).json({ error: 'Text content is required' });
      }

      // Validate barcode type
      const validTypes = [
        'code128', 'code39', 'ean13', 'ean8', 'upc', 'itf14',
        'pharmacode', 'codabar', 'datamatrix', 'qrcode'
      ];
      
      if (!validTypes.includes(type.toLowerCase())) {
        return res.status(400).json({ error: 'Invalid barcode type' });
      }

      // Create canvas
      const canvas = createCanvas();
      
      // Generate barcode using jsbarcode
      JsBarcode(canvas, text, {
        format: type,
        width: scale,
        height: height,
        displayValue: includeText,
        text: includeText ? text : '',
        fontOptions: 'bold',
        fontSize: fontSize,
        textMargin: textMargin,
        background: background,
        lineColor: foreground,
        margin: 20
      });

      // Convert to base64
      const barcodeData = canvas.toDataURL();
      
      Logger.logUsage(req, 'generate_barcode', true).catch(() => {});

      res.json({
        success: true,
        barcode: barcodeData,
        text: text,
        type: type,
        format: 'data:image/png;base64',
        downloadUrl: barcodeData,
        message: 'Barcode generated successfully'
      });

    } catch (error) {
      console.error('Barcode generation error:', error);
      Logger.logUsage(req, 'generate_barcode', false).catch(() => {});
      res.status(500).json({ error: 'Failed to generate barcode: ' + error.message });
    }
  };

  // Generate QR Code
  generateQRCode = async (req, res) => {
    try {
      const { 
        text, 
        size = 300,
        margin = 4,
        dark = '#000000',
        light = '#ffffff',
        errorCorrectionLevel = 'M',
        includeLogo = false,
        logoData = null,
        logoSize = 60
      } = req.body;

      if (!text || text.trim() === '') {
        return res.status(400).json({ error: 'Text content is required' });
      }

      // Create QR code with options
      const options = {
        errorCorrectionLevel: errorCorrectionLevel,
        margin: margin,
        width: size,
        color: {
          dark: dark,
          light: light
        }
      };

      // Generate QR code data URL
      const qrDataUrl = await QRCode.toDataURL(text, options);

      // If logo is requested, combine with QR code
      let finalDataUrl = qrDataUrl;
      if (includeLogo && logoData) {
        const canvas = createCanvas(size, size);
        const ctx = canvas.getContext('2d');
        
        // Load QR code image
        const qrImg = new Canvas.Image();
        qrImg.src = Buffer.from(qrDataUrl.split(',')[1], 'base64');
        
        // Draw QR code
        ctx.drawImage(qrImg, 0, 0, size, size);
        
        // Load and draw logo
        const logoImg = new Canvas.Image();
        logoImg.src = Buffer.from(logoData.split(',')[1], 'base64');
        
        // Calculate logo position (center)
        const logoX = (size - logoSize) / 2;
        const logoY = (size - logoSize) / 2;
        
        // Draw logo with white background
        ctx.fillStyle = light;
        ctx.fillRect(logoX - 5, logoY - 5, logoSize + 10, logoSize + 10);
        ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
        
        // Convert to data URL
        finalDataUrl = canvas.toDataURL();
      }

      Logger.logUsage(req, 'generate_qrcode', true).catch(() => {});

      res.json({
        success: true,
        qrcode: finalDataUrl,
        text: text,
        size: size,
        format: 'data:image/png;base64',
        downloadUrl: finalDataUrl,
        message: 'QR Code generated successfully'
      });

    } catch (error) {
      console.error('QR Code generation error:', error);
      Logger.logUsage(req, 'generate_qrcode', false).catch(() => {});
      res.status(500).json({ error: 'Failed to generate QR code: ' + error.message });
    }
  };

  // Generate Barcode from Product Data
  generateProductBarcode = async (req, res) => {
    try {
      const { 
        productName,
        productId,
        price,
        currency = 'USD',
        manufacturer,
        expiryDate,
        batchNumber,
        type = 'code128'
      } = req.body;

      if (!productId) {
        return res.status(400).json({ error: 'Product ID is required' });
      }

      // Create structured data for barcode
      const barcodeText = productId;
      const displayText = `${productName || 'Product'}\nID: ${productId}\n${price ? `Price: ${currency}${price}` : ''}`;

      // Create canvas with more height for additional info
      const canvas = createCanvas();
      const height = 150;
      
      JsBarcode(canvas, barcodeText, {
        format: type,
        width: 2,
        height: 80,
        displayValue: true,
        text: displayText,
        fontSize: 16,
        textMargin: 15,
        background: '#ffffff',
        lineColor: '#000000',
        margin: 25
      });

      // Add additional product info
      const ctx = canvas.getContext('2d');
      ctx.font = '12px Arial';
      ctx.fillStyle = '#666666';
      
      let infoY = 120;
      if (manufacturer) {
        ctx.fillText(`Manufacturer: ${manufacturer}`, 20, infoY);
        infoY += 20;
      }
      if (expiryDate) {
        ctx.fillText(`Expiry: ${expiryDate}`, 20, infoY);
        infoY += 20;
      }
      if (batchNumber) {
        ctx.fillText(`Batch: ${batchNumber}`, 20, infoY);
      }

      const barcodeData = canvas.toDataURL();

      res.json({
        success: true,
        barcode: barcodeData,
        productId: productId,
        productName: productName,
        price: price,
        format: 'data:image/png;base64',
        downloadUrl: barcodeData,
        message: 'Product barcode generated successfully'
      });

    } catch (error) {
      console.error('Product barcode generation error:', error);
      res.status(500).json({ error: 'Failed to generate product barcode' });
    }
  };

  // Generate QR Code with Contact Info (vCard)
  generateContactQR = async (req, res) => {
    try {
      const {
        name,
        phone,
        email,
        company,
        title,
        website,
        address,
        note
      } = req.body;

      if (!name && !phone && !email) {
        return res.status(400).json({ error: 'At least one contact field is required' });
      }

      // Create vCard string
      let vCard = 'BEGIN:VCARD\nVERSION:3.0\n';
      
      if (name) vCard += `FN:${name}\n`;
      if (phone) vCard += `TEL:${phone}\n`;
      if (email) vCard += `EMAIL:${email}\n`;
      if (company) vCard += `ORG:${company}\n`;
      if (title) vCard += `TITLE:${title}\n`;
      if (website) vCard += `URL:${website}\n`;
      if (address) vCard += `ADR:${address}\n`;
      if (note) vCard += `NOTE:${note}\n`;
      
      vCard += 'END:VCARD';

      // Generate QR code
      const qrDataUrl = await QRCode.toDataURL(vCard, {
        errorCorrectionLevel: 'H',
        margin: 4,
        width: 300,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });

      res.json({
        success: true,
        qrcode: qrDataUrl,
        contact: { name, phone, email, company },
        format: 'data:image/png;base64',
        downloadUrl: qrDataUrl,
        message: 'Contact QR code generated successfully'
      });

    } catch (error) {
      console.error('Contact QR generation error:', error);
      res.status(500).json({ error: 'Failed to generate contact QR code' });
    }
  };

  // Generate QR Code for WiFi
  generateWiFiQR = async (req, res) => {
    try {
      const {
        ssid,
        password,
        encryption = 'WPA',
        hidden = false
      } = req.body;

      if (!ssid) {
        return res.status(400).json({ error: 'WiFi SSID is required' });
      }

      // Create WiFi QR code string
      const wifiString = `WIFI:S:${ssid};T:${encryption};P:${password || ''};H:${hidden};;`;

      const qrDataUrl = await QRCode.toDataURL(wifiString, {
        errorCorrectionLevel: 'H',
        margin: 4,
        width: 300
      });

      res.json({
        success: true,
        qrcode: qrDataUrl,
        wifi: { ssid, encryption, hidden: hidden ? 'Yes' : 'No' },
        format: 'data:image/png;base64',
        downloadUrl: qrDataUrl,
        message: 'WiFi QR code generated successfully'
      });

    } catch (error) {
      console.error('WiFi QR generation error:', error);
      res.status(500).json({ error: 'Failed to generate WiFi QR code' });
    }
  };

  // Generate Event QR Code (for tickets, etc.)
  generateEventQR = async (req, res) => {
    try {
      const {
        eventName,
        eventDate,
        eventTime,
        venue,
        ticketId,
        attendeeName,
        seatNumber,
        price,
        organizer
      } = req.body;

      if (!eventName || !ticketId) {
        return res.status(400).json({ error: 'Event name and ticket ID are required' });
      }

      // Create structured event data
      const eventData = JSON.stringify({
        event: eventName,
        date: eventDate,
        time: eventTime,
        venue: venue,
        ticketId: ticketId,
        attendee: attendeeName,
        seat: seatNumber,
        price: price,
        organizer: organizer,
        timestamp: new Date().toISOString()
      });

      const qrDataUrl = await QRCode.toDataURL(eventData, {
        errorCorrectionLevel: 'H',
        margin: 4,
        width: 300
      });

      res.json({
        success: true,
        qrcode: qrDataUrl,
        event: eventName,
        ticketId: ticketId,
        format: 'data:image/png;base64',
        downloadUrl: qrDataUrl,
        message: 'Event QR code generated successfully'
      });

    } catch (error) {
      console.error('Event QR generation error:', error);
      res.status(500).json({ error: 'Failed to generate event QR code' });
    }
  };

  // Batch Generate Multiple Barcodes
  batchGenerateBarcodes = async (req, res) => {
    try {
      const { items, type = 'code128' } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Items array is required' });
      }

      if (items.length > 50) {
        return res.status(400).json({ error: 'Maximum 50 items allowed per batch' });
      }

      const results = [];

      for (const item of items) {
        try {
          const canvas = createCanvas();
          
          JsBarcode(canvas, item.text || item.id || item, {
            format: type,
            width: 2,
            height: 100,
            displayValue: true,
            text: item.label || item.text || item.id || item,
            fontSize: 14,
            background: '#ffffff',
            lineColor: '#000000'
          });

          results.push({
            text: item.text || item.id || item,
            label: item.label || item.text || item.id || item,
            barcode: canvas.toDataURL(),
            success: true
          });
        } catch (itemError) {
          results.push({
            text: item.text || item.id || item,
            error: itemError.message,
            success: false
          });
        }
      }

      res.json({
        success: true,
        count: results.length,
        items: results,
        message: `Successfully generated ${results.filter(r => r.success).length} barcodes`
      });

    } catch (error) {
      console.error('Batch generation error:', error);
      res.status(500).json({ error: 'Failed to generate batch barcodes' });
    }
  };

  // Validate Barcode (Simulate scanning)
  validateBarcode = async (req, res) => {
    try {
      const { barcode, type = 'auto' } = req.body;

      if (!barcode) {
        return res.status(400).json({ error: 'Barcode data is required' });
      }

      // This is a simulation - in real app, you'd use a barcode scanning library
      // For now, we'll validate basic patterns
      const validations = {
        ean13: /^\d{13}$/,
        ean8: /^\d{8}$/,
        upc: /^\d{12}$/,
        code128: /^[\x00-\x7F]+$/,
        code39: /^[A-Z0-9\-\s\.\+\$\/\%]+$/i,
        itf14: /^\d{14}$/
      };

      let isValid = false;
      let detectedType = 'unknown';
      let checksumValid = false;

      // Try to detect type
      for (const [barcodeType, pattern] of Object.entries(validations)) {
        if (pattern.test(barcode)) {
          detectedType = barcodeType;
          isValid = true;
          break;
        }
      }

      // If auto-detection failed but user specified type
      if (!isValid && type !== 'auto' && validations[type]) {
        isValid = validations[type].test(barcode);
        detectedType = type;
      }

      // Basic checksum validation for EAN-13
      if (detectedType === 'ean13') {
        const digits = barcode.split('').map(Number);
        let sum = 0;
        for (let i = 0; i < 12; i++) {
          sum += digits[i] * (i % 2 === 0 ? 1 : 3);
        }
        const checksum = (10 - (sum % 10)) % 10;
        checksumValid = checksum === digits[12];
      }

      res.json({
        success: true,
        barcode: barcode,
        type: detectedType,
        valid: isValid,
        checksumValid: checksumValid,
        length: barcode.length,
        message: isValid ? 'Barcode appears valid' : 'Barcode may be invalid'
      });

    } catch (error) {
      console.error('Barcode validation error:', error);
      res.status(500).json({ error: 'Failed to validate barcode' });
    }
  };
}

module.exports = new BarcodeController();