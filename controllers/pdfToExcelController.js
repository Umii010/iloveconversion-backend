const path = require('path');
const os = require('os');
const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');
const Logger = require('../services/logger');
const { checkSingleFileLimit } = require('../config/limits');

const execPromise = util.promisify(require('child_process').exec);

exports.pdfToExcel = async (req, res) => {
  console.log('📊 PDF to Excel conversion started...');
  if (!req.file) {
    Logger.logUsage(req, 'pdf_to_excel', false).catch(() => {});
    return res.status(400).json({ success: false, message: 'No PDF uploaded' });
  }
  if (checkSingleFileLimit(req, res)) return;

  const inputPath = req.file.path;
  const originalName = path.parse(req.file.originalname).name;
  const outputPath = path.join(os.tmpdir(), `${originalName}.xlsx`);

  const pythonPath = `"C:\\Users\\Admin\\AppData\\Local\\Python\\pythoncore-3.10-64\\python.exe"`;
  const scriptPath = path.join(__dirname, 'pdf_to_excel.py');

  const command = `${pythonPath} "${scriptPath}" "${inputPath}" "${outputPath}" 2>&1`;


  try {
    const startTime = Date.now();
    
    const { stdout, stderr } = await execPromise(command, {
      maxBuffer: 10 * 1024 * 1024, 
      encoding: 'utf8',
      timeout: 180000 
    });

    const processingTime = ((Date.now() - startTime) / 1000).toFixed(1);
    
    if (stderr) {
      console.error('Python warnings:', stderr);
    }

    if (!fs.existsSync(outputPath)) {
      console.error('Output file not created');
            Logger.logUsage(req, 'pdf_to_excel', false).catch(() => {});

      try { fs.unlinkSync(inputPath); } catch {}
      
      return res.status(500).json({
        success: false,
        message: 'Excel file not generated. The PDF might not contain extractable tables.',
        details: 'No tables detected in PDF'
      });
    }

    // Get file stats
    const stats = fs.statSync(outputPath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        Logger.logUsage(req, 'pdf_to_excel', true).catch(() => {});

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${originalName}.xlsx"`);
    res.setHeader('X-Processing-Time', `${processingTime}s`);
    res.setHeader('X-File-Size', `${fileSizeMB}MB`);
    
    const fileStream = fs.createReadStream(outputPath);
    fileStream.pipe(res);
    
    // Cleanup after download completes
    fileStream.on('close', () => {
      setTimeout(() => {
        try { 
          fs.unlinkSync(inputPath); 
        } catch {}
        try { 
          fs.unlinkSync(outputPath); 
        } catch {}
      }, 3000);
    });
    
    fileStream.on('error', (err) => {
      console.error('Stream error:', err);
      try { fs.unlinkSync(inputPath); } catch {}
      try { fs.unlinkSync(outputPath); } catch {}
    });

  } catch (error) {
    console.error(' PDF to Excel conversion failed:', error);
        Logger.logUsage(req, 'pdf_to_excel', false).catch(() => {});

        try { 
      fs.unlinkSync(inputPath); 
      console.log(`🧹 Cleaned input on error: ${inputPath}`);
    } catch {}
    
    let errorMessage = 'PDF to Excel conversion failed';
    
    if (error.code === 'ENOENT') {
      errorMessage = 'Python not found. Check Python installation.';
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'Conversion timeout. PDF might be too large or complex.';
    } else if (error.message.includes('ModuleNotFoundError')) {
      errorMessage = 'Missing Python packages. Install: pip install pdfplumber pandas openpyxl';
    } else if (error.message.includes('tables')) {
      errorMessage = 'No tables detected in PDF. Try a different PDF.';
    }
    
    return res.status(500).json({
      success: false,
      message: errorMessage,
      details: error.message
    });
  }
};