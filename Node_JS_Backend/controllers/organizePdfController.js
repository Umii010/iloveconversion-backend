const fs = require('fs');
const path = require('path');
const os = require('os');
const { PDFDocument } = require('pdf-lib');


exports.organizePdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No PDF uploaded' });
    }

    const pdfPath = req.file.path;
    const originalName = path.parse(req.file.originalname).name;
    const tempDir = os.tmpdir();
    const outputPath = path.join(tempDir, `${originalName}_organized.pdf`);

    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    const totalPages = pdfDoc.getPageCount();

    const actions = req.body.actions || [];

    for (let i = actions.length - 1; i >= 0; i--) {
      const act = actions[i];
      if (act.action === 'delete' && act.page <= totalPages) {
        pdfDoc.removePage(act.page - 1); 
      }
    }

    const reorderActions = actions.filter(a => a.action === 'reorder');
    if (reorderActions.length) {
      const pages = pdfDoc.getPages();
      const newDoc = await PDFDocument.create();
    

      const order = reorderActions.map(o => o.from);
      for (let i = 0; i < pages.length; i++) {
        if (!order.includes(i + 1)) order.push(i + 1);
      }

      for (let idx of order) {
        const [copied] = await newDoc.copyPages(pdfDoc, [idx - 1]);
        newDoc.addPage(copied);
      }

      const modifiedBytes = await newDoc.save();
      fs.writeFileSync(outputPath, modifiedBytes);
    } else {
      const modifiedBytes = await pdfDoc.save();
      fs.writeFileSync(outputPath, modifiedBytes);
    }

    res.download(outputPath, `${originalName}_organized.pdf`, () => {
      setTimeout(() => {
        try { fs.unlinkSync(pdfPath); } catch {}
        try { fs.unlinkSync(outputPath); } catch {}
      }, 3000);
    });

  } catch (err) {
    console.error('PDF Organize failed:', err);
    res.status(500).json({ success: false, message: 'PDF organize failed' });
  }
};
