const puppeteer = require('puppeteer');
const path = require('path');
const os = require('os');
const fs = require('fs');

exports.htmlToPdf = async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({
      success: false,
      message: 'URL is required'
    });
  }

  const safeName = url
    .replace(/^https?:\/\//, '')
    .replace(/[^a-z0-9]/gi, '_')
    .toLowerCase();

  const outputPath = path.join(os.tmpdir(), `${safeName}.pdf`);

  let browser;

  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '15mm',
        right: '15mm'
      }
    });

    await browser.close();

    res.download(outputPath, `${safeName}.pdf`, () => {
      try { fs.unlinkSync(outputPath); } catch {}
    });

  } catch (error) {
    if (browser) await browser.close();

    console.error('HTML to PDF failed:', error);
    return res.status(500).json({
      success: false,
      message: 'HTML to PDF conversion failed'
    });
  }
};
