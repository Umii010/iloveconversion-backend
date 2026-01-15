const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const Logger = require('../services/logger');
const archiver = require('archiver');

class FileCorruptorController {
  // New method for handling multiple files
  handleCorruptFiles = async (req, res) => {
    const startTime = Date.now();
    const tempFiles = [];
    
    try {
      if (!req.files || !req.files.length) {
        Logger.logUsage(req, 'file_corruptor', false).catch(() => {});
        return res.status(400).json({ 
          success: false,
          error: 'No files provided' 
        });
      }

      // Validate file count
      const MAX_FILES = 10;
      if (req.files.length > MAX_FILES) {
        // Cleanup uploaded files
        req.files.forEach(file => {
          try {
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          } catch (err) {
            console.warn(`Cleanup error:`, err.message);
          }
        });
        
        return res.status(400).json({
          success: false,
          error: `Maximum ${MAX_FILES} files allowed. You uploaded ${req.files.length} files.`
        });
      }

      const { method = 'extreme', intensity = 100 } = req.body;
      const intensityValue = Math.min(100, Math.max(1, parseInt(intensity) || 100));
      
      const results = [];
      
      // Process each file
      for (const file of req.files) {
        try {
          const filePath = file.path;
          const originalBuffer = await fs.readFile(filePath);
          
          let corruptedBuffer;
          switch (method) {
            case 'header':
              corruptedBuffer = this.extremeHeaderCorruption(originalBuffer, intensityValue);
              break;
            case 'random':
              corruptedBuffer = this.extremeRandomCorruption(originalBuffer, intensityValue);
              break;
            case 'truncate':
              corruptedBuffer = this.extremeTruncateCorruption(originalBuffer, intensityValue);
              break;
            case 'xor':
              corruptedBuffer = this.extremeXORCorruption(originalBuffer, intensityValue);
              break;
            case 'extreme':
              corruptedBuffer = this.completeDestruction(originalBuffer, intensityValue);
              break;
            case 'format':
              corruptedBuffer = this.formatSpecificDestruction(originalBuffer, file.originalname);
              break;
            default:
              corruptedBuffer = this.completeDestruction(originalBuffer, intensityValue);
          }

          results.push({
            fileName: file.originalname,
            originalSize: originalBuffer.length,
            corruptedSize: corruptedBuffer.length,
            buffer: corruptedBuffer,
            success: true,
            error: null
          });
          
          tempFiles.push(filePath);
          
        } catch (fileError) {
          console.error(`Error corrupting ${file.originalname}:`, fileError.message);
          results.push({
            fileName: file.originalname,
            originalSize: file.size,
            corruptedSize: 0,
            buffer: null,
            success: false,
            error: fileError.message
          });
          
          // Cleanup temp file for failed file
          try {
            if (fs.existsSync(file.path)) {
              await fs.unlink(file.path);
            }
          } catch (cleanupErr) {
            console.warn(`Cleanup error:`, cleanupErr.message);
          }
        }
      }

      // Count successes and failures
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);
      
      if (successful.length === 0) {
        return res.status(500).json({
          success: false,
          error: 'All files failed to corrupt',
          results: results
        });
      }

      Logger.logUsage(req, 'file_corruptor', successful.length > 0).catch(() => {});
      
      // If only one file, send it directly
      if (successful.length === 1) {
        const result = successful[0];
        const originalFilename = result.fileName;
        const extension = path.extname(originalFilename);
        const baseName = path.basename(originalFilename, extension);
        const corruptedFilename = `CORRUPTED_${baseName}${extension}`;
        
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${corruptedFilename}"`);
        res.setHeader('X-Corruption-Method', method);
        res.setHeader('X-Corruption-Intensity', intensityValue);
        res.setHeader('X-Original-Size', result.originalSize);
        res.setHeader('X-Corrupted-Size', result.corruptedSize);
        res.setHeader('X-Successful-Count', '1');
        res.setHeader('X-Failed-Count', failed.length.toString());
        res.setHeader('X-Total-Files', req.files.length.toString());
        res.setHeader('X-Warning', 'FILE IS COMPLETELY UNUSABLE - DO NOT ATTEMPT TO OPEN');
        
        res.send(result.buffer);
        
        // Cleanup temp files
        res.on('finish', () => {
          setTimeout(() => {
            this.cleanupTempFiles(tempFiles);
          }, 2000);
        });
        
      } else {
        // Multiple files - create ZIP
        await this.createCorruptedZip(results, method, intensityValue, res, tempFiles);
      }

    } catch (error) {
      console.error('Batch corruption error:', error);
      Logger.logUsage(req, 'file_corruptor', false).catch(() => {});
      
      // Cleanup any temp files
      this.cleanupTempFiles(tempFiles);
      
      res.status(500).json({ 
        success: false,
        error: 'Failed to corrupt files',
        message: error.message,
        processingTime: Date.now() - startTime
      });
    }
  }

  // Original single file method for backward compatibility
  handleCorruptFile = async (req, res) => {
    try {
      if (!req.file) {
        Logger.logUsage(req, 'file_corruptor', false).catch(() => {});
        return res.status(400).json({ error: 'No file provided' });
      }

      const { method = 'extreme', intensity = 100 } = req.body;
      const intensityValue = Math.min(100, Math.max(1, parseInt(intensity) || 100));
      const filePath = req.file.path;
      const originalBuffer = await fs.readFile(filePath);
      
      let corruptedBuffer;
      switch (method) {
        case 'header':
          corruptedBuffer = this.extremeHeaderCorruption(originalBuffer, intensityValue);
          break;
        case 'random':
          corruptedBuffer = this.extremeRandomCorruption(originalBuffer, intensityValue);
          break;
        case 'truncate':
          corruptedBuffer = this.extremeTruncateCorruption(originalBuffer, intensityValue);
          break;
        case 'xor':
          corruptedBuffer = this.extremeXORCorruption(originalBuffer, intensityValue);
          break;
        case 'extreme':
          corruptedBuffer = this.completeDestruction(originalBuffer, intensityValue);
          break;
        case 'format':
          corruptedBuffer = this.formatSpecificDestruction(originalBuffer, req.file.originalname);
          break;
        default:
          corruptedBuffer = this.completeDestruction(originalBuffer, intensityValue);
      }

      const originalFilename = req.file.originalname;
      const extension = path.extname(originalFilename);
      const baseName = path.basename(originalFilename, extension);
      const corruptedFilename = `CORRUPTED_${baseName}${extension}`;
      
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${corruptedFilename}"`);
      res.setHeader('X-Corruption-Method', method);
      res.setHeader('X-Corruption-Intensity', intensityValue);
      res.setHeader('X-Original-Size', originalBuffer.length);
      res.setHeader('X-Corrupted-Size', corruptedBuffer.length);
      res.setHeader('X-Warning', 'FILE IS COMPLETELY UNUSABLE - DO NOT ATTEMPT TO OPEN');
      
      Logger.logUsage(req, 'file_corruptor', true).catch(() => {});
      
      await fs.unlink(filePath).catch(() => {});
      res.send(corruptedBuffer);

    } catch (error) {
      console.error('Corruption error:', error);
      Logger.logUsage(req, 'file_corruptor', false).catch(() => {});
      res.status(500).json({ 
        error: 'Failed to corrupt file',
        message: error.message 
      });
    }
  }

  // Create ZIP from corrupted files
  createCorruptedZip = async (results, method, intensity, res, tempFiles) => {
    return new Promise((resolve, reject) => {
      const archive = archiver('zip', {
        zlib: { level: 9 }
      });
      
      const zipFileName = `corrupted_files_${Date.now()}.zip`;
      
      // Set response headers for ZIP download
      res.set({
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipFileName}"`,
        'X-Corruption-Method': method,
        'X-Corruption-Intensity': intensity.toString(),
        'X-Content-Type': 'application/zip',
        'X-Successful-Count': results.filter(r => r.success).length.toString(),
        'X-Failed-Count': results.filter(r => !r.success).length.toString(),
        'X-Total-Files': results.length.toString(),
        'X-Warning': 'FILES ARE COMPLETELY UNUSABLE - DO NOT ATTEMPT TO OPEN'
      });
      
      // Pipe archive to response
      archive.pipe(res);
      
      // Add successful files to archive
      let addedCount = 0;
      const successfulResults = results.filter(r => r.success);
      
      successfulResults.forEach(result => {
        if (result.success && result.buffer) {
          const originalFilename = result.fileName;
          const extension = path.extname(originalFilename);
          const baseName = path.basename(originalFilename, extension);
          const corruptedFilename = `CORRUPTED_${baseName}${extension}`;
          
          archive.append(result.buffer, { name: corruptedFilename });
          addedCount++;
        }
      });
      
      if (addedCount === 0) {
        reject(new Error('No successful corruptions to add to ZIP'));
        return;
      }
      
      // Add a summary file
      const summary = {
        corruptionMethod: method,
        intensity: intensity,
        totalFiles: results.length,
        successful: successfulResults.length,
        failed: results.filter(r => !r.success).length,
        files: successfulResults.map(r => ({
          originalName: r.fileName,
          originalSize: r.originalSize,
          corruptedSize: r.corruptedSize,
          reduction: ((1 - r.corruptedSize / r.originalSize) * 100).toFixed(2) + '%'
        })),
        timestamp: new Date().toISOString(),
        warning: 'These files are intentionally corrupted and may be completely unusable.'
      };
      
      archive.append(JSON.stringify(summary, null, 2), { name: 'corruption_summary.json' });
      
      archive.on('error', (err) => {
        reject(err);
      });
      
      archive.on('end', () => {
        // Cleanup temp files after response is sent
        res.on('finish', () => {
          setTimeout(() => {
            this.cleanupTempFiles(tempFiles);
          }, 2000);
        });
        resolve();
      });
      
      // Finalize the archive
      archive.finalize();
    });
  }

  // Helper function to clean up temp files
  cleanupTempFiles = (filePaths) => {
    filePaths.forEach(filePath => {
      try {
        if (filePath && fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Cleaned up: ${filePath}`);
        }
      } catch (err) {
        console.warn(`Could not delete ${filePath}:`, err.message);
      }
    });
  }

  // Original corruption methods remain the same
  extremeHeaderCorruption = (buffer, intensity) => {
    const corrupted = Buffer.from(buffer);
    const destroySize = Math.max(1024, Math.floor(buffer.length * 0.2));
    for (let i = 0; i < destroySize; i++) {
      corrupted[i] = crypto.randomBytes(1)[0];
    }
    
    const middleStart = Math.floor(buffer.length / 3);
    const middleEnd = middleStart + Math.floor(buffer.length / 4);
    for (let i = middleStart; i < middleEnd; i++) {
      corrupted[i] = 0xFF;
    }
    
    const endStart = Math.max(0, buffer.length - 512);
    for (let i = endStart; i < buffer.length; i++) {
      corrupted[i] = 0x00;
    }
    
    return corrupted;
  }

  extremeRandomCorruption = (buffer, intensity) => {
    const corrupted = Buffer.from(buffer);
    const destructionPercent = 0.7 + (intensity / 100) * 0.3;
    const bytesToDestroy = Math.floor(buffer.length * destructionPercent);
    
    for (let i = 0; i < bytesToDestroy; i++) {
      const pos = Math.floor(Math.random() * buffer.length);
      corrupted[pos] = crypto.randomBytes(1)[0];
    }
    
    return corrupted;
  }

  extremeTruncateCorruption = (buffer, intensity) => {
    const keepPercent = Math.max(0.01, 0.1 - (intensity / 100) * 0.09);
    const newSize = Math.floor(buffer.length * keepPercent);
    
    if (newSize <= 10) {
      return Buffer.from('CORRUPTED_FILE_DO_NOT_OPEN');
    }
    return buffer.slice(0, newSize);
  }

  extremeXORCorruption = (buffer, intensity) => {
    const corrupted = Buffer.from(buffer);
    
    for (let i = 0; i < buffer.length; i++) {
      if (i % 2 === 0) {
        corrupted[i] = corrupted[i] ^ 0xAA;
      } else {
        corrupted[i] = corrupted[i] ^ 0x55;
      }
    }
    
    const xorKey = crypto.randomBytes(32);
    for (let i = 0; i < buffer.length; i++) {
      corrupted[i] = corrupted[i] ^ xorKey[i % 32];
    }
    
    return corrupted;
  }

  completeDestruction = (buffer, intensity) => {
    const destroyedSize = buffer.length;
    const destroyed = crypto.randomBytes(destroyedSize);
    const magic = Buffer.from('CORRUPTED!DO NOT OPEN!');
    magic.copy(destroyed, 0);
    
    return destroyed;
  }

  formatSpecificDestruction = (buffer, filename) => {
    const corrupted = Buffer.from(buffer);
    const extension = path.extname(filename).toLowerCase();
    
    switch (extension) {
      case '.pdf':
        if (buffer.length >= 5) {
          corrupted[0] = 0x00; corrupted[1] = 0x00; corrupted[2] = 0x00; 
          corrupted[3] = 0x00; corrupted[4] = 0x00;
        }
        const xrefPos = buffer.lastIndexOf(Buffer.from('xref'));
        if (xrefPos !== -1) {
          for (let i = 0; i < 100; i++) {
            corrupted[xrefPos + i] = 0xFF;
          }
        }
        break;
        
      case '.docx':
      case '.xlsx':
      case '.pptx':
        if (buffer.length >= 4) {
          corrupted[0] = 0xFF; corrupted[1] = 0xFF; 
          corrupted[2] = 0xFF; corrupted[3] = 0xFF;
        }
        break;
        
      case '.jpg':
      case '.jpeg':
        if (buffer.length >= 2) {
          corrupted[0] = 0x00; corrupted[1] = 0x00;
        }
        break;
        
      case '.png':
        if (buffer.length >= 8) {
          for (let i = 0; i < 8; i++) corrupted[i] = 0x00;
        }
        break;
        
      case '.mp3':
        if (buffer.length >= 10) {
          for (let i = 0; i < 10; i++) corrupted[i] = 0x00;
        }
        break;
        
      case '.zip':
      case '.rar':
        if (buffer.length >= 100) {
          for (let i = 0; i < 100; i++) corrupted[i] = crypto.randomBytes(1)[0];
        }
        break;
    }
    
    const destroyStart = Math.floor(buffer.length * 0.1);
    const destroyEnd = Math.floor(buffer.length * 0.9);
    for (let i = 0; i < destroyStart; i++) {
      corrupted[i] = crypto.randomBytes(1)[0];
    }
    for (let i = destroyEnd; i < buffer.length; i++) {
      corrupted[i] = crypto.randomBytes(1)[0];
    }
    
    return corrupted;
  }
}

module.exports = new FileCorruptorController();