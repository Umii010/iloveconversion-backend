const fs = require('fs');
const path = require('path');
const os = require('os');
const { PDFDocument, rgb } = require('pdf-lib');

exports.signPdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No PDF uploaded' });
    }

    if (!req.body.signatureFile) {
      return res.status(400).json({ success: false, message: 'No signature uploaded' });
    }

    const pdfPath = req.file.path;
    const sigPath = req.body.signatureFile; 
    const originalName = path.parse(req.file.originalname).name;
    const tempDir = os.tmpdir();
    const outputPath = path.join(tempDir, `${originalName}_signed.pdf`);

    const pdfBytes = fs.readFileSync(pdfPath);
    const sigBytes = fs.readFileSync(sigPath);

    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pngImage = await pdfDoc.embedPng(sigBytes);

    const pages = pdfDoc.getPages();
    const firstPage = pages[0]; 
    const { width, height } = firstPage.getSize();

    const sigWidth = 150;
    const sigHeight = (pngImage.height / pngImage.width) * sigWidth;
    firstPage.drawImage(pngImage, {
      x: width - sigWidth - 50,
      y: 50,
      width: sigWidth,
      height: sigHeight,
    });

    const pdfBytesSigned = await pdfDoc.save();
    fs.writeFileSync(outputPath, pdfBytesSigned);

    res.download(outputPath, `${originalName}_signed.pdf`, () => {
      setTimeout(() => {
        try { fs.unlinkSync(pdfPath); } catch {}
        try { fs.unlinkSync(sigPath); } catch {}
        try { fs.unlinkSync(outputPath); } catch {}
      }, 3000);
    });

  } catch (err) {
    console.error('PDF signing failed:', err);
    res.status(500).json({ success: false, message: 'PDF signing failed' });
  }
};
