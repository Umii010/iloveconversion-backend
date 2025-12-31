const path = require('path');
const os = require('os');
const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(require('child_process').exec);

exports.repairPdf = async (req, res) => {
  console.log('🔧 Starting comprehensive PDF repair...');
  
  if (!req.file) {
    return res.status(400).json({ 
      success: false, 
      message: 'No PDF uploaded' 
    });
  }

  const inputPath = req.file.path;
  const originalName = path.parse(req.file.originalname).name;
  const outputPath = path.join(os.tmpdir(), `${originalName}_repaired.pdf`);

  console.log(`📄 Input: ${inputPath}`);
  console.log(`📄 Output: ${outputPath}`);

  const pythonPath = `"C:\\Users\\Admin\\AppData\\Local\\Python\\pythoncore-3.10-64\\python.exe"`;
  const scriptPath = path.join(__dirname, 'repair_pdf.py');

  const command = `${pythonPath} "${scriptPath}" "${inputPath}" "${outputPath}" 2>&1`;

  console.log(`⚡ Executing: ${command}`);

  try {
    // Check dependencies first
    console.log('🔍 Checking Python packages...');
    try {
      const checkCmd = `${pythonPath} -c "import pikepdf, pypdf; print('Dependencies OK')"`;
      await execPromise(checkCmd, { timeout: 10000 });
      console.log('✅ Dependencies available');
    } catch (checkError) {
      console.log('⚠️ Missing packages. Will use fallback methods.');
    }

    // Execute repair
    console.log('🛠️ Performing comprehensive repair...');
    const startTime = Date.now();
    
    const { stdout, stderr } = await execPromise(command, {
      maxBuffer: 10 * 1024 * 1024,
      encoding: 'utf8',
      timeout: 300000 // 5 minutes
    });

    const processingTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`⏱️ Total time: ${processingTime}s`);
    
    // Parse JSON output from Python script
    let repairReport;
    try {
      repairReport = JSON.parse(stdout);
      console.log('📊 Repair report:', JSON.stringify(repairReport, null, 2));
    } catch (parseError) {
      console.error('❌ Failed to parse repair report:', parseError);
      console.log('Raw output:', stdout);
      repairReport = {
        success: false,
        final_status: 'error',
        message: 'Failed to parse repair results'
      };
    }

    // Check if output file exists
    if (!fs.existsSync(outputPath)) {
      console.error('❌ No output file created');
      throw new Error('Repair process failed - no output generated');
    }

    const finalSize = fs.statSync(outputPath).size;
    console.log(`📦 Final file size: ${finalSize} bytes`);

    // Determine the actual result
    const isErrorReport = finalSize < 2000; // Error reports are small
    const content = fs.readFileSync(outputPath, 'latin1');
    const containsError = content.includes('PDF REPAIR FAILED') || 
                         content.includes('Repair Failed') ||
                         content.includes('severely corrupted');
    
    const isActuallyRepaired = repairReport.success && 
                              !isErrorReport && 
                              !containsError &&
                              repairReport.final_status !== 'failed' &&
                              repairReport.final_status !== 'error';

    // Prepare response based on actual result
    let responseData = {
      processing_time: `${processingTime}s`,
      original_size: repairReport.original_size ? `${(repairReport.original_size / 1024 / 1024).toFixed(2)} MB` : 'Unknown',
      new_size: `${(finalSize / 1024).toFixed(2)} KB`,
      pages_recovered: repairReport.pages_recovered || 0,
      issues_fixed: repairReport.issues_fixed || [],
      final_status: repairReport.final_status || 'unknown'
    };

    // Set appropriate filename
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

    // Send the file with appropriate headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('X-Repair-Status', isActuallyRepaired ? 'repaired' : 'failed');
    res.setHeader('X-Repair-Data', JSON.stringify(responseData));

    const fileStream = fs.createReadStream(outputPath);
    fileStream.pipe(res);
    
    // Cleanup
    fileStream.on('close', () => {
      setTimeout(() => {
        try { fs.unlinkSync(inputPath); } catch {}
        try { fs.unlinkSync(outputPath); } catch {}
        console.log('🧹 Temporary files cleaned');
      }, 3000);
    });

  } catch (error) {
    console.error('❌ Repair process failed:', error);
    
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