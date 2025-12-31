const fs = require('fs');
const path = require('path');
const os = require('os');
const { PDFDocument, degrees } = require('pdf-lib');

exports.rotatePdf = async (req, res) => {
  try {
    if (!req.files || !req.files.length) {
      return res.status(400).json({ success: false, message: 'No PDF files uploaded' });
    }

    const angle = parseInt(req.body.angle || 90, 10);
    if (![90, 180, 270].includes(angle)) {
      return res.status(400).json({ success: false, message: 'Invalid rotation angle' });
    }

    const tempDir = os.tmpdir();
    const outputFiles = [];

    for (const file of req.files) {
      const inputPath = file.path;
      const originalName = path.parse(file.originalname).name;
      const outputPath = path.join(tempDir, `${originalName}-rotated.pdf`);

      const existingPdfBytes = fs.readFileSync(inputPath);
      const pdfDoc = await PDFDocument.load(existingPdfBytes);

      pdfDoc.getPages().forEach(page => {
        page.setRotation(degrees(angle));
      });

      const pdfBytes = await pdfDoc.save();
      fs.writeFileSync(outputPath, pdfBytes);

      outputFiles.push(outputPath);

      try { fs.unlinkSync(inputPath); } catch {}
    }

    if (outputFiles.length === 1) {
      return res.download(outputFiles[0], path.basename(outputFiles[0]), () => {
        try { fs.unlinkSync(outputFiles[0]); } catch {}
      });
    }

    const archiver = require('archiver');
    const zipPath = path.join(tempDir, `rotated-pdfs.zip`);
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      res.download(zipPath, 'rotated-pdfs.zip', () => {
        try { fs.unlinkSync(zipPath); } catch {}
        outputFiles.forEach(f => { try { fs.unlinkSync(f); } catch {} });
      });
    });

    archive.pipe(output);
    outputFiles.forEach(file => {
      archive.file(file, { name: path.basename(file) });
    });
    archive.finalize();

  } catch (err) {
    console.error('Rotate PDF error:', err);
    res.status(500).json({ success: false, message: 'PDF rotation failed' });
  }
};
