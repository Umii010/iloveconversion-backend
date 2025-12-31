const path = require('path');
const os = require('os');
const fs = require('fs');
const { exec } = require('child_process');

exports.pptToPdf = (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No PowerPoint file uploaded'
    });
  }

  const inputPath = req.file.path;
  const originalName = path.parse(req.file.originalname).name;
  const tempDir = os.tmpdir();
  const outputPdf = path.join(tempDir, `${originalName}.pdf`);

  const pythonPath =
    `"C:\\Users\\Admin\\AppData\\Local\\Python\\pythoncore-3.10-64\\python.exe"`;

  const scriptPath = path.join(__dirname, 'ppt_to_pdf.py');

  const command = `${pythonPath} "${scriptPath}" "${inputPath}" "${outputPdf}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error('PPT to PDF failed:', stderr || error);
      return res.status(500).json({
        success: false,
        message: 'PowerPoint to PDF conversion failed'
      });
    }

    if (!fs.existsSync(outputPdf)) {
      return res.status(500).json({
        success: false,
        message: 'Converted PDF not found'
      });
    }

    res.download(outputPdf, `${originalName}.pdf`, () => {
      cleanup(inputPath, outputPdf);
    });
  });
};

function cleanup(input, output) {
  setTimeout(() => {
    try { fs.unlinkSync(input); } catch {}
    try { fs.unlinkSync(output); } catch {}
  }, 5000);
}
