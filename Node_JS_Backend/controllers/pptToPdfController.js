const path = require('path');
const os = require('os');
const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

exports.pptToPdf = async (req, res) => {
  console.log('🚀 PPT to PDF conversion started');
  
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No PowerPoint file uploaded'
    });
  }

  const inputPath = req.file.path;
  const originalName = path.parse(req.file.originalname).name;
  const outputPath = path.join(os.tmpdir(), `${originalName}.pdf`);

  console.log(`📄 Input: ${inputPath}`);
  console.log(`📄 Output: ${outputPath}`);

  const pythonPath = `"C:\\Users\\Admin\\AppData\\Local\\Python\\pythoncore-3.10-64\\python.exe"`;
  const scriptPath = path.join(__dirname, 'ppt_to_pdf.py');

  const command = `${pythonPath} "${scriptPath}" "${inputPath}" "${outputPath}" 2>&1`;

  console.log(`⚡ Executing: ${command}`);

  try {
    // Check if we should use alternative method
    console.log('🔍 Detecting Office 2013 restrictions...');
    
    // Test PowerPoint visibility restriction
    const testCommand = `${pythonPath} -c "
import win32com.client
try:
    ppt = win32com.client.Dispatch('PowerPoint.Application.15')
    try:
        ppt.Visible = False
        print('VISIBLE_FALSE_OK')
    except:
        print('VISIBLE_FALSE_BLOCKED')
    ppt.Quit()
except Exception as e:
    print('ERROR:', str(e))
"`;
    
    const { stdout: testOutput } = await execPromise(testCommand, { timeout: 30000 });
    
    if (testOutput.includes('VISIBLE_FALSE_BLOCKED')) {
      console.log('⚠️ Office 2013 has visibility restrictions - using workaround');
    } else if (testOutput.includes('VISIBLE_FALSE_OK')) {
      console.log('✅ PowerPoint allows background operation');
    } else {
      console.log('ℹ️ PowerPoint test:', testOutput);
    }

    // Execute conversion
    console.log('🔄 Starting conversion with multiple fallbacks...');
    const startTime = Date.now();
    
    const { stdout, stderr } = await execPromise(command, {
      maxBuffer: 10 * 1024 * 1024,
      encoding: 'utf8',
      timeout: 300000, // 5 minutes
      windowsHide: false // Important: don't hide window for Office 2013
    });

    const elapsedTime = (Date.now() - startTime) / 1000;
    console.log(`⏱️ Total time: ${elapsedTime.toFixed(1)}s`);
    
    console.log('📋 Conversion log:');
    console.log(stdout);
    
    if (stderr) {
      console.error('⚠️ Warnings:', stderr);
    }

    // Check result
    if (!fs.existsSync(outputPath)) {
      throw new Error('PDF file was not created');
    }

    const stats = fs.statSync(outputPath);
    console.log(`📊 PDF size: ${stats.size} bytes`);
    
    // Check if it's an instruction PDF
    if (stats.size < 5000) {
      const content = fs.readFileSync(outputPath, 'latin1');
      if (content.includes('Manual Conversion Required') || 
          content.includes('Automated conversion failed')) {
        console.log('⚠️ Created instruction PDF instead of conversion');
        
        // Send instruction PDF with appropriate message
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${originalName}_instructions.pdf"`);
        
        const fileStream = fs.createReadStream(outputPath);
        fileStream.pipe(res);
        
        fileStream.on('close', () => {
          setTimeout(() => {
            try { fs.unlinkSync(inputPath); } catch {}
            try { fs.unlinkSync(outputPath); } catch {}
          }, 3000);
        });
        
        return;
      }
    }

    // Send successful conversion
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${originalName}.pdf"`);
    
    const fileStream = fs.createReadStream(outputPath);
    fileStream.pipe(res);
    
    // Cleanup
    fileStream.on('close', () => {
      setTimeout(() => {
        try { fs.unlinkSync(inputPath); } catch {}
        try { fs.unlinkSync(outputPath); } catch {}
        console.log('🧹 Cleaned up temporary files');
      }, 3000);
    });
    
    fileStream.on('error', (err) => {
      console.error('❌ Stream error:', err);
      try { fs.unlinkSync(inputPath); } catch {}
      try { fs.unlinkSync(outputPath); } catch {}
    });

  } catch (error) {
    console.error('❌ Conversion failed:', error.message);
    
    // Cleanup input file
    try { fs.unlinkSync(inputPath); } catch {}
    
    // Check if partial output exists
    if (fs.existsSync(outputPath)) {
      try { fs.unlinkSync(outputPath); } catch {}
    }
    
    // Provide specific error messages
    let userMessage = 'PowerPoint to PDF conversion failed. ';
    
    if (error.message.includes('timeout')) {
      userMessage += 'The conversion took too long. ';
    }
    
    userMessage += 'Please ensure PowerPoint 2013 is properly installed and activated.';
    
    return res.status(500).json({
      success: false,
      message: userMessage,
      details: error.message
    });
  }
};