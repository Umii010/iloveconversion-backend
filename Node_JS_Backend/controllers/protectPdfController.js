const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const Logger = require('../services/logger');


const QPDF_PATH = `"C:\\Program Files\\qpdf\\bin\\qpdf.exe"`; 

exports.protectPdf = async (req, res) => {
  try {
    if (!req.file) {
            Logger.logUsage(req, 'pdf_protect', false).catch(() => {});

      return res.status(400).json({ success: false, message: 'No PDF uploaded' });
    }

    const pdfPath = req.file.path;
    const originalName = path.parse(req.file.originalname).name;
    const tempDir = os.tmpdir();
    const outputPath = path.join(tempDir, `${originalName}_protected.pdf`);

    const password = req.body.password;
    if (!password) {
            Logger.logUsage(req, 'pdf_protect', false).catch(() => {});

      return res.status(400).json({ success: false, message: 'Password is required' });
    }

    const command = `${QPDF_PATH} --encrypt "${password}" "${password}" 256 -- "${pdfPath}" "${outputPath}"`;
    console.log('Executing command:', command);
    const startTime = Date.now();

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('Protect PDF failed:', stderr || error);
        return res.status(500).json({ success: false, message: 'Protect PDF failed' });
      }
       if (!fs.existsSync(outputPath)) {
        Logger.logUsage(req, 'pdf_protect', false).catch(() => {});
        
        return res.status(500).json({ success: false, message: 'Protected PDF not created' });
      }
      Logger.logUsage(req, 'pdf_protect', true).catch(() => {});

      res.download(outputPath, `${originalName}_protected.pdf`, () => {
        setTimeout(() => {
          try { fs.unlinkSync(pdfPath); } catch {}
          try { fs.unlinkSync(outputPath); } catch {}
        }, 3000);
      });
    });

  } catch (err) {
    console.error('Protect PDF failed:', err);
            Logger.logUsage(req, 'pdf_protect', false).catch(() => {});

    res.status(500).json({ success: false, message: 'Protect PDF failed' });
  }
};