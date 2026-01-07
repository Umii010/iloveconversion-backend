const path = require('path');
const os = require('os');
const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');
const Logger = require('../services/logger');
const execPromise = util.promisify(require('child_process').exec);

exports.repairPdf = async (req, res) => {
  if (!req.file) {
        Logger.logUsage(req, 'pdf_repair', false).catch(() => {});

    return res.status(400).json({ 
      success: false, 
      message: 'No PDF uploaded' 
    });
  }

  const inputPath = req.file.path;
  const originalName = path.parse(req.file.originalname).name;
  const outputPath = path.join(os.tmpdir(), `${originalName}_repaired.pdf`);
  const pythonPath = `"C:\\Users\\Admin\\AppData\\Local\\Python\\pythoncore-3.10-64\\python.exe"`;
  const scriptPath = path.join(__dirname, 'repair_pdf.py');
  const command = `${pythonPath} "${scriptPath}" "${inputPath}" "${outputPath}" 2>&1`;

  try {
    try {
      const checkCmd = `${pythonPath} -c "import pikepdf, pypdf; print('Dependencies OK')"`;
      await execPromise(checkCmd, { timeout: 10000 });
    } catch (checkError) {
    }

    const startTime = Date.now(); 
    const { stdout, stderr } = await execPromise(command, {
      maxBuffer: 10 * 1024 * 1024,
      encoding: 'utf8',
      timeout: 300000 
    });

    const processingTime = ((Date.now() - startTime) / 1000).toFixed(1);    
    let repairReport;
    try {
      repairReport = JSON.parse(stdout);
    } catch (parseError) {
      console.error('Failed to parse repair report:', parseError);
      repairReport = {
        success: false,
        final_status: 'error',
        message: 'Failed to parse repair results'
      };
    }
    if (!fs.existsSync(outputPath)) {
      console.error('No output file created');
            Logger.logUsage(req, 'pdf_repair', false).catch(() => {});

      throw new Error('Repair process failed - no output generated');
    }

    const finalSize = fs.statSync(outputPath).size;
    const isErrorReport = finalSize < 2000;
    const content = fs.readFileSync(outputPath, 'latin1');
    const containsError = content.includes('PDF REPAIR FAILED') || 
                         content.includes('Repair Failed') ||
                         content.includes('severely corrupted');
    
    const isActuallyRepaired = repairReport.success && 
                              !isErrorReport && 
                              !containsError &&
                              repairReport.final_status !== 'failed' &&
                              repairReport.final_status !== 'error';

 if (isActuallyRepaired) {
      Logger.logUsage(req, 'pdf_repair', true).catch(() => {}); 
    } else {
      Logger.logUsage(req, 'pdf_repair', false).catch(() => {});
    } 
       let responseData = {
      processing_time: `${processingTime}s`,
      original_size: repairReport.original_size ? `${(repairReport.original_size / 1024 / 1024).toFixed(2)} MB` : 'Unknown',
      new_size: `${(finalSize / 1024).toFixed(2)} KB`,
      pages_recovered: repairReport.pages_recovered || 0,
      issues_fixed: repairReport.issues_fixed || [],
      final_status: repairReport.final_status || 'unknown'
    };

    let fileName;
    if (isActuallyRepaired) {
      fileName = `${originalName}_repaired.pdf`;
      responseData.success = true;
      responseData.message = 'PDF successfully repaired!';
    } else {
      fileName = `${originalName}_repair_report.pdf`;
      responseData.success = false;
      responseData.message = 'PDF could not be repaired';
      responseData.details = 'File is severely corrupted. A repair report has been generated.';
      responseData.recommendations = [
        'Try Adobe Acrobat Pro',
        'Use online repair services',
        'Re-download from original source'
      ];
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('X-Repair-Status', isActuallyRepaired ? 'repaired' : 'failed');
    res.setHeader('X-Repair-Data', JSON.stringify(responseData));

    const fileStream = fs.createReadStream(outputPath);
    fileStream.pipe(res);
        fileStream.on('close', () => {
      setTimeout(() => {
        try { fs.unlinkSync(inputPath); } catch {}
        try { fs.unlinkSync(outputPath); } catch {}
      }, 3000);
    });

  } catch (error) {
    console.error('Repair process failed:', error);
        Logger.logUsage(req, 'pdf_repair', false).catch(() => {});

    
    try { fs.unlinkSync(inputPath); } catch {}
    
    return res.status(500).json({
      success: false,
      message: 'PDF repair process failed',
      details: error.message,
      recommendations: [
        'File may be password protected',
        'Try using Adobe Acrobat Pro',
        'File might be severely corrupted'
      ]
    });
  }
};