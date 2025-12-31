const path = require('path');
const os = require('os');
const fs = require('fs');
const { exec } = require('child_process');

exports.pdfToPng = (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No PDF uploaded'
    });
  }

  const inputPath = req.file.path;
  const originalName = path.parse(req.file.originalname).name;
  const tempDir = os.tmpdir();

  const outputPattern = path.join(tempDir, `${originalName}-%03d.png`);

  const gsPath = `"C:\\Program Files\\gs\\gs10.06.0\\bin\\gswin64c.exe"`;

  const command = `${gsPath} -dSAFER -dBATCH -dNOPAUSE -sDEVICE=png16m -r150 -sOutputFile="${outputPattern}" "${inputPath}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error('PDF to PNG failed:', stderr || error);
      return res.status(500).json({
        success: false,
        message: 'PDF to PNG conversion failed'
      });
    }

    const pngFiles = fs
      .readdirSync(tempDir)
      .filter(f => f.startsWith(originalName) && f.endsWith('.png'))
      .map(f => path.join(tempDir, f));

    if (!pngFiles.length) {
      return res.status(500).json({
        success: false,
        message: 'No PNG files generated'
      });
    }

    /**
     * OPTION 1 (Recommended): ZIP response (multi-page)
     * OPTION 2: Return first PNG only
     */

    if (pngFiles.length === 1) {
      return res.download(pngFiles[0], `${originalName}.png`, () => {
        cleanup(inputPath, pngFiles);
      });
    }

    const zipPath = path.join(tempDir, `${originalName}.zip`);
    const archiver = require('archiver');
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip');

    output.on('close', () => {
      res.download(zipPath, `${originalName}.zip`, () => {
        cleanup(inputPath, pngFiles.concat(zipPath));
      });
    });

    archive.pipe(output);
    pngFiles.forEach(file => archive.file(file, { name: path.basename(file) }));
    archive.finalize();
  });
};

function cleanup(inputPath, files) {
  setTimeout(() => {
    try { fs.unlinkSync(inputPath); } catch {}
    files.forEach(f => {
      try { fs.unlinkSync(f); } catch {}
    });
  }, 5000);
}
