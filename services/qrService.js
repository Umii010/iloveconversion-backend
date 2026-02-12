const crypto = require('crypto');
const QRCode = require('qrcode');

class QRService {
  constructor() {
    // Use a Map for token storage
    this.qrCodes = new Map();
    
    // Start cleanup interval
    this.cleanupInterval = setInterval(() => this.cleanupExpired(), 30000); // Cleanup every 30 seconds
    
    console.log('QRService initialized - Singleton instance created');
    
    // Add global reference for debugging (remove in production)
    if (!global.qrServiceDebug) {
      global.qrServiceDebug = this;
    }
  }

  generateDownloadToken(fileBuffer, fileName, userEmail = null) {
    try {
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = Date.now() + (10 * 60 * 1000); // 10 minutes
      
      console.log(`\n=== QRService.generateDownloadToken() ===`);
      console.log(`Token (full): ${token}`);
      console.log(`Token (short): ${token.substring(0, 10)}...`);
      console.log(`Created: ${new Date().toISOString()}`);
      console.log(`Expires: ${new Date(expiresAt).toISOString()}`);
      console.log(`File: ${fileName} (${fileBuffer.length} bytes)`);
      console.log(`Memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
      
      // Store file in memory
      const fileData = {
        buffer: fileBuffer,
        fileName: fileName,
        expiresAt: expiresAt,
        userEmail: userEmail,
        downloadCount: 0,
        maxDownloads: 3, // Allow 3 downloads for safety (QR, direct, retry)
        createdAt: Date.now(),
        lastAccessed: Date.now()
      };

      // Store the token
      this.qrCodes.set(token, fileData);
      
      console.log(`✅ Token stored!`);
      console.log(`Total tokens in memory: ${this.qrCodes.size}`);
      this.logAllTokens();
      
      return {
        token,
        expiresAt,
        downloadUrl: `/api/download/${token}`
      };
    } catch (error) {
      console.error('Error generating download token:', error);
      throw error;
    }
  }

  async generateQRCode(downloadUrl) {
    try {
      console.log(`\n=== Generating QR Code ===`);
      console.log(`URL: ${downloadUrl}`);
      
      const qrData = await QRCode.toDataURL(downloadUrl, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 300,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      console.log('QR code generated successfully');
      return qrData;
    } catch (error) {
      console.error('QR code generation error:', error);
      throw error;
    }
  }

  async getDownloadData(token) {
    console.log(`\n=== QRService.getDownloadData() ===`);
    console.log(`Token received: ${token}`);
    console.log(`Token length: ${token.length} chars`);
    
    // Log memory status
    this.logAllTokens();
    
    // Check if token exists
    const fileData = this.qrCodes.get(token);
    
    if (!fileData) {
      console.log(`❌ Token not found in memory!`);
      console.log(`Looking for: ${token}`);
      console.log(`Available tokens: ${Array.from(this.qrCodes.keys()).map(k => `${k.substring(0, 10)}...`).join(', ') || 'None'}`);
      
      // Check for any token that might match partially (debug)
      for (const [storedToken, data] of this.qrCodes.entries()) {
        if (storedToken.includes(token.substring(0, 20))) {
          console.log(`⚠️ Partial match found! Stored: ${storedToken.substring(0, 30)}...`);
        }
      }
      
      throw new Error('Download link has expired or is invalid');
    }

    console.log(`✅ Token found!`);
    console.log(`File: ${fileData.fileName}`);
    console.log(`Created: ${new Date(fileData.createdAt).toISOString()}`);
    console.log(`Expires: ${new Date(fileData.expiresAt).toISOString()}`);
    console.log(`Current time: ${new Date().toISOString()}`);
    console.log(`Time left: ${Math.round((fileData.expiresAt - Date.now()) / 1000)} seconds`);
    console.log(`Downloads: ${fileData.downloadCount}/${fileData.maxDownloads}`);
    
    // Update last accessed
    fileData.lastAccessed = Date.now();
    
    // Check expiration
    if (Date.now() > fileData.expiresAt) {
      console.log(`❌ Token expired!`);
      this.qrCodes.delete(token);
      throw new Error('Download link has expired');
    }

    // Check download limit
    if (fileData.downloadCount >= fileData.maxDownloads) {
      console.log(`❌ Download limit reached!`);
      this.qrCodes.delete(token);
      throw new Error('Download limit reached');
    }

    console.log(`✅ Token valid, proceeding with download...`);
    
    // Increment download count
    fileData.downloadCount++;
    console.log(`Updated download count: ${fileData.downloadCount}/${fileData.maxDownloads}`);
    
    // Remove after final download
    if (fileData.downloadCount >= fileData.maxDownloads) {
      console.log(`Removing token after final download`);
      this.qrCodes.delete(token);
    }

    return fileData;
  }

  getQRInfo(token) {
    console.log(`\n=== QRService.getQRInfo() ===`);
    console.log(`Token: ${token.substring(0, 20)}...`);
    
    const fileData = this.qrCodes.get(token);
    if (!fileData) {
      console.log(`Token not found`);
      return null;
    }

    const info = {
      fileName: fileData.fileName,
      expiresAt: fileData.expiresAt,
      expiresIn: Math.max(0, Math.floor((fileData.expiresAt - Date.now()) / 1000)),
      downloadCount: fileData.downloadCount,
      maxDownloads: fileData.maxDownloads,
      createdAt: fileData.createdAt,
      fileSize: fileData.buffer.length
    };
    
    console.log(`QR Info:`, info);
    return info;
  }

  // Helper method to log all tokens
  logAllTokens() {
    console.log(`\n=== QR Service Storage Status ===`);
    console.log(`Total tokens: ${this.qrCodes.size}`);
    console.log(`Instance ID: ${this.instanceId || 'no-id'}`);
    
    if (this.qrCodes.size === 0) {
      console.log(`No tokens in memory`);
      return;
    }
    
    let i = 1;
    for (const [token, data] of this.qrCodes.entries()) {
      console.log(`${i}. Token: ${token.substring(0, 10)}...`);
      console.log(`   File: ${data.fileName}`);
      console.log(`   Created: ${new Date(data.createdAt).toISOString()}`);
      console.log(`   Expires: ${new Date(data.expiresAt).toISOString()}`);
      console.log(`   Downloads: ${data.downloadCount}/${data.maxDownloads}`);
      console.log(`   Size: ${data.buffer.length} bytes`);
      i++;
    }
  }

  // Method to manually add a token for testing
  testAddToken() {
    const testBuffer = Buffer.from('Test PDF content');
    const token = this.generateDownloadToken(testBuffer, 'test.pdf', 'test@example.com');
    console.log(`Test token added: ${token.token.substring(0, 10)}...`);
    return token;
  }

  cleanupExpired() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [token, fileData] of this.qrCodes.entries()) {
      if (now > fileData.expiresAt) {
        this.qrCodes.delete(token);
        cleaned++;
        console.log(`Cleaned expired token: ${token.substring(0, 10)}...`);
      }
    }
    
    if (cleaned > 0) {
      console.log(`Cleaned up ${cleaned} expired tokens`);
    }
    
    // Log status periodically
    if (Math.random() < 0.1) { // 10% chance on each cleanup
      this.logAllTokens();
    }
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.qrCodes.clear();
    console.log('QRService destroyed');
  }
}

// Create and export singleton instance
const qrServiceInstance = new QRService();

// Add instance ID for debugging
qrServiceInstance.instanceId = `qr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
console.log(`QR Service Instance ID: ${qrServiceInstance.instanceId}`);

// Handle process exit
process.on('exit', () => {
  qrServiceInstance.destroy();
});

module.exports = qrServiceInstance;