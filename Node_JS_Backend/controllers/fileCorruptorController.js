const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class FileCorruptorController {
  handleCorruptFile = async (req, res) => {
    
    try {
      if (!req.file) {
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
      const corruptedFilename = `DESTROYED_${baseName}${extension}`;
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${corruptedFilename}"`);
      res.setHeader('X-Corruption-Method', method);
      res.setHeader('X-Corruption-Intensity', intensityValue);
      res.setHeader('X-Original-Size', originalBuffer.length);
      res.setHeader('X-Corrupted-Size', corruptedBuffer.length);
      res.setHeader('X-Warning', 'FILE IS COMPLETELY UNUSABLE - DO NOT ATTEMPT TO OPEN');
      await fs.unlink(filePath).catch(() => {});
      res.send(corruptedBuffer);

    } catch (error) {
      console.error('Corruption error:', error);
      res.status(500).json({ 
        error: 'Failed to destroy file',
        message: error.message 
      });
    }
  }
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
    console.log('Applying EXTREME random destruction');
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
          corrupted[0] = 0x00; corrupted[1] = 0x00; corrupted[2] = 0x00; corrupted[3] = 0x00; corrupted[4] = 0x00;
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
          corrupted[0] = 0xFF; corrupted[1] = 0xFF; corrupted[2] = 0xFF; corrupted[3] = 0xFF;
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