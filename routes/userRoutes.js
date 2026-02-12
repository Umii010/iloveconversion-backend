const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const os = require('os');

const UserController = require('../controllers/userController');
const pdfToPngController = require('../controllers/pdfToPngController');
const compresspdfController = require('../controllers/compresspdfController');
const mergePdfController = require('../controllers/mergepdfController');
const pdfToWordController = require('../controllers/pdfToWordController');
const wordToPdfController = require('../controllers/wordToPdfController');
const imageToPdfController = require('../controllers/imageToPdfController');
const pptToPdfController = require('../controllers/pptToPdfController');
const rotatePdfController = require('../controllers/rotatePdfController');
const unlockPdfController = require('../controllers/unlockPdfController');
const pdfToExcelController = require('../controllers/pdfToExcelController');
const htmlToPdfController = require('../controllers/htmlToPdfController');
const pdfToPptController = require('../controllers/pdfToPptController');
const repairPdfController = require('../controllers/repairPdfController');
const signPdfController = require('../controllers/signPdfController');
const organizePdfController = require('../controllers/organizePdfController');
const cropPdfController = require('../controllers/cropPdfController');
const addPageNumbersController = require('../controllers/addPageNumbersController');
const protectPdfController = require('../controllers/protectPdfController');
const ocrPdfController = require('../controllers/ocrPdfController');
const FileCorruptorController = require('../controllers/fileCorruptorController');
const minifyController = require('../controllers/minifyController');
const videoDownloaderController = require('../controllers/videoDownloaderController');
const screenshotController = require('../controllers/screenshotController');
const checkSubscription = require('../middleware/subscriptionCheck');


const { 
  registerValidation, 
  loginValidation, 
  updateUserValidation 
} = require('../middleware/validation');


const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }
  next();
};


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(os.tmpdir()));
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/png',
      'image/jpeg',
      
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      'application/x-tar',
      'application/x-gzip',
      'audio/mpeg',
      'audio/wav',
      'audio/x-wav',
      'video/mp4',
      'video/x-msvideo',
      'text/plain',
      'text/csv',
      'application/rtf',
      'image/gif',
      'image/bmp',
      'image/tiff'
    ];
    const allowedExtensions = [
      '.pdf',
      '.doc', '.docx',
      '.ppt', '.pptx',
      '.xls', '.xlsx',
      '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff',
      '.zip', '.rar', '.7z', '.tar', '.gz',
      '.mp3', '.wav',
      '.mp4', '.avi',
      '.txt', '.csv', '.rtf'
    ];

    const fileExt = path.extname(file.originalname).toLowerCase();
    
    if (allowedMimes.includes(file.mimetype) || 
        allowedExtensions.includes(fileExt)) {
      cb(null, true);
    } else {
      return cb(
        new Error(
          `File type not allowed. ` +
          `Allowed types: PDF, DOC/DOCX, PPT/PPTX, XLS/XLSX, ` +
          `Images (PNG/JPG/GIF/BMP), ` +
          `Archives (ZIP/RAR/7Z/TAR), ` +
          `Audio (MP3/WAV), Video (MP4/AVI), ` +
          `Text files (TXT/CSV/RTF)`
        )
      );
    }
  }
});


router.get('/auth/status', UserController.checkAuthStatus);


// Public routes
router.post('/register', registerValidation, UserController.register);
router.post('/login', loginValidation, UserController.login);

// Forgot password routes
router.post('/forgot-password', UserController.forgotPassword);
router.post('/reset-password', UserController.resetPassword);

router.post('/logout', UserController.logout);
router.post('/logout-all', UserController.logoutAll);

// User routes (protected in production)
router.get('/users', UserController.getAllUsers);
router.get('/users/:id', UserController.getUserById);
router.put('/users/:id', updateUserValidation, UserController.updateUser);
router.delete('/users/:id', UserController.deleteUser);



//Routes
router.post('/compress-pdf', checkSubscription, (req, res, next) => {
  // Adjust multer limits based on subscription
  const maxFiles = req.isProUser ? 999 : 15;
  
  upload.array('pdf', maxFiles)(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
        errorCode: 'UPLOAD_ERROR'
      });
    }
    next();
  });
}, compresspdfController.compressPdf);

router.post('/merge-pdf', checkSubscription, (req, res, next) => {
  const maxFiles = req.isProUser ? 999 : 7;
  const maxSize = req.isProUser ? 500 * 1024 * 1024 : 5 * 1024 * 1024; 
  const dynamicUpload = upload.array('files', maxFiles);
  
  dynamicUpload(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: `File size exceeds ${formatBytes(maxSize)} limit`,
          errorCode: 'FILE_TOO_LARGE',
          maxSize: maxSize
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          message: `Maximum ${maxFiles} files allowed`,
          errorCode: 'MAX_FILES_EXCEEDED',
          maxFiles: maxFiles
        });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          success: false,
          message: 'Invalid file field name. Use "files" as field name.',
          errorCode: 'INVALID_FIELD_NAME'
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message,
        errorCode: 'UPLOAD_ERROR'
      });
    }
    next();
  });
}, mergePdfController.mergePdfs);


router.get('/download/:token', (req, res) => {
  // Handle preflight (OPTIONS) requests
  if (req.method === 'OPTIONS') {
    res.set({
      'Access-Control-Allow-Origin': req.headers.origin || 'http://192.168.18.62:5173',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cache-Control, Pragma, Accept',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400'
    });
    return res.sendStatus(200);
  }

  // Handle actual GET requests
  return mergePdfController.downloadViaQR(req, res);
});

