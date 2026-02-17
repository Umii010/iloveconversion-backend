const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const Logger = require('../services/logger');
const { checkSingleFileLimit } = require('../config/limits');

const QPDF_PATH = `"C:\\Program Files\\qpdf\\bin\\qpdf.exe"`;

exports.unlockPdf = async (req, res) => {
  try {
    if (!req.file) {
      Logger.logUsage(req, 'pdf_unlock', false).catch(() => {});
      return res.status(400).json({ success: false, message: 'No PDF uploaded' });
    }
    if (checkSingleFileLimit(req, res)) return;

    const password = req.body.password;
    if (!password) {
      Logger.logUsage(req, 'pdf_unlock', false).catch(() => {});
      return res.status(400).json({ success: false, message: 'PDF password is required' });
    }

    const inputPath = req.file.path;
    const originalName = path.parse(req.file.originalname).name;
    const outputPath = path.join(os.tmpdir(), `${originalName}-unlocked.pdf`);
    const command = `${QPDF_PATH} --password="${password}" --decrypt "${inputPath}" "${outputPath}"`;

    try {
      await new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
          if (error) return reject(stderr || error);
          resolve();
        });
      });
    } catch (err) {
      console.error('Unlock failed:', err);
      try { fs.unlinkSync(inputPath); } catch {}
      Logger.logUsage(req, 'pdf_unlock', false).catch(() => {});
      return res.status(400).json({
        success: false,
        message: 'Invalid password or corrupted file'
      });
    }

    Logger.logUsage(req, 'pdf_unlock', true).catch(() => {});
    try { fs.unlinkSync(inputPath); } catch {}
    return res.download(outputPath, `${originalName}-unlocked.pdf`, () => {
      try { fs.unlinkSync(outputPath); } catch {}
    });
  } catch (err) {
    console.error('Unlock PDF error:', err);
    Logger.logUsage(req, 'pdf_unlock', false).catch(() => {});
    res.status(500).json({ success: false, message: 'Failed to unlock PDF' });
  }
};