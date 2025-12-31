const path = require('path');
const os = require('os');
const fs = require('fs');
const { exec } = require('child_process');

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

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error('OCR PDF failed:', stderr || error);
      return res.status(500).json({ success: false, message: 'OCR PDF conversion failed' });
    }

    if (!fs.existsSync(outputPath)) {
      return res.status(500).json({ success: false, message: 'OCR PDF not created' });
    }

    res.download(outputPath, `${originalName}_ocr.pdf`, () => {
      setTimeout(() => {
        try { fs.unlinkSync(inputPath); } catch {}
        try { fs.unlinkSync(outputPath); } catch {}
      }, 3000);
    });
  });
};
