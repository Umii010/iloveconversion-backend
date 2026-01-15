const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const Logger = require('../services/logger');

exports.mergePdfs = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      Logger.logUsage(req, 'pdf_merge', false).catch(() => {});
      return res.status(400).json({
        success: false,
        message: 'Please upload at least 1 PDF file',
        errorCode: 'NO_FILES_UPLOADED'
      });
    }

    if (req.files.length < 2) {
      Logger.logUsage(req, 'pdf_merge', false).catch(() => {});
      return res.status(400).json({
        success: false,
        message: 'Please upload at least 2 PDF files to merge',
        errorCode: 'INSUFFICIENT_FILES'
      });
    }

    if (req.files.length > 20) {
      Logger.logUsage(req, 'pdf_merge', false).catch(() => {});
      return res.status(400).json({
        success: false,
        message: 'Maximum 20 files allowed for merging',
        errorCode: 'MAX_FILES_EXCEEDED',
        maxAllowed: 20,
        uploadedCount: req.files.length
      });
    }

    console.log(`Starting PDF merge with ${req.files.length} files`);
    
    const invalidFiles = [];
    for (const file of req.files) {
      if (file.size > 100 * 1024 * 1024) {
        invalidFiles.push({
          name: file.originalname,
          reason: `File size exceeds 100MB limit (${formatBytes(file.size)})`,
          size: file.size
        });
        continue;
      }

      if (!file.originalname.toLowerCase().endsWith('.pdf') && 
          file.mimetype !== 'application/pdf') {
        invalidFiles.push({
          name: file.originalname,
          reason: 'File is not a valid PDF',
          type: file.mimetype
        });
      }
    }

    if (invalidFiles.length > 0) {
      Logger.logUsage(req, 'pdf_merge', false).catch(() => {});
      return res.status(400).json({
        success: false,
        message: 'Some files are invalid',
        errorCode: 'INVALID_FILES',
        invalidFiles: invalidFiles
      });
    }

    const pdfDocs = [];
    const fileNames = [];
    const fileSizes = [];
    let totalOriginalSize = 0;
    let totalPages = 0;
    for (const file of req.files) {
      const filePath = file.path;
      const bytes = fs.readFileSync(filePath);
      
      try {
        const pdfDoc = await PDFDocument.load(bytes);
        const pageCount = pdfDoc.getPageCount();
        if (pageCount === 0) {
          invalidFiles.push({
            name: file.originalname,
            reason: 'PDF file is empty (0 pages)'
          });
          continue;
        }

        pdfDocs.push(pdfDoc);
        fileNames.push(path.parse(file.originalname).name);
        fileSizes.push(file.size);
        totalOriginalSize += file.size;
        totalPages += pageCount;
      } catch (error) {
        console.error(`Failed to load PDF ${file.originalname}:`, error);
        invalidFiles.push({
          name: file.originalname,
          reason: 'Corrupted or invalid PDF file'
        });
      }
    }

    if (pdfDocs.length < 2) {
      Logger.logUsage(req, 'pdf_merge', false).catch(() => {});
      
      req.files.forEach((file) => {
        try {
          fs.unlinkSync(file.path);
        } catch (err) {
          console.error('Error deleting temp file:', err);
        }
      });

      return res.status(400).json({
        success: false,
        message: 'Need at least 2 valid PDF files to merge',
        errorCode: 'INSUFFICIENT_VALID_FILES',
        validFilesCount: pdfDocs.length,
        invalidFiles: invalidFiles
      });
    }

    const mergedPdf = await PDFDocument.create();
    let pagesProcessed = 0;
    
    for (const pdfDoc of pdfDocs) {
      const pageIndices = pdfDoc.getPageIndices();
      const copiedPages = await mergedPdf.copyPages(pdfDoc, pageIndices);
      
      copiedPages.forEach((page) => {
        mergedPdf.addPage(page);
        pagesProcessed++;
      });
      
      console.log(`Processed ${pagesProcessed}/${totalPages} pages`);
    }

    const mergedPdfBytes = await mergedPdf.save();
    const mergedSize = mergedPdfBytes.length;
    
    Logger.logUsage(req, 'pdf_merge', true).catch(() => {});

    req.files.forEach((file) => {
      try {
        fs.unlinkSync(file.path);
      } catch (err) {
        console.error('Error deleting temp file:', err);
      }
    });

    const originalNames = req.files.map(f => path.parse(f.originalname).name);
    let mergedFileName = 'merged.pdf';
    if (originalNames.length <= 3) {
      mergedFileName = `${originalNames.join('-')}.pdf`;
    } else {
      mergedFileName = `${originalNames[0]}-${originalNames[1]}-and-${originalNames.length - 2}-more.pdf`;
    }

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${mergedFileName}"`,
      'Content-Length': mergedSize,
      'X-Merged-Size': mergedSize,
      'X-Total-Pages': totalPages,
      'X-File-Count': req.files.length,
      'X-Filename': mergedFileName,
      'X-Original-Size': totalOriginalSize,
      'X-Original-Names': originalNames.join(','),
      'X-Valid-Files': pdfDocs.length,
      'X-Invalid-Files-Count': invalidFiles.length
    });

    console.log(`Merge successful: ${totalPages} pages, ${formatBytes(totalOriginalSize)} → ${formatBytes(mergedSize)}`);
    
    res.send(Buffer.from(mergedPdfBytes));

  } catch (error) {
    console.error('PDF merge failed:', error);
    
    if (req.files) {
      req.files.forEach((file) => {
        try {
          fs.unlinkSync(file.path);
        } catch (err) {
          console.error('Error cleaning up on failure:', err);
        }
      });
    }
    let statusCode = 500;
    let errorMessage = `PDF merge failed: ${error.message}`;
    let errorCode = 'INTERNAL_ERROR';
    
    if (error.message.includes('memory') || error.message.includes('allocation')) {
      statusCode = 413;
      errorMessage = 'File too large to process. Please try smaller files.';
      errorCode = 'FILE_TOO_LARGE';
    } else if (error.message.includes('corrupt') || error.message.includes('invalid')) {
      statusCode = 400;
      errorMessage = 'One or more PDF files are corrupt or invalid.';
      errorCode = 'CORRUPT_PDF';
    }
    
    res.status(statusCode).json({ 
      success: false, 
      message: errorMessage,
      errorCode: errorCode
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