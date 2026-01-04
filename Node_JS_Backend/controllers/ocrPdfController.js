const path = require('path');
const os = require('os');
const fs = require('fs');
const { exec } = require('child_process');
const Logger = require('../services/logger');


exports.ocrPdf = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No PDF uploaded' });
  }

  const inputPath = req.file.path;
  const originalName = path.parse(req.file.originalname).name;
  const tempDir = os.tmpdir();
  const outputPath = path.join(tempDir, `${originalName}_ocr.pdf`);

  const pythonPath = `"C:\\Users\\Admin\\AppData\\Local\\Python\\pythoncore-3.10-64\\python.exe"`;
  const scriptPath = path.join(__dirname, 'ocr_pdf.py');

  const command = `${pythonPath} "${scriptPath}" "${inputPath}" "${outputPath}"`;
  const startTime = Date.now();

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error('OCR PDF failed:', stderr || error);
            Logger.logUsage(req, 'ocr_pdf', false).catch(() => {});

      return res.status(500).json({ success: false, message: 'OCR PDF conversion failed' });
    }

    if (!fs.existsSync(outputPath)) {
            Logger.logUsage(req, 'ocr_pdf', false).catch(() => {});

      return res.status(500).json({ success: false, message: 'OCR PDF not created' });
    }
    Logger.logUsage(req, 'ocr_pdf', true).catch(() => {});

    res.download(outputPath, `${originalName}_ocr.pdf`, () => {
      setTimeout(() => {
        try { fs.unlinkSync(inputPath); } catch {}
        try { fs.unlinkSync(outputPath); } catch {}
      }, 3000);
    });
  });
};
