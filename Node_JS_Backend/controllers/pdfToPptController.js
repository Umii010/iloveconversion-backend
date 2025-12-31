const path = require('path');
const os = require('os');
const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');

// Convert exec to promise-based
const execPromise = util.promisify(require('child_process').exec);

exports.pdfToPpt = async (req, res) => {
  console.log('PDF to PPT conversion started');
  
  if (!req.file) {
    console.log('No file uploaded');
    return res.status(400).json({
      success: false,
      message: 'No PDF uploaded'
    });
  }

  const inputPath = req.file.path;
  const originalName = path.parse(req.file.originalname).name;
  const outputPath = path.join(os.tmpdir(), `${originalName}.pptx`);

  console.log(`Input: ${inputPath}`);
  console.log(`Output: ${outputPath}`);
  console.log(`Original name: ${originalName}`);

  const pythonPath = `"C:\\Users\\Admin\\AppData\\Local\\Python\\pythoncore-3.10-64\\python.exe"`;
  const scriptPath = path.join(__dirname, 'pdf_to_ppt.py');

  // Build command with error output redirection
  const command = `${pythonPath} "${scriptPath}" "${inputPath}" "${outputPath}" 2>&1`;

  console.log(`Executing command: ${command}`);

  try {
    // Execute Python script
    const { stdout, stderr } = await execPromise(command, { 
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      encoding: 'utf8'
    });

    console.log('Python script output:');
    console.log(stdout);
    
    if (stderr) {
      console.error('Python script stderr:', stderr);
    }

    // Check if output file was created
    if (!fs.existsSync(outputPath)) {
      console.error('Output file not created');
      return res.status(500).json({
        success: false,
        message: 'PPT file not generated. Check server logs for details.'
      });
    }

    const stats = fs.statSync(outputPath);
    console.log(`PPT file created: ${outputPath} (${stats.size} bytes)`);

    // Send file
    res.download(outputPath, `${originalName}.pptx`, (err) => {
      if (err) {
        console.error('Download error:', err);
      }
      
      // Clean up files after download
      setTimeout(() => {
        try { 
          fs.unlinkSync(inputPath); 
          console.log(`Cleaned up: ${inputPath}`);
        } catch (cleanupErr) {
          console.error('Error cleaning up input:', cleanupErr);
        }
        
        try { 
          fs.unlinkSync(outputPath); 
          console.log(`Cleaned up: ${outputPath}`);
        } catch (cleanupErr) {
          console.error('Error cleaning up output:', cleanupErr);
        }
      }, 3000);
    });

  } catch (error) {
    console.error('PDF to PPT conversion failed:', error);
    
    // Clean up input file on error
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