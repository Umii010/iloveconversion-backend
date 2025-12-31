const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

exports.mergePdfs = async (req, res) => {
  try {
    if (!req.files || req.files.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Please upload at least 2 PDF files to merge'
      });
    }

    const pdfDocs = [];

    for (const file of req.files) {
      const bytes = fs.readFileSync(file.path);
      pdfDocs.push(await PDFDocument.load(bytes));
    }

    const mergedPdf = await PDFDocument.create();

    for (const pdfDoc of pdfDocs) {
      const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const mergedPdfBytes = await mergedPdf.save();

    req.files.forEach((file) => fs.unlinkSync(file.path));

    const originalNames = req.files.map(f => path.parse(f.originalname).name);
    const mergedFileName = `${originalNames.join('-')}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${mergedFileName}"`,
      'Content-Length': mergedPdfBytes.length
    });

    res.send(Buffer.from(mergedPdfBytes));

  } catch (error) {
    console.error('PDF merge failed:', error);
    res.status(500).json({ success: false, message: 'PDF merge failed' });
  }
};
