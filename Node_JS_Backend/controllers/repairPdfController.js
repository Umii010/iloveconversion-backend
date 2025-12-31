const path = require('path');
const os = require('os');
const fs = require('fs');
const { exec } = require('child_process');

exports.repairPdf = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No PDF uploaded' });
  }

  const inputPath = req.file.path;
  const originalName = path.parse(req.file.originalname).name;
  const tempDir = os.tmpdir();
  const outputPath = path.join(tempDir, `${originalName}_repaired.pdf`);

  const pythonPath = `"C:\\Users\\Admin\\AppData\\Local\\Python\\pythoncore-3.10-64\\python.exe"`;
  const scriptPath = path.join(__dirname, 'repair_pdf.py');

  const command = `${pythonPath} "${scriptPath}" "${inputPath}" "${outputPath}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error('PDF repair failed:', stderr || error);
      return res.status(500).json({ success: false, message: 'PDF repair failed' });
    }

    if (!fs.existsSync(outputPath)) {
      return res.status(500).json({ success: false, message: 'Repaired PDF not generated' });
    }

    res.download(outputPath, `${originalName}_repaired.pdf`, () => {
      setTimeout(() => {
        try { fs.unlinkSync(inputPath); } catch {}
        try { fs.unlinkSync(outputPath); } catch {}
      }, 3000);
    });
  });
};
