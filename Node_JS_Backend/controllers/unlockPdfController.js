const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const archiver = require('archiver');

const QPDF_PATH = `"C:\\Program Files\\qpdf\\bin\\qpdf.exe"`; 

exports.unlockPdf = async (req, res) => {
  try {
    if (!req.files || !req.files.length) {
      return res.status(400).json({ success: false, message: 'No PDF files uploaded' });
    }

    const password = req.body.password;
    if (!password) {
      return res.status(400).json({ success: false, message: 'PDF password is required' });
    }

    const tempDir = os.tmpdir();
    const outputFiles = [];

    for (const file of req.files) {
      const inputPath = file.path;
      const originalName = path.parse(file.originalname).name;
      const outputPath = path.join(tempDir, `${originalName}-unlocked.pdf`);

      const command = `${QPDF_PATH} --password="${password}" --decrypt "${inputPath}" "${outputPath}"`;
      console.log('Executing command:', command);

      try {
        await new Promise((resolve, reject) => {
          exec(command, (error, stdout, stderr) => {
            if (error) return reject(stderr || error);
            resolve();
          });
        });

        outputFiles.push(outputPath);
      } catch (err) {
        console.error(`Failed to unlock ${file.originalname}`, err);
        return res.status(400).json({
          success: false,
          message: `Invalid password or corrupted file: ${file.originalname}`
        });
      } finally {
        try { fs.unlinkSync(inputPath); } catch {}
      }
    }

    if (outputFiles.length === 1) {
      return res.download(outputFiles[0], path.basename(outputFiles[0]), () => {
        try { fs.unlinkSync(outputFiles[0]); } catch {}
      });
    }

    const zipPath = path.join(tempDir, `unlocked-pdfs.zip`);
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      res.download(zipPath, 'unlocked-pdfs.zip', () => {
        try { fs.unlinkSync(zipPath); } catch {}
        outputFiles.forEach(f => { try { fs.unlinkSync(f); } catch {} });
      });
    });

    archive.pipe(output);
    outputFiles.forEach(f => {
      archive.file(f, { name: path.basename(f) });
    });
    archive.finalize();

  } catch (err) {
    console.error('Unlock PDF error:', err);
    res.status(500).json({ success: false, message: 'Failed to unlock PDF' });
  }
};