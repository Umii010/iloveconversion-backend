const path = require('path');
const os = require('os');
const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');
const Logger = require('../services/logger');
const { checkSingleFileLimit } = require('../config/limits');

const execPromise = util.promisify(require('child_process').exec);

exports.pdfToPpt = async (req, res) => {
  console.log('PDF to PPT conversion started');
  if (!req.file) {
    Logger.logUsage(req, 'pdf_to_ppt', false).catch(() => {});
    return res.status(400).json({ success: false, message: 'No PDF uploaded' });
  }
  if (checkSingleFileLimit(req, res)) return;

  const inputPath = req.file.path;
  const originalName = path.parse(req.file.originalname).name;
  const outputPath = path.join(os.tmpdir(), `${originalName}.pptx`);
  const pythonPath = `"C:\\Users\\Admin\\AppData\\Local\\Python\\pythoncore-3.10-64\\python.exe"`;
  const scriptPath = path.join(__dirname, 'pdf_to_ppt.py');

  const command = `${pythonPath} "${scriptPath}" "${inputPath}" "${outputPath}" 2>&1`;

  try {
    const { stdout, stderr } = await execPromise(command, { 
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      encoding: 'utf8'
    });
    
    if (stderr) {
      console.error('Python script stderr:', stderr);
    }

    // Check if output file was created
    if (!fs.existsSync(outputPath)) {
      console.error('Output file not created');
            Logger.logUsage(req, 'pdf_to_ppt', false).catch(() => {});

      return res.status(500).json({
        success: false,
        message: 'PPT file not generated. Check server logs for details.'
      });
    }

    const stats = fs.statSync(outputPath);
    Logger.logUsage(req, 'pdf_to_ppt', true).catch(() => {});
    res.download(outputPath, `${originalName}.pptx`, (err) => {
      if (err) {
        console.error('Download error:', err);
      }
      
      setTimeout(() => {
        try { 
          fs.unlinkSync(inputPath); 
          console.log(`Cleaned up: ${inputPath}`);
        } catch (cleanupErr) {
          console.error('Error cleaning up input:', cleanupErr);
        }
        
        try { 
          fs.unlinkSync(outputPath); 
        } catch (cleanupErr) {
          console.error('Error cleaning up output:', cleanupErr);
        }
      }, 3000);
    });

  } catch (error) {
    console.error('PDF to PPT conversion failed:', error);
        Logger.logUsage(req, 'pdf_to_ppt', false).catch(() => {});

    
    try { 
      fs.unlinkSync(inputPath); 
      console.log(`Cleaned up input on error: ${inputPath}`);
    } catch (cleanupErr) {
      console.error('Error cleaning up on error:', cleanupErr);
    }

    // Provide more helpful error message
    let errorMessage = 'PDF to PPT conversion failed';
    
    if (error.code === 'ENOENT') {
      errorMessage = 'Python executable not found. Check the path.';
    } else if (error.stderr && error.stderr.includes('ModuleNotFoundError')) {
      errorMessage = 'Missing Python dependencies. Install required packages.';
    } else if (error.stderr && error.stderr.includes('poppler')) {
      errorMessage = 'Poppler not found. Install poppler for Windows.';
    }

    return res.status(500).json({
      success: false,
      message: errorMessage,
      details: error.message
    });
  }
};