const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const os = require('os');

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
      'image/jpeg'
    ];

    if (!allowedMimes.includes(file.mimetype)) {
      return cb(
        new Error('Only PDF, DOC, DOCX, PNG, and JPG files are allowed')
      );
    }

    cb(null, true);
  }
});






//Routes
router.post('/compress-pdf',upload.single('pdf'), compresspdfController.compressPdf);
router.post('/merge-pdf', upload.array('files', 10), mergePdfController.mergePdfs);
router.post('/pdf-to-word', upload.single('file'), pdfToWordController.pdfToWord);
router.post('/word-to-pdf', upload.single('file'), wordToPdfController.wordToPdf);
router.post('/pdf-to-png', upload.single('file'), pdfToPngController.pdfToPng);
router.post('/image-to-pdf',upload.array('images', 20),imageToPdfController.imageToPdf);
router.post('/ppt-to-pdf',upload.single('file'),pptToPdfController.pptToPdf);
router.post( '/rotate-pdf',upload.array('files', 10),rotatePdfController.rotatePdf);


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


module.exports = router;
