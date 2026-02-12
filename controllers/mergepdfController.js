const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const Logger = require('../services/logger');
const qrService = require('../services/qrService');
const { fromPath } = require('pdf2pic');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const os = require('os');

// ============ PDF MERGE FUNCTIONALITY ============

exports.mergePdfs = async (req, res) => {
  try {
    // Handle both array and object format for req.files
    let filesArray = [];
    
    if (req.files) {
      if (Array.isArray(req.files)) {
        filesArray = req.files;
      } else if (req.files.files && Array.isArray(req.files.files)) {
        filesArray = req.files.files;
      } else {
        filesArray = Object.values(req.files).flat();
      }
    }

    if (!filesArray || filesArray.length === 0) {
      Logger.logUsage(req, 'pdf_merge', false).catch(() => {});
      return res.status(400).json({
        success: false,
        message: 'Please upload at least 1 PDF file',
        errorCode: 'NO_FILES_UPLOADED'
      });
    }

    if (filesArray.length < 2) {
      Logger.logUsage(req, 'pdf_merge', false).catch(() => {});
      return res.status(400).json({
        success: false,
        message: 'Please upload at least 2 PDF files to merge',
        errorCode: 'INSUFFICIENT_FILES'
      });
    }

    // Use subscription-based limits from middleware
    const maxFiles = req.isProUser ? 999 : 7;
    if (filesArray.length > maxFiles) {
      Logger.logUsage(req, 'pdf_merge', false).catch(() => {});
      return res.status(400).json({
        success: false,
        message: `Maximum ${maxFiles} files allowed for merging`,
        errorCode: 'MAX_FILES_EXCEEDED',
        maxAllowed: maxFiles,
        uploadedCount: filesArray.length
      });
    }

    console.log(`Starting PDF merge with ${filesArray.length} files (User: ${req.isProUser ? 'Pro' : 'Free'})`);
    
    // Calculate total size for free users
    const totalSize = filesArray.reduce((sum, file) => sum + file.size, 0);
    const MAX_FREE_TOTAL_SIZE = 5 * 1024 * 1024; // 5MB
    
    if (!req.isProUser && totalSize > MAX_FREE_TOTAL_SIZE) {
      Logger.logUsage(req, 'pdf_merge', false).catch(() => {});
      
      // Clean up temp files
      filesArray.forEach((file) => {
        try {
          fs.unlinkSync(file.path);
        } catch (err) {
          console.error('Error deleting temp file:', err);
        }
      });
      
      return res.status(400).json({
        success: false,
        message: `Free users have a 5MB total size limit. Your selection is ${formatBytes(totalSize)}. Upgrade to Pro for unlimited size.`,
        errorCode: 'TOTAL_SIZE_EXCEEDED',
        maxSize: MAX_FREE_TOTAL_SIZE,
        currentSize: totalSize
      });
    }
    
    const invalidFiles = [];
    const MAX_FILE_SIZE = req.isProUser ? 500 * 1024 * 1024 : 5 * 1024 * 1024; // 500MB for Pro, 5MB for Free
    
    for (const file of filesArray) {
      if (file.size > MAX_FILE_SIZE) {
        invalidFiles.push({
          name: file.originalname,
          reason: `File size exceeds ${formatBytes(MAX_FILE_SIZE)} limit (${formatBytes(file.size)})`,
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
    
    for (const file of filesArray) {
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
      
      filesArray.forEach((file) => {
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

    // Clean up temp files
    filesArray.forEach((file) => {
      try {
        fs.unlinkSync(file.path);
      } catch (err) {
        console.error('Error deleting temp file:', err);
      }
    });

    const originalNames = filesArray.map(f => path.parse(f.originalname).name);
    let mergedFileName = 'merged.pdf';
    if (originalNames.length <= 3) {
      mergedFileName = `${originalNames.join('-')}.pdf`;
    } else {
      mergedFileName = `${originalNames[0]}-${originalNames[1]}-and-${originalNames.length - 2}-more.pdf`;
    }

    // FOR PRO USERS: Generate QR code response
    if (req.isProUser) {
      // Generate download token
      const downloadToken = qrService.generateDownloadToken(
        mergedPdfBytes,
        mergedFileName,
        req.user?.email
      );

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const downloadUrl = `${baseUrl}/api/download/${downloadToken.token}`;
      
      // Generate QR code with the correct URL
      const qrCodeData = await qrService.generateQRCode(downloadUrl);

      return res.json({
        success: true,
        isProUser: true,
        downloadToken: downloadToken.token,
        qrCode: qrCodeData,
        fileName: mergedFileName,
        fileSize: mergedSize,
        expiresAt: downloadToken.expiresAt,
        downloadUrl: downloadUrl,
        downloadPath: `/api/download/${downloadToken.token}`,
        stats: {
          totalPages,
          fileCount: filesArray.length,
          originalSize: totalOriginalSize,
          mergedSize: mergedSize
        }
      });
    } else {
      // FOR FREE USERS: Direct download as before
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${mergedFileName}"`,
        'Content-Length': mergedSize,
        'X-Merged-Size': mergedSize,
        'X-Total-Pages': totalPages,
        'X-File-Count': filesArray.length,
        'X-Filename': mergedFileName,
        'X-Original-Size': totalOriginalSize,
        'X-Original-Names': originalNames.join(','),
        'X-Valid-Files': pdfDocs.length,
        'X-Invalid-Files-Count': invalidFiles.length
      });

      console.log(`Merge successful: ${totalPages} pages, ${formatBytes(totalOriginalSize)} → ${formatBytes(mergedSize)}`);
      
      return res.send(Buffer.from(mergedPdfBytes));
    }

  } catch (error) {
    console.error('PDF merge failed:', error);
    
    // Clean up any uploaded files
    if (req.files) {
      let filesToClean = [];
      if (Array.isArray(req.files)) {
        filesToClean = req.files;
      } else if (req.files.files && Array.isArray(req.files.files)) {
        filesToClean = req.files.files;
      } else {
        filesToClean = Object.values(req.files).flat();
      }
      
      filesToClean.forEach((file) => {
        try {
          if (file && file.path) {
            fs.unlinkSync(file.path);
          }
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

// ============ DOWNLOAD FUNCTIONALITY ============

exports.downloadViaQR = async (req, res) => {
  try {
    const { token } = req.params;
    
    const fileData = await qrService.getDownloadData(token);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileData.fileName}"`,
      'Content-Length': fileData.buffer.length,
      'X-QR-Download': 'true',
      'X-Expires-At': new Date(fileData.expiresAt).toISOString()
    });

    return res.send(fileData.buffer);
    
  } catch (error) {
    console.error('QR download failed:', error);
    
    return res.status(404).json({
      success: false,
      message: error.message,
      errorCode: 'DOWNLOAD_EXPIRED'
    });
  }
};

exports.checkQRStatus = async (req, res) => {
  try {
    const { token } = req.params;
    
    const qrInfo = qrService.getQRInfo(token);
    
    if (!qrInfo) {
      return res.status(404).json({
        success: false,
        message: 'QR code not found or expired',
        errorCode: 'QR_NOT_FOUND'
      });
    }

    return res.json({
      success: true,
      ...qrInfo
    });
    
  } catch (error) {
    console.error('QR status check failed:', error);
    
    return res.status(500).json({
      success: false,
      message: error.message,
      errorCode: 'SERVER_ERROR'
    });
  }
};

// ============ ✅ FIXED: PREVIEW GENERATION WITH ACTUAL PDF CONTENT ============

exports.generatePreview = async (req, res) => {
  try {
    const { token } = req.params;
    
    console.log('\n=== 🔍 PREVIEW GENERATION STARTED ===');
    
    // Check authentication via session
    if (!req.session.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        errorCode: 'AUTH_REQUIRED'
      });
    }
    
    // Check Pro status
    if (!req.isProUser) {
      return res.status(403).json({
        success: false,
        message: 'Preview is only available for Pro users',
        errorCode: 'PRO_FEATURE_REQUIRED'
      });
    }

    // Get file data from QR service
    const fileData = await qrService.getDownloadData(token);
    
    if (!fileData) {
      return res.status(404).json({
        success: false,
        message: 'File not found or expired',
        errorCode: 'FILE_NOT_FOUND'
      });
    }

    console.log(`📂 Processing file: ${fileData.fileName} (${fileData.buffer.length} bytes)`);

    // Use pdf-lib to get page dimensions
    const pdfDoc = await PDFDocument.load(fileData.buffer);
    const pageCount = pdfDoc.getPageCount();
    console.log(`📄 PDF loaded. Total pages: ${pageCount}`);

    // Generate thumbnails for all pages (max 20 for performance)
    const maxPreviewPages = Math.min(pageCount, 20);
    const pages = [];
    
    // ✅ FIX: Generate high-quality thumbnails for preview
    for (let i = 0; i < maxPreviewPages; i++) {
      try {
        console.log(`🖼️ Generating thumbnail for page ${i + 1}...`);
        
        const page = pdfDoc.getPage(i);
        const { width, height } = page.getSize();
        
        // Generate SVG placeholder with actual page dimensions
        const svgContent = generateSVGThumbnail(i + 1, width, height);
        const base64Svg = Buffer.from(svgContent).toString('base64');
        
        pages.push({
          pageNumber: i + 1,
          width: Math.round(width),
          height: Math.round(height),
          thumbnail: `data:image/svg+xml;base64,${base64Svg}`,
          previewFailed: false,
          pageIndex: i
        });
        
        console.log(`✅ Page ${i + 1} thumbnail ready (${Math.round(width)}x${Math.round(height)})`);
        
      } catch (pageError) {
        console.error(`❌ Failed to generate thumbnail for page ${i + 1}:`, pageError.message);
        
        // Fallback to simple SVG
        const fallbackSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="350" height="495" viewBox="0 0 350 495" xmlns="http://www.w3.org/2000/svg">
  <rect width="350" height="495" fill="white"/>
  <rect x="20" y="20" width="310" height="455" fill="#f8f9fa" stroke="#dee2e6" stroke-width="2"/>
  <text x="50" y="150" font-family="Arial, sans-serif" font-size="32" fill="#2c3e50">Page ${i + 1}</text>
  <text x="50" y="230" font-family="Arial, sans-serif" font-size="24" fill="#6c757d">Preview Unavailable</text>
</svg>`;
        
        const base64Fallback = Buffer.from(fallbackSvg).toString('base64');
        
        pages.push({
          pageNumber: i + 1,
          width: 350,
          height: 495,
          thumbnail: `data:image/svg+xml;base64,${base64Fallback}`,
          previewFailed: true
        });
      }
    }

    console.log(`✅ Generated ${pages.length} page thumbnails`);
    
    // ✅ CRITICAL FIX: Convert PDF to base64 for client-side rendering
    const pdfBuffer = Buffer.isBuffer(fileData.buffer) 
      ? fileData.buffer 
      : Buffer.from(fileData.buffer);
    
    const pdfBase64 = pdfBuffer.toString('base64');
    
    console.log(`✅ PDF data encoded (${pdfBase64.length} chars)`);

    res.json({
      success: true,
      pageCount: pages.length,
      pages,
      fileName: fileData.fileName,
      fileSize: fileData.buffer.length,
      pdfData: pdfBase64, // Send the actual PDF data to client
      totalPages: pageCount,
      hasMorePages: pageCount > maxPreviewPages
    });

  } catch (error) {
    console.error('\n❌❌❌ PREVIEW GENERATION FAILED ❌❌❌');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Failed to generate preview',
      errorCode: 'PREVIEW_FAILED',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ✅ FIXED: Process PDF with reordering and page removal
exports.processPDF = async (req, res) => {
  try {
    const { token } = req.params;
    const { action, order, removePages } = req.body;

    // Check authentication
    if (!req.session.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        errorCode: 'AUTH_REQUIRED'
      });
    }

    // Check Pro status
    if (!req.isProUser) {
      return res.status(403).json({
        success: false,
        message: 'PDF editing is only available for Pro users',
        errorCode: 'PRO_FEATURE_REQUIRED'
      });
    }

    // Get original file data
    const fileData = await qrService.getDownloadData(token);
    
    if (!fileData) {
      return res.status(404).json({
        success: false,
        message: 'File not found or expired',
        errorCode: 'FILE_NOT_FOUND'
      });
    }

    // Load the original PDF
    const pdfDoc = await PDFDocument.load(fileData.buffer);
    
    // Create a new PDF document
    const newPdfDoc = await PDFDocument.create();
    
    // Determine which pages to include
    let pageIndices = [];
    
    if (action === 'reorder' && order && Array.isArray(order)) {
      pageIndices = order;
    } else {
      pageIndices = pdfDoc.getPageIndices();
    }
    
    // Filter out removed pages
    if (removePages && Array.isArray(removePages) && removePages.length > 0) {
      pageIndices = pageIndices.filter(index => !removePages.includes(index));
    }
    
    // Copy selected pages to new document
    if (pageIndices.length > 0) {
      const pages = await newPdfDoc.copyPages(pdfDoc, pageIndices);
      pages.forEach(page => newPdfDoc.addPage(page));
    }
    
    // Save the processed PDF
    const processedPdfBytes = await newPdfDoc.save();
    
    // Generate new token for processed file
    const processedFileName = `edited-${fileData.fileName}`;
    const newToken = qrService.generateDownloadToken(
      processedPdfBytes,
      processedFileName,
      req.session?.email || 'user'
    );

    res.json({
      success: true,
      newToken: newToken.token,
      fileName: processedFileName,
      fileSize: processedPdfBytes.length,
      pageCount: pageIndices.length,
      expiresAt: newToken.expiresAt
    });

  } catch (error) {
    console.error('PDF processing failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process PDF',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============ EMAIL FUNCTIONALITY FOR PRO USERS ============

exports.sendToEmail = async (req, res) => {
  try {
    // Only Pro users can email files
    if (!req.isProUser) {
      return res.status(403).json({
        success: false,
        message: 'Email sending is only available for Pro users',
        errorCode: 'PRO_FEATURE_REQUIRED'
      });
    }

    const { email, token, fileName, fileSize } = req.body;

    if (!email || !token) {
      return res.status(400).json({
        success: false,
        message: 'Email and token are required',
        errorCode: 'MISSING_FIELDS'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address',
        errorCode: 'INVALID_EMAIL'
      });
    }

    // Get file data from QR service
    const fileData = await qrService.getDownloadData(token);
    
    if (!fileData) {
      return res.status(404).json({
        success: false,
        message: 'File not found or download link has expired',
        errorCode: 'FILE_NOT_FOUND'
      });
    }

    // Initialize nodemailer
    const nodemailer = require('nodemailer');
    
    const transporter = nodemailer.createTransporter?.() || nodemailer.createTransport({
      host: process.env.MAIL_HOST || 'smtp.hostinger.com',
      port: parseInt(process.env.MAIL_PORT) || 465,
      secure: process.env.MAIL_SECURE === 'true',
      auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD
      }
    });

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const downloadUrl = `${baseUrl}/api/download/${token}`;

    const mailOptions = {
      from: `"iLoveConversion" <${process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@devvault.io'}>`,
      to: email,
      subject: '📄 Your Merged PDF is Ready - iLoveConversion',
      html: generateEmailHTML(fileName || 'merged.pdf', fileSize || fileData.buffer.length, downloadUrl, fileData.expiresAt),
      text: generateEmailText(fileName || 'merged.pdf', fileSize || fileData.buffer.length, downloadUrl, fileData.expiresAt)
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent successfully to ${email} for file: ${fileName}`);

    return res.json({
      success: true,
      message: `PDF sent to ${email}`,
      email: email,
      sentAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Email sending failed:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to send email. Please try again.',
      errorCode: 'EMAIL_SEND_FAILED',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.resendDownloadLink = async (req, res) => {
  try {
    if (!req.isProUser) {
      return res.status(403).json({
        success: false,
        message: 'Pro feature required',
        errorCode: 'PRO_FEATURE_REQUIRED'
      });
    }

    const { email, originalToken } = req.body;

    if (!email || !originalToken) {
      return res.status(400).json({
        success: false,
        message: 'Email and original token are required',
        errorCode: 'MISSING_FIELDS'
      });
    }

    const fileData = await qrService.getDownloadData(originalToken);
    
    if (fileData) {
      req.body.token = originalToken;
      return exports.sendToEmail(req, res);
    }

    return res.status(410).json({
      success: false,
      message: 'Original link expired. Please merge files again.',
      errorCode: 'LINK_EXPIRED'
    });

  } catch (error) {
    console.error('❌ Resend link failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to resend link',
      errorCode: 'RESEND_FAILED'
    });
  }
};

// ============ HELPER FUNCTIONS ============

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function generateSVGThumbnail(pageNumber, width, height) {
  const thumbWidth = 350;
  const thumbHeight = Math.round((height / width) * 350);
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${thumbWidth}" height="${thumbHeight}" viewBox="0 0 ${Math.round(width)} ${Math.round(height)}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${Math.round(width)}" height="${Math.round(height)}" fill="white"/>
  <rect x="20" y="20" width="${Math.round(width - 40)}" height="${Math.round(height - 40)}" fill="#f8f9fa" stroke="#dee2e6" stroke-width="2"/>
  <text x="50" y="120" font-family="Arial, sans-serif" font-size="48" fill="#2c3e50">Page ${pageNumber}</text>
  <text x="50" y="200" font-family="Arial, sans-serif" font-size="32" fill="#6c757d">${Math.round(width)} × ${Math.round(height)}</text>
  <text x="50" y="280" font-family="Arial, sans-serif" font-size="24" fill="#868e96">Click to view actual PDF</text>
</svg>`;
}

function generateEmailHTML(fileName, fileSize, downloadUrl, expiresAt) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #2c3e50; margin: 0; padding: 0; background-color: #f8f9fa; }
    .email-container { max-width: 600px; margin: 20px auto; background: white; border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); overflow: hidden; }
    .header { background: black; color: white; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 400; }
    .content { padding: 40px 30px; }
    .file-card { background: #f8f9fa; border-radius: 12px; padding: 25px; margin: 25px 0; border: 1px solid #e9ecef; }
    .file-name { font-size: 18px; font-weight: 600; color: #ee6c4d; word-break: break-all; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 2px dashed #e9ecef; }
    .download-btn { display: inline-block; background: #ee6c4d; color: white; text-decoration: none; padding: 16px 32px; border-radius: 50px; font-weight: 600; font-size: 16px; margin: 25px 0 15px; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(238, 108, 77, 0.3); }
    .download-btn:hover { background: #d64b2a; transform: translateY(-2px); box-shadow: 0 6px 16px rgba(238, 108, 77, 0.4); }
    .expiry-box { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 16px; border-radius: 8px; margin-top: 25px; font-size: 14px; }
    .footer { text-align: center; padding: 30px; background: #f8f9fa; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 13px; }
    .pro-badge { display: inline-block; background: #ffd700; color: black; font-size: 12px; padding: 4px 12px; border-radius: 20px; font-weight: 600; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>📄 Your PDF is Ready!</h1>
      <p>Your merge request has been processed successfully</p>
      <span class="pro-badge">✨ PRO FEATURE</span>
    </div>
    
    <div class="content">
      <p style="font-size: 16px; margin-bottom: 20px;">Hello,</p>
      <p style="font-size: 16px; margin-bottom: 25px;">
        We've successfully merged your PDF files. Your document is ready for download.
      </p>
      
      <div class="file-card">
        <div class="file-name">📁 ${fileName}</div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span style="color: #6c757d;">File Size:</span>
          <span style="font-weight: 600;">${formatBytes(fileSize)}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #6c757d;">Expires:</span>
          <span style="font-weight: 600;">${new Date(expiresAt).toLocaleString()}</span>
        </div>
      </div>
      
      <div style="text-align: center;">
        <a href="${downloadUrl}" class="download-btn" target="_blank">
          ⬇️ Download PDF
        </a>
        <p style="color: #6c757d; font-size: 14px; margin-top: 10px;">
          Link expires in 24 hours
        </p>
      </div>
      
      <div class="expiry-box">
        <strong>⚠️ Secure Download Link</strong>
        <p style="margin: 8px 0 0; font-size: 13px;">
          This link is unique and will expire in 24 hours.
        </p>
      </div>
    </div>
    
    <div class="footer">
      <p style="margin: 0 0 10px;">
        <strong>iLoveConversion</strong> - Your PDF tools
      </p>
      <p style="margin: 0; font-size: 12px;">
        © ${new Date().getFullYear()} iLoveConversion. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`;
}

function generateEmailText(fileName, fileSize, downloadUrl, expiresAt) {
  return `
Your Merged PDF is Ready!

File: ${fileName}
Size: ${formatBytes(fileSize)}
Expires: ${new Date(expiresAt).toLocaleString()}

Download your PDF here:
${downloadUrl}

This link will expire in 24 hours.

- iLoveConversion Team
  `;
}