const path = require('path');
const os = require('os');
const fs = require('fs');
const { exec } = require('child_process');
const pdf = require('pdf-parse'); // Install: npm install pdf-parse

exports.pdfToWord = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No PDF uploaded' });
  }

  const inputPath = req.file.path;
  const originalName = path.parse(req.file.originalname).name;
  const originalSize = req.file.size;
  const tempDir = os.tmpdir();
  const outputPath = path.join(tempDir, `${Date.now()}_${originalName}.docx`);

  // Get page count from PDF
  let pageCount = 'Unknown';
  try {
    const dataBuffer = fs.readFileSync(inputPath);
    const data = await pdf(dataBuffer);
    pageCount = data.numpages || 'Unknown';
  } catch (err) {
    console.log('Could not get page count:', err.message);
  }

  const pythonPath = `"C:\\Users\\Admin\\AppData\\Local\\Python\\pythoncore-3.10-64\\python.exe"`;
  const scriptPath = path.join(__dirname, 'pdf_to_word.py');

  const command = `${pythonPath} "${scriptPath}" "${inputPath}" "${outputPath}"`;

  console.log(`Starting PDF to Word conversion: ${originalName}`);

  exec(command, (error, stdout, stderr) => {
    // Clean up input file
    try { fs.unlinkSync(inputPath); } catch (err) { console.error(err); }

    if (error) {
      console.error('PDF to Word conversion failed:', stderr || error);
      return res.status(500).json({ success: false, message: 'Conversion failed: ' + (stderr || error.message) });
    }

    if (!fs.existsSync(outputPath)) {
      console.error('Converted DOCX not found:', outputPath);
      return res.status(500).json({ success: false, message: 'Converted file not found' });
    }

    // Get converted file size
    let convertedSize = 0;
    try {
      convertedSize = fs.statSync(outputPath).size;
    } catch (err) {
      console.error('Could not get converted file size:', err);
    }

    console.log(`Conversion successful: ${originalSize} bytes → ${convertedSize} bytes`);

    // Set response headers with stats
    res.setHeader('X-Original-Size', originalSize);
    res.setHeader('X-Converted-Size', convertedSize);
    res.setHeader('X-Original-Filename', `${originalName}.docx`);
    res.setHeader('X-Page-Count', pageCount);
    res.setHeader('X-Conversion-Time', Date.now());

    // Send the file
    res.download(outputPath, `${originalName}.docx`, (err) => {
      if (err) console.error('Error sending Word file:', err);
      // Clean up output file after sending
      try { 
        setTimeout(() => {
          fs.unlinkSync(outputPath);
          console.log('Cleaned up temp file:', outputPath);
        }, 5000);
      } catch (err) { console.error(err); }
    });
  });
};