router.get('/qr-status/:token', mergePdfController.checkQRStatus);
router.post(
  '/send-to-email', 
  checkSubscription,
  mergePdfController.sendToEmail
);

router.get(
  '/preview/:token',
  checkSubscription, // This sets req.isProUser based on session
  (req, res, next) => {
    console.log('Preview access - User authenticated:', !!req.session.userId);
    console.log('Is Pro User:', req.isProUser);
    
    // Check if user is authenticated
    if (!req.session.userId) {
      return res.status(401).json({
        success: false,
        message: 'Please login to use preview feature',
        errorCode: 'LOGIN_REQUIRED'
      });
    }
    
    // Check if user is Pro
    if (!req.isProUser) {
      return res.status(403).json({
        success: false,
        message: 'Preview feature requires a Pro subscription',
        errorCode: 'PRO_FEATURE_REQUIRED'
      });
    }
    
    next();
  },
  mergePdfController.generatePreview
);


router.post(
  '/process-pdf/:token',
  checkSubscription,
  (req, res, next) => {
    console.log('Process PDF - Is Pro User:', req.isProUser);
    
    if (!req.session.userId) {
      return res.status(401).json({
        success: false,
        message: 'Please login to edit PDF',
        errorCode: 'LOGIN_REQUIRED'
      });
    }
    
    if (!req.isProUser) {
      return res.status(403).json({
        success: false,
        message: 'PDF editing requires a Pro subscription',
        errorCode: 'PRO_FEATURE_REQUIRED'
      });
    }
    
    next();
  },
  mergePdfController.processPDF
);

router.post('/pdf-to-word', upload.single('file'), pdfToWordController.pdfToWord);

router.post('/word-to-pdf', upload.single('file'), wordToPdfController.wordToPdf);
router.post('/pdf-to-png', upload.single('file'), pdfToPngController.pdfToPng);
router.post('/image-to-pdf', 
  checkSubscription,
  (req, res, next) => {
    // Use dynamic limits from middleware
    const maxFiles = req.maxFiles || 7;
    const maxFileSize = req.maxFileSize || (100 * 1024 * 1024);
    
    console.log('Setting multer limits:', { maxFiles, maxFileSize });
    
    // Create multer instance with dynamic limits
    const dynamicUpload = upload.array('images', maxFiles);
    
    dynamicUpload(req, res, (err) => {
      if (err) {
        console.error('Multer error:', err.message);
        return res.status(400).json({
          success: false,
          message: err.message,
          errorCode: 'UPLOAD_ERROR'
        });
      }
      next();
    });
  },
  imageToPdfController.imageToPdf
);
router.post('/ppt-to-pdf',upload.single('file'),pptToPdfController.pptToPdf);
router.post( '/rotate-pdf',upload.array('files', 10),rotatePdfController.rotatePdf);
router.post('/corrupt-files', checkSubscription, (req, res, next) => {
  // Set limits based on subscription
  const maxFiles = req.isProUser ? 999 : 10;
  const maxFileSize = req.isProUser ? 500 * 1024 * 1024 : 100 * 1024 * 1024;
  
  // Configure multer with dynamic limits
  const dynamicUpload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
      }
    }),
    limits: {
      fileSize: maxFileSize,
      files: maxFiles
    },
    fileFilter: (req, file, cb) => {
      // Accept all files for corruption
      cb(null, true);
    }
  });
  
  dynamicUpload.array('files', maxFiles)(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: `File too large. Maximum size: ${formatBytes(maxFileSize)}`,
          maxFileSize: maxFileSize,
          isProUser: req.isProUser
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          error: `Too many files. Maximum: ${maxFiles}`,
          maxFiles: maxFiles,
          isProUser: req.isProUser
        });
      }
      return res.status(400).json({
        success: false,
        error: err.message
      });
    }
    next();
  });
}, FileCorruptorController.handleCorruptFiles);
router.post('/unlock-pdf', upload.array('files', 10),unlockPdfController.unlockPdf);
router.post('/pdf-to-excel',upload.single('file'),pdfToExcelController.pdfToExcel);
router.post('/html-to-pdf', htmlToPdfController.htmlToPdf);
router.post('/pdf-to-ppt',upload.single('file'),pdfToPptController.pdfToPpt);
router.post('/repair-pdf',upload.single('file'),repairPdfController.repairPdf);
router.post('/sign-pdf',upload.fields([{ name: 'file', maxCount: 1 }, { name: 'signatureFile', maxCount: 1 }]),(req, res) => {req.body.signatureFile = req.files['signatureFile'][0].path; signPdfController.signPdf(req,res);});

router.post('/organize-pdf', upload.single('file'), organizePdfController.organizePdf);
router.post('/crop-pdf', upload.single('file'), cropPdfController.cropPdf);
router.post('/add-page-numbers', upload.single('file'), addPageNumbersController.addPageNumbers);
router.post('/protect-pdf', upload.single('file'), protectPdfController.protectPdf);
router.post('/ocr-pdf', upload.single('file'), ocrPdfController.ocrPdf);
router.post('/process-code', minifyController.processCode);


router.post('/screenshot', (req, res, next) => {
  next();
}, screenshotController.captureScreenshot);

// router.post('/color-extract', colorExtractorController.extractColors);


// Video Downloader Routes
router.post('/video-downloader/info', videoDownloaderController.getVideoInfo);
router.post('/video-downloader/download', videoDownloaderController.downloadVideo);
router.post('/video-downloader/download-all', videoDownloaderController.downloadAllFormats);


module.exports = router;
