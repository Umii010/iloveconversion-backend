const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const pdf = require('pdf-parse');
const Logger = require('../services/logger');

exports.mergePdfs = async (req, res) => {
  try {
    if (!req.files || req.files.length < 2) {
            Logger.logUsage(req, 'pdf_merge', false).catch(() => {});

      return res.status(400).json({
        success: false,
        message: 'Please upload at least 2 PDF files to merge'
      });
    }

    console.log(`Starting PDF merge with ${req.files.length} files`);
    
    const pdfDocs = [];
    const fileNames = [];
    const fileSizes = [];
    let totalOriginalSize = 0;
    let totalPages = 0;

    // Process each file
    for (const file of req.files) {
      const filePath = file.path;
      const bytes = fs.readFileSync(filePath);
      
      // Get file info
      fileNames.push(path.parse(file.originalname).name);
      fileSizes.push(file.size);
      totalOriginalSize += file.size;
      
      // Load PDF and get page count
      const pdfDoc = await PDFDocument.load(bytes);
      pdfDocs.push(pdfDoc);
      totalPages += pdfDoc.getPageCount();
    }

    // Create merged PDF
    const mergedPdf = await PDFDocument.create();
    
    // Track progress for logging
    let pagesProcessed = 0;
    
    for (const pdfDoc of pdfDocs) {
      const pageIndices = pdfDoc.getPageIndices();
      const copiedPages = await mergedPdf.copyPages(pdfDoc, pageIndices);
      
      copiedPages.forEach((page) => {
        mergedPdf.addPage(page);
        pagesProcessed++;
      });
      
      // Log progress
      console.log(`Processed ${pagesProcessed}/${totalPages} pages`);
    }

    const mergedPdfBytes = await mergedPdf.save();
    const mergedSize = mergedPdfBytes.length;
    Logger.logUsage(req, 'pdf_merge', true).catch(() => {});

    // Cleanup temp files
    req.files.forEach((file) => {
      try {
        fs.unlinkSync(file.path);
      } catch (err) {
        console.error('Error deleting temp file:', err);
      }
    });

    // Generate merged filename
    const originalNames = req.files.map(f => path.parse(f.originalname).name);
    let mergedFileName = 'merged.pdf';
    if (originalNames.length <= 3) {
      mergedFileName = `${originalNames.join('-')}.pdf`;
    } else {
      mergedFileName = `${originalNames[0]}-${originalNames[1]}-and-${originalNames.length - 2}-more.pdf`;
    }

    // Set response headers with stats
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${mergedFileName}"`,
      'Content-Length': mergedSize,
      'X-Merged-Size': mergedSize,
      'X-Total-Pages': totalPages,
      'X-File-Count': req.files.length,
      'X-Filename': mergedFileName,
      'X-Original-Size': totalOriginalSize,
      'X-Original-Names': originalNames.join(',')
    });

    console.log(`Merge successful: ${totalPages} pages, ${formatBytes(totalOriginalSize)} → ${formatBytes(mergedSize)}`);
    
    res.send(Buffer.from(mergedPdfBytes));

  } catch (error) {
    console.error('PDF merge failed:', error);
    
    // Cleanup on error
    if (req.files) {
      req.files.forEach((file) => {
        try {
          fs.unlinkSync(file.path);
        } catch (err) {
          console.error('Error cleaning up on failure:', err);
        }
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: `PDF merge failed: ${error.message}` 
    });
  }
};

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}