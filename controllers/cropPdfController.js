const fs = require('fs');
const path = require('path');
const os = require('os');
const { PDFDocument, rgb } = require('pdf-lib');

/**
 * req.body.crop: { left, right, top, bottom } in points (1/72 inch)
 */
exports.cropPdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No PDF uploaded' });
    }

    const pdfPath = req.file.path;
    const originalName = path.parse(req.file.originalname).name;
    const tempDir = os.tmpdir();
    const outputPath = path.join(tempDir, `${originalName}_cropped.pdf`);

    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    const crop = req.body.crop || {};
    const left = parseFloat(crop.left || 0);
    const right = parseFloat(crop.right || 0);
    const top = parseFloat(crop.top || 0);
    const bottom = parseFloat(crop.bottom || 0);

    pdfDoc.getPages().forEach(page => {
      const { width, height } = page.getSize();
      const newWidth = width - left - right;
      const newHeight = height - top - bottom;
      page.setCropBox(left, bottom, newWidth, newHeight);
    });

    const modifiedBytes = await pdfDoc.save();
    fs.writeFileSync(outputPath, modifiedBytes);

    res.download(outputPath, `${originalName}_cropped.pdf`, () => {
      setTimeout(() => {
        try { fs.unlinkSync(pdfPath); } catch {}
        try { fs.unlinkSync(outputPath); } catch {}
      }, 3000);
    });

  } catch (err) {
    console.error('PDF Crop failed:', err);
    res.status(500).json({ success: false, message: 'PDF crop failed' });
  }
};
