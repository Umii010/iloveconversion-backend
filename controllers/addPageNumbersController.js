const fs = require('fs');
const path = require('path');
const os = require('os');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

/**
 * req.body.options: {
 *   fontSize: number,
 *   color: { r: 0-1, g: 0-1, b: 0-1 },
 *   position: 'bottom-center' | 'top-center' | 'bottom-right' | 'bottom-left'
 * }
 */
exports.addPageNumbers = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No PDF uploaded' });
    }

    const pdfPath = req.file.path;
    const originalName = path.parse(req.file.originalname).name;
    const tempDir = os.tmpdir();
    const outputPath = path.join(tempDir, `${originalName}_numbered.pdf`);

    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    const options = req.body.options || {};
    const fontSize = parseInt(options.fontSize || 12);
    const color = options.color || { r: 0, g: 0, b: 0 };
    const position = options.position || 'bottom-center';

    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    pages.forEach((page, idx) => {
      const { width, height } = page.getSize();
      const text = `${idx + 1}`;

      let x = width / 2;
      let y = 20; // default bottom-center

      switch (position) {
        case 'bottom-left':
          x = 20;
          y = 20;
          break;
        case 'bottom-right':
          x = width - 20 - fontSize;
          y = 20;
          break;
        case 'top-center':
          x = width / 2;
          y = height - 30;
          break;
      }

      page.drawText(text, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(color.r, color.g, color.b),
        xSkew: 0,
        ySkew: 0,
      });
    });

    const modifiedBytes = await pdfDoc.save();
    fs.writeFileSync(outputPath, modifiedBytes);

    res.download(outputPath, `${originalName}_numbered.pdf`, () => {
      setTimeout(() => {
        try { fs.unlinkSync(pdfPath); } catch {}
        try { fs.unlinkSync(outputPath); } catch {}
      }, 3000);
    });

  } catch (err) {
    console.error('Add page numbers failed:', err);
    res.status(500).json({ success: false, message: 'Adding page numbers failed' });
  }
};
