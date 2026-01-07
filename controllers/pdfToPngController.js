const path = require('path');
const os = require('os');
const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');
const archiver = require('archiver');
const Logger = require('../services/logger'); 

const execPromise = util.promisify(exec);

exports.pdfToPng = async (req, res) => {
  let inputPath = null;
  let outputFiles = [];
  
  try {
    if (!req.file) {
      Logger.logUsage(req, 'pdf_to_png', false).catch(() => {});
      return res.status(400).json({
        success: false,
        message: 'No PDF uploaded'
      });
    }

    inputPath = req.file.path;
    const originalName = path.parse(req.file.originalname).name;
    const originalSize = req.file.size;
    const tempDir = os.tmpdir();
    const timestamp = Date.now();
    const outputPattern = path.join(tempDir, `${originalName}_${timestamp}_%03d.png`);

    const gsPath = process.platform === 'win32' 
      ? '"C:\\Program Files\\gs\\gs10.06.0\\bin\\gswin64c.exe"' 
      : 'gs';

    const command = `${gsPath} -dSAFER -dBATCH -dNOPAUSE -sDEVICE=png16m -r150 -dTextAlphaBits=4 -dGraphicsAlphaBits=4 -dUseCIEColor -sOutputFile="${outputPattern}" "${inputPath}"`;
    
    const { stdout, stderr } = await execPromise(command, { 
      timeout: 180000, 
      maxBuffer: 1024 * 1024 * 20 
    });

    if (stderr && stderr.trim()) {
      console.warn('GhostScript warnings:', stderr);
    }

    const pngFiles = fs
      .readdirSync(tempDir)
      .filter(f => f.includes(`${originalName}_${timestamp}`) && f.endsWith('.png'))
      .map(f => path.join(tempDir, f))
      .sort(); 

    outputFiles = pngFiles;

    if (!pngFiles.length) {
            Logger.logUsage(req, 'pdf_to_png', false).catch(() => {});

      throw new Error('No PNG files generated');
    }

    let totalSize = 0;
    pngFiles.forEach(file => {
      totalSize += fs.statSync(file).size;
    });

    const pageCount = pngFiles.length;
    const isMultiPage = pageCount > 1;
        Logger.logUsage(req, 'pdf_to_png', true).catch(() => {});


    res.set({
      'X-Original-Filename': req.file.originalname,
      'X-Page-Count': pageCount,
      'X-Is-Zip': isMultiPage ? 'true' : 'false',
      'X-Image-Quality': '150 DPI (High Quality)',
      'X-Total-Size': totalSize,
      'X-Original-Size': originalSize,
      'X-Timestamp': timestamp
    });

    if (!isMultiPage) {
      res.set({
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="${originalName}.png"`,
        'Content-Length': fs.statSync(pngFiles[0]).size
      });
      
      const fileStream = fs.createReadStream(pngFiles[0]);
      fileStream.pipe(res);
      
      fileStream.on('end', () => {
        cleanup(inputPath, outputFiles);
      });
      
    } else {
      const zipPath = path.join(tempDir, `${originalName}_${timestamp}.zip`);
      outputFiles.push(zipPath);
      
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', {
        zlib: { level: 9 }
      });

      output.on('close', () => {
        const zipSize = fs.statSync(zipPath).size;
        
        res.set({
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${originalName}_images.zip"`,
          'Content-Length': zipSize
        });
        
        const fileStream = fs.createReadStream(zipPath);
        fileStream.pipe(res);
        
        fileStream.on('end', () => {
          cleanup(inputPath, outputFiles);
        });
      });

      archive.on('error', (err) => {
        console.error('Archive error:', err);
        throw err;
      });

      archive.pipe(output);
      
      pngFiles.forEach((file, index) => {
        const pageNum = index + 1;
        archive.file(file, { name: `Page ${pageNum}.png` });
      });
      
      await archive.finalize();
    }


  } catch (error) {
    console.error('PDF to PNG conversion error:', error);
        Logger.logUsage(req, 'pdf_to_png', false).catch(() => {});

    
    if (inputPath && fs.existsSync(inputPath)) {
      fs.unlinkSync(inputPath);
    }
    outputFiles.forEach(file => {
      try {
        if (fs.existsSync(file)) fs.unlinkSync(file);
      } catch (err) {
        console.warn(`Cleanup error for ${file}:`, err.message);
      }
    });
    
    let errorMessage = 'PDF to PNG conversion failed';
    
    if (error.message.includes('Ghostscript')) {
      errorMessage = 'GhostScript error. Make sure GhostScript is installed properly.';
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'Conversion timed out. The PDF might be too large or complex.';
    } else if (error.message.includes('No PNG files')) {
      errorMessage = 'No PNG files were generated. The PDF might be empty or corrupted.';
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      detail: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

function cleanup(inputPath, files) {
  setTimeout(() => {
    try {
      if (inputPath && fs.existsSync(inputPath)) {
        fs.unlinkSync(inputPath);
      }
    } catch (err) {
      console.warn(`Could not delete input file:`, err.message);
    }
    
    files.forEach(file => {
      try {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      } catch (err) {
        console.warn(`Could not delete ${file}:`, err.message);
      }
    });
  }, 5000);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}