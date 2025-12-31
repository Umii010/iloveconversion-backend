const path = require('path');
const os = require('os');
const fs = require('fs');
const { exec } = require('child_process');

exports.pdfToWord = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No PDF uploaded' });
  }

  const inputPath = req.file.path; 
  const originalName = path.parse(req.file.originalname).name;
  const tempDir = os.tmpdir(); 
  const outputPath = path.join(tempDir, `${originalName}.docx`);

  const pythonPath = `"C:\\Users\\Admin\\AppData\\Local\\Python\\pythoncore-3.10-64\\python.exe"`;

  const scriptPath = path.join(__dirname, 'pdf_to_word.py');


  const command = `${pythonPath} "${scriptPath}" "${inputPath}" "${outputPath}"`;

  exec(command, (error, stdout, stderr) => {
    try { fs.unlinkSync(inputPath); } catch (err) { console.error(err); }

    if (error) {
      console.error('PDF to Word conversion failed:', stderr || error);
      return res.status(500).json({ success: false, message: 'Conversion failed' });
    }

    if (!fs.existsSync(outputPath)) {
      console.error('Converted DOCX not found:', outputPath);
      return res.status(500).json({ success: false, message: 'Converted file not found' });
    }

    res.download(outputPath, `${originalName}.docx`, (err) => {
      if (err) console.error('Error sending Word file:', err);
      try { fs.unlinkSync(outputPath); } catch (err) { console.error(err); }
    });
  });
};
