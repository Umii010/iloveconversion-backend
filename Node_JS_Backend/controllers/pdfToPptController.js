const path = require('path');
const os = require('os');
const fs = require('fs');
const { exec } = require('child_process');

exports.pdfToPpt = (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No PDF uploaded'
    });
  }

  const inputPath = req.file.path;
  const originalName = path.parse(req.file.originalname).name;
  const outputPath = path.join(os.tmpdir(), `${originalName}.pptx`);

  const pythonPath = `"C:\\Users\\Admin\\AppData\\Local\\Python\\pythoncore-3.10-64\\python.exe"`;
  const scriptPath = path.join(__dirname, 'pdf_to_ppt.py');

  const command = `${pythonPath} "${scriptPath}" "${inputPath}" "${outputPath}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error('PDF to PPT failed:', stderr || error);
      return res.status(500).json({
        success: false,
        message: 'PDF to PPT conversion failed'
      });
    }

    if (!fs.existsSync(outputPath)) {
      return res.status(500).json({
        success: false,
        message: 'PPT file not generated'
      });
    }

    res.download(outputPath, `${originalName}.pptx`, () => {
      setTimeout(() => {
        try { fs.unlinkSync(inputPath); } catch {}
        try { fs.unlinkSync(outputPath); } catch {}
      }, 3000);
    });
  });
};
