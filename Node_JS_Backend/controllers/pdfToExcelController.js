const path = require('path');
const os = require('os');
const fs = require('fs');
const { exec } = require('child_process');

exports.pdfToExcel = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No PDF uploaded' });
  }

  const inputPath = req.file.path;
  const originalName = path.parse(req.file.originalname).name;
  const outputPath = path.join(os.tmpdir(), `${originalName}.xlsx`);

  const pythonPath = `"C:\\Users\\Admin\\AppData\\Local\\Python\\pythoncore-3.10-64\\python.exe"`;
  const scriptPath = path.join(__dirname, 'pdf_to_excel.py');

  const command = `${pythonPath} "${scriptPath}" "${inputPath}" "${outputPath}"`;

  exec(command, (error, stdout, stderr) => {
    try { fs.unlinkSync(inputPath); } catch {}

    if (error) {
      console.error('PDF to Excel failed:', stderr || error);
      return res.status(500).json({
        success: false,
        message: 'PDF to Excel conversion failed (tables required)'
      });
    }

    if (!fs.existsSync(outputPath)) {
      return res.status(500).json({
        success: false,
        message: 'Excel file not created'
      });
    }

    res.download(outputPath, `${originalName}.xlsx`, () => {
      try { fs.unlinkSync(outputPath); } catch {}
    });
  });
};
