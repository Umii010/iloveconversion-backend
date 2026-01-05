const path = require('path');
const os = require('os');
const fs = require('fs');
const { exec } = require('child_process');
const Logger = require('../services/logger'); 


/**
 * Safely delete a file on Windows (handles EBUSY)
 */
function safeDelete(filePath, retries = 6, delay = 500) {
  return new Promise((resolve) => {
    const attempt = (count) => {
      fs.unlink(filePath, (err) => {
        if (!err) return resolve();

        if (err.code === 'EBUSY' && count > 0) {
          return setTimeout(() => attempt(count - 1), delay);
        }

        console.error(`Failed to delete ${filePath}:`, err.message);
        resolve();
      });
    };
    attempt(retries);
  });
}

exports.wordToPdf = (req, res) => {
  if (!req.file) {
        Logger.logUsage(req, 'word_to_pdf', false).catch(() => {});

    return res.status(400).json({
      success: false,
      message: 'No Word file uploaded'
    });
  }

  const inputPath = req.file.path;
  const originalName = path.parse(req.file.originalname).name;
  const outputPath = path.join(os.tmpdir(), `${originalName}.pdf`);

  const pythonPath = `"C:\\Users\\Admin\\AppData\\Local\\Python\\pythoncore-3.10-64\\python.exe"`;
  const scriptPath = path.join(__dirname, 'word_to_pdf.py');

  const command = `${pythonPath} "${scriptPath}" "${inputPath}" "${outputPath}"`;
  const startTime = Date.now();

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error('Conversion failed:', stderr || error.message);
            Logger.logUsage(req, 'word_to_pdf', false).catch(() => {});

      return res.status(500).json({
        success: false,
        message: 'Word to PDF conversion failed'
      });
    }

    if (!fs.existsSync(outputPath)) {
      console.error('Output PDF not found:', outputPath);
            Logger.logUsage(req, 'word_to_pdf', false).catch(() => {});

      return res.status(500).json({
        success: false,
        message: 'Converted PDF not found'
      });
    }
    Logger.logUsage(req, 'word_to_pdf', true).catch(() => {});

    // Send PDF
    res.download(outputPath, `${originalName}.pdf`, async (err) => {
      if (err) console.error('Download error:', err.message);

      // Cleanup AFTER response
      await safeDelete(inputPath);
      await safeDelete(outputPath);
    });
  });
};
