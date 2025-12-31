const path = require('path');
const os = require('os');
const fs = require('fs');
const { exec } = require('child_process');
const MAGICK_PATH = `"C:\\Program Files\\ImageMagick-7.1.2-Q16-HDRI\\magick.exe"`;


exports.imageToPdf = (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No images uploaded'
    });
  }

  const tempDir = os.tmpdir();
  const outputPdf = path.join(tempDir, `images-${Date.now()}.pdf`);
  const allowedExt = ['.png', '.jpg', '.jpeg'];
  const imagePaths = [];

  for (const file of req.files) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExt.includes(ext)) {
      cleanup(req.files);
      return res.status(400).json({
        success: false,
        message: 'Only PNG, JPG, and JPEG images are allowed'
      });
    }
    imagePaths.push(`"${file.path}"`);
  }

  const command = `${MAGICK_PATH} ${imagePaths.join(' ')} -density 300 -quality 100 "${outputPdf}"`;
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error('Image to PDF failed:', stderr || error);
      cleanup(req.files);
      return res.status(500).json({
        success: false,
        message: 'Image to PDF conversion failed'
      });
    }

    res.download(outputPdf, 'converted.pdf', () => {
      cleanup(req.files, outputPdf);
    });
  });
};

function cleanup(files, pdfPath = null) {
  setTimeout(() => {
    files.forEach(f => {
      try { fs.unlinkSync(f.path); } catch {}
    });
    if (pdfPath) {
      try { fs.unlinkSync(pdfPath); } catch {}
    }
  }, 5000);
}
