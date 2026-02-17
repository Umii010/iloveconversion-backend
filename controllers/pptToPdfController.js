const path = require('path');
const os = require('os');
const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const Logger = require('../services/logger');
const { checkSingleFileLimit } = require('../config/limits');

exports.pptToPdf = async (req, res) => {
  console.log('🚀 PPT to PDF conversion started');
  if (!req.file) {
    Logger.logUsage(req, 'ppt_to_pdf', false).catch(() => {});
    return res.status(400).json({ success: false, message: 'No PowerPoint file uploaded' });
  }
  if (checkSingleFileLimit(req, res)) return;

  const inputPath = req.file.path;
  const originalName = path.parse(req.file.originalname).name;
  const outputPath = path.join(os.tmpdir(), `${originalName}.pdf`);

  const pythonPath = `"C:\\Users\\Admin\\AppData\\Local\\Python\\pythoncore-3.10-64\\python.exe"`;
  const scriptPath = path.join(__dirname, 'ppt_to_pdf.py');

  const command = `${pythonPath} "${scriptPath}" "${inputPath}" "${outputPath}" 2>&1`;


  try {
   
    
    const testCommand = `${pythonPath} -c "
import win32com.client
try:
    ppt = win32com.client.Dispatch('PowerPoint.Application.15')
    try:
        ppt.Visible = False
        print('VISIBLE_FALSE_OK')
    except:
        print('VISIBLE_FALSE_BLOCKED')
    ppt.Quit()
except Exception as e:
    print('ERROR:', str(e))
"`;
    
    const { stdout: testOutput } = await execPromise(testCommand, { timeout: 30000 });
    
    if (testOutput.includes('VISIBLE_FALSE_BLOCKED')) {
    } else if (testOutput.includes('VISIBLE_FALSE_OK')) {
    } else {
    }

    const startTime = Date.now();
    
    const { stdout, stderr } = await execPromise(command, {
      maxBuffer: 10 * 1024 * 1024,
      encoding: 'utf8',
      timeout: 300000, // 5 minutes
      windowsHide: false // Important: don't hide window for Office 2013
    });

    const elapsedTime = (Date.now() - startTime) / 1000;
    if (stderr) {
      console.error('Warnings:', stderr);
    }
    if (!fs.existsSync(outputPath)) {
            Logger.logUsage(req, 'ppt_to_pdf', false).catch(() => {});

      throw new Error('PDF file was not created');
    }

    const stats = fs.statSync(outputPath);
        if (stats.size < 5000) {
      const content = fs.readFileSync(outputPath, 'latin1');
      if (content.includes('Manual Conversion Required') || 
          content.includes('Automated conversion failed')) {
                    Logger.logUsage(req, 'ppt_to_pdf', false).catch(() => {});

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${originalName}_instructions.pdf"`);
        
        const fileStream = fs.createReadStream(outputPath);
        fileStream.pipe(res);
        
        fileStream.on('close', () => {
          setTimeout(() => {
            try { fs.unlinkSync(inputPath); } catch {}
            try { fs.unlinkSync(outputPath); } catch {}
          }, 3000);
        });
        
        return;
      }
    }

    Logger.logUsage(req, 'ppt_to_pdf', true).catch(() => {});
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${originalName}.pdf"`);
    
    const fileStream = fs.createReadStream(outputPath);
    fileStream.pipe(res);
    
    // Cleanup
    fileStream.on('close', () => {
      setTimeout(() => {
        try { fs.unlinkSync(inputPath); } catch {}
        try { fs.unlinkSync(outputPath); } catch {}
        console.log('🧹 Cleaned up temporary files');
      }, 3000);
    });
    
    fileStream.on('error', (err) => {
      console.error('Stream error:', err);
      try { fs.unlinkSync(inputPath); } catch {}
      try { fs.unlinkSync(outputPath); } catch {}
    });

  } catch (error) {
    console.error('Conversion failed:', error.message);
        Logger.logUsage(req, 'ppt_to_pdf', false).catch(() => {});
    try { fs.unlinkSync(inputPath); } catch {}
        if (fs.existsSync(outputPath)) {
      try { fs.unlinkSync(outputPath); } catch {}
    }
        let userMessage = 'PowerPoint to PDF conversion failed. ';
    
    if (error.message.includes('timeout')) {
      userMessage += 'The conversion took too long. ';
    }
    
    userMessage += 'Please ensure PowerPoint 2013 is properly installed and activated.';
    
    return res.status(500).json({
      success: false,
      message: userMessage,
      details: error.message
    });
  }
};