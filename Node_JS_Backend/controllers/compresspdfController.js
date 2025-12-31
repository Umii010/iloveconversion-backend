const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

exports.compressPdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No PDF uploaded' });
    }

    const inputPath = req.file.path;
    const originalName = req.file.originalname;
    const originalSize = req.file.size;

    console.log(`Processing: ${originalName} (${originalSize} bytes)`);

    const outputDir = 'uploads';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(
      outputDir,
      `compressed_${Date.now()}_${originalName}`
    );

    const gsPath = process.platform === 'win32'
      ? 'gswin64c'  
      : 'gs';

    const gsCommand = [
      gsPath,
      '-sDEVICE=pdfwrite',
      '-dCompatibilityLevel=1.4',
      '-dPDFSETTINGS=/ebook',
      '-dNOPAUSE',
      '-dQUIET',
      '-dBATCH',
      `-sOutputFile=${outputPath}`,
      inputPath
    ].join(' ');

    console.log('Executing GhostScript command...');

    await execPromise(gsCommand);

    if (!fs.existsSync(outputPath)) {
      throw new Error('Compressed file was not created');
    }

    const compressedSize = fs.statSync(outputPath).size;
    console.log(`Compression complete: ${compressedSize} bytes`);

    let reductionPercent = '0.00';
    if (originalSize > 0 && compressedSize > 0) {
      const percent = ((originalSize - compressedSize) / originalSize * 100);
      reductionPercent = Math.max(0, percent).toFixed(2);
    }

    res.setHeader('X-Original-Filename', originalName);
    res.setHeader('X-Original-Size', originalSize);
    res.setHeader('X-Compressed-Size', compressedSize);
    res.setHeader('X-Compression-Percent', reductionPercent);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="compressed_${originalName}"`);

    const fileStream = fs.createReadStream(outputPath);
    
    fileStream.pipe(res);

    fileStream.on('end', () => {
      [inputPath, outputPath].forEach(filePath => {
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (err) {
            console.warn(`Could not delete ${filePath}:`, err.message);
          }
        }
      });
    });

    fileStream.on('error', (err) => {
      console.error('Stream error:', err);
      res.status(500).end();
    });

  } catch (error) {
    console.error('Compression error:', error);
    
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Compression failed: ' + error.message
    });
  }
};