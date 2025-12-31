<script setup>
import { ref, computed } from 'vue'

const file = ref(null)
const loading = ref(false)
const progress = ref(0)
const statusText = ref('')
const showStats = ref(false)
const showErrorPopup = ref(false)
const errorMessage = ref('')
const compressionStats = ref({
  originalSize: 0,
  compressedSize: 0,
  reductionPercent: 0,
  compressionRatio: 0,
  timeTaken: 0
})
const uploadTime = ref(null)
const conversionStartTime = ref(null)

// Check if filename contains problematic characters for GhostScript
const hasProblematicCharacters = (filename) => {
  const problematicPatterns = [
    /\(.*\)/,       
    /\[.*\]/,        
    /\{.*\}/,        
    /<.*>/,         
    /\?/,           
    /\*/,            
    /\|/,            
    /&/,            
    /;/,             
    /`/,             
    /\$/,            
    /#/,            
    /%/,             
    /\\/,           
    /"/,            
    /'/,            
    /~/,            
    /!/             
  ]
  
  return problematicPatterns.some(pattern => pattern.test(filename))
}

const getProblematicChars = (filename) => {
  const problematic = []
  const chars = filename.split('')
  
  chars.forEach(char => {
    if ('()[]{}<>?*|&;`$#%\\"\''.includes(char)) {
      if (!problematic.includes(char)) {
        problematic.push(char)
      }
    }
  })
  
  return problematic.join(', ')
}

// Computed properties
const formattedFileSize = computed(() => {
  if (!file.value) return ''
  return formatBytes(file.value.size)
})

const estimatedTime = computed(() => {
  if (!file.value) return 'Select a file'
  const sizeMB = file.value.size / (1024 * 1024)
  if (sizeMB < 1) return '~5-10 seconds'
  if (sizeMB < 5) return '~10-20 seconds'
  if (sizeMB < 20) return '~20-40 seconds'
  if (sizeMB < 50) return '~40-60 seconds'
  return '~1-2 minutes'
})

const isProblematicFile = computed(() => {
  return file.value ? hasProblematicCharacters(file.value.name) : false
})

// Helper functions
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const selectFile = (e) => {
  const selectedFile = e.target.files[0]
  if (selectedFile) {
    if (selectedFile.type !== 'application/pdf') {
      showError('Please select a PDF file')
      return
    }
    
    // Check for problematic filename
    if (hasProblematicCharacters(selectedFile.name)) {
      const problemChars = getProblematicChars(selectedFile.name)
      showError(
        `Filename contains special characters that may cause issues: ${problemChars}<br><br>` +
        `Please rename the file to remove these characters before uploading.`
      )
      return
    }
    
    file.value = selectedFile
    uploadTime.value = new Date()
    statusText.value = `File selected: ${selectedFile.name}`
  }
}

const getCompressionQuality = (percent) => {
  if (percent > 70) return 'Excellent'
  if (percent > 50) return 'Very Good'
  if (percent > 30) return 'Good'
  if (percent > 10) return 'Moderate'
  return 'Minimal'
}

const showError = (message) => {
  errorMessage.value = message
  showErrorPopup.value = true
  
  // Reset file input
  file.value = null
  const input = document.querySelector('input[type="file"]')
  if (input) input.value = ''
}

const closeError = () => {
  showErrorPopup.value = false
  errorMessage.value = ''
}

const compressPdf = async () => {
  if (!file.value) {
    showError('Please select a PDF file')
    return
  }

  // Double-check filename before processing
  if (hasProblematicCharacters(file.value.name)) {
    const problemChars = getProblematicChars(file.value.name)
    showError(
      `Cannot compress file with special characters: ${problemChars}<br><br>` +
      `Please rename the file and try again.`
    )
    return
  }

  loading.value = true
  progress.value = 0
  statusText.value = 'Initializing compression...'
  showStats.value = false
  conversionStartTime.value = Date.now()

  const formData = new FormData()
  formData.append('pdf', file.value)

  try {
    // Progress simulation stages
    const progressStages = [
      { stage: 'Uploading file to server...', progress: 10, time: 500 },
      { stage: 'Analyzing PDF structure...', progress: 20, time: 800 },
      { stage: 'Optimizing images...', progress: 40, time: 1200 },
      { stage: 'Compressing fonts...', progress: 60, time: 800 },
      { stage: 'Rebuilding PDF...', progress: 80, time: 1000 },
      { stage: 'Finalizing compression...', progress: 95, time: 500 }
    ]

    let currentStage = 0

    // Start progress simulation
    const updateProgress = () => {
      if (currentStage < progressStages.length) {
        const stage = progressStages[currentStage]
        statusText.value = stage.stage
        progress.value = stage.progress
        
        // Move to next stage after delay
        setTimeout(() => {
          currentStage++
          if (currentStage < progressStages.length) {
            updateProgress()
          }
        }, stage.time)
      }
    }

    updateProgress()

    // Make API call
    const res = await fetch('http://192.168.18.101:3000/api/compress-pdf', {
      method: 'POST',
      body: formData
    })

    // Handle API errors
    if (!res.ok) {
      let errorMsg = 'Compression failed'
      try {
        const errorData = await res.json()
        errorMsg = errorData.message || errorMsg
      } catch {
        errorMsg = `Server error: ${res.status}`
      }
      
      // Check if it's a GhostScript filename error
      if (errorMsg.toLowerCase().includes('filename') || 
          errorMsg.toLowerCase().includes('parentheses') ||
          errorMsg.toLowerCase().includes('special characters')) {
        showError(
          `GhostScript cannot process files with special characters.<br><br>` +
          `Please rename "${file.value.name}" to remove parentheses, brackets, or other special symbols.`
        )
      } else {
        throw new Error(errorMsg)
      }
      return
    }

    // Get stats from headers
    const originalSize = Number(res.headers.get('X-Original-Size')) || file.value.size
    const compressedSize = Number(res.headers.get('X-Compressed-Size'))
    const reductionPercent = res.headers.get('X-Reduction-Percent') || '0'
    const compressionRatio = res.headers.get('X-Compression-Ratio') || '1.0'
    
    const endTime = Date.now()
    const timeTaken = ((endTime - conversionStartTime.value) / 1000).toFixed(1)

    // Calculate reduction if not provided
    let calculatedPercent = parseFloat(reductionPercent)
    if (calculatedPercent === 0 && originalSize > 0 && compressedSize > 0) {
      calculatedPercent = ((1 - compressedSize / originalSize) * 100).toFixed(2)
    }

    // Store stats
    compressionStats.value = {
      fileName: file.value.name,
      originalSize,
      compressedSize,
      reductionPercent: calculatedPercent,
      compressionRatio: parseFloat(compressionRatio).toFixed(2),
      timeTaken: `${timeTaken} seconds`,
      quality: getCompressionQuality(calculatedPercent),
      timestamp: new Date().toLocaleTimeString()
    }

    progress.value = 100
    statusText.value = 'Compression complete! Downloading...'

    // Get blob and download
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `compressed_${file.value.name}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    // Show success popup
    setTimeout(() => {
      showStats.value = true
    }, 800)

    // Reset progress
    setTimeout(() => {
      progress.value = 0
      statusText.value = ''
    }, 2000)

  } catch (err) {
    console.error('Compression error:', err)
    statusText.value = `Error: ${err.message}`
    
    // Check for GhostScript specific errors
    if (err.message.includes('undefinedfilename') || 
        err.message.includes('parentheses') ||
        err.message.includes('GhostScript')) {
      showError(
        `GhostScript cannot process this filename.<br><br>` +
        `The file "${file.value.name}" contains special characters that GhostScript cannot handle.<br>` +
        `Please rename the file to use only letters, numbers, dots, dashes, and underscores.`
      )
    } else {
      showError(`Compression failed: ${err.message}`)
    }
  } finally {
    loading.value = false
  }
}

const closeStats = () => {
  showStats.value = false
  // Reset file
  file.value = null
  const input = document.querySelector('input[type="file"]')
  if (input) input.value = ''
}
</script>

<template>
  <div class="converter">
    <h2>🗜️ PDF Compressor</h2>
    <p class="subtitle">Reduce PDF file size while maintaining quality</p>

    <!-- File Warning (if problematic) -->
    <div v-if="file && isProblematicFile" class="file-warning">
      <div class="warning-icon">⚠️</div>
      <div class="warning-content">
        <strong>Filename Issue Detected</strong>
        <p>This file contains special characters ({{ getProblematicChars(file.name) }}) that may cause compression issues.</p>
        <small>Consider renaming the file before compression.</small>
      </div>
    </div>

    <!-- File Info Card -->
    <div v-if="file && !isProblematicFile" class="file-info-card">
      <div class="file-header">
        <span class="file-icon">📄</span>
        <div class="file-details">
          <strong>{{ file.name }}</strong>
          <small>{{ formattedFileSize }} • {{ estimatedTime }}</small>
        </div>
        <button v-if="!loading" @click="file = null" class="remove-btn">✕</button>
      </div>
      <div class="file-stats">
        <span class="stat">
          <span class="stat-label">Size:</span>
          <span class="stat-value">{{ formattedFileSize }}</span>
        </span>
        <span class="stat">
          <span class="stat-label">Est. Time:</span>
          <span class="stat-value">{{ estimatedTime }}</span>
        </span>
        <span class="stat">
          <span class="stat-label">Status:</span>
          <span class="stat-value" style="color: #28a745;">Ready to compress</span>
        </span>
      </div>
    </div>

    <!-- Upload Area -->
    <label v-if="!file" class="upload-box" @dragover.prevent @drop.prevent="selectFile">
      <input
        type="file"
        accept="application/pdf"
        @change="selectFile"
        hidden
      />
      <div class="upload-content">
        <span class="icon">🗜️</span>
        <p><strong>Click to upload</strong> or drag & drop PDF</p>
        <small>Max file size: 50MB </small><br>
        <small>Avoid special characters in filenames</small>
        <div class="filename-tips">
          <small> Avoid: (), [], {}, &, ?, *, spaces, etc.</small>
        </div>
      </div>
    </label>

    <!-- Compress Button -->
    <button 
      class="compress-btn" 
      @click="compressPdf" 
      :disabled="loading || !file || isProblematicFile"
      :class="{ 
        'loading': loading, 
        'disabled': !file || isProblematicFile,
        'warning': isProblematicFile
      }"
    >
      <span v-if="!loading">
        <span v-if="isProblematicFile">⚠️ Rename File First</span>
        <span v-else>Compress PDF</span>
      </span>
      <span v-else>
        <span class="spinner"></span> Compressing...
      </span>
    </button>

    <!-- Progress Section -->
    <div v-if="loading" class="progress-section">
      <div class="progress-header">
        <span>Compression Progress</span>
        <span class="time-estimate">{{ estimatedTime }}</span>
      </div>
      
      <div class="progress-container">
        <div class="progress-bar" :style="{ width: progress + '%' }">
          <span class="progress-text">{{ Math.round(progress) }}%</span>
        </div>
      </div>
      
      <p class="status-text">{{ statusText }}</p>
      
      <div class="progress-stats">
        <span class="stat">Quality: {{ compressionStats.quality || 'Calculating...' }}</span>
        <span class="stat">Stage: {{ Math.floor(progress / 20) + 1 }}/6</span>
      </div>
    </div>

    <!-- Success Popup -->
    <div v-if="showStats" class="popup-overlay" @click.self="closeStats">
      <div class="success-popup">
        <div class="popup-header">
          <span class="success-icon"></span>
          <h3>Compression Successful !!</h3>
          <button class="close-popup" @click="closeStats">✕</button>
        </div>
        
        <div class="popup-content" v-if="compressionStats">
          <div class="stats-summary">
            <div class="summary-item">
              <div class="summary-label">File Name</div>
              <div class="summary-value">{{ compressionStats.fileName }}</div>
            </div>
            
            <div class="size-comparison" v-if="compressionStats.originalSize > 0 && compressionStats.compressedSize > 0">
              <div class="size-bar original">
                <span class="size-label">Original</span>
                <span class="size-value">{{ formatBytes(compressionStats.originalSize) }}</span>
              </div>
              <div class="size-bar compressed" 
                   :style="{ width: Math.max(20, (100 - compressionStats.reductionPercent)) + '%' }">
                <span class="size-label">Compressed</span>
                <span class="size-value">{{ formatBytes(compressionStats.compressedSize) }}</span>
              </div>
              <div class="size-reduction">
                <span class="reduction-label">Reduction:</span>
                <span class="reduction-value">{{ compressionStats.reductionPercent }}%</span>
              </div>
            </div>
            
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-label">Time Taken</div>
                <div class="stat-value">{{ compressionStats.timeTaken }}</div>
              </div>
              <div class="stat-item highlight">
                <div class="stat-label">Quality</div>
                <div class="stat-value">{{ compressionStats.quality }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">Compression Ratio</div>
                <div class="stat-value">1:{{ compressionStats.compressionRatio }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">Completed</div>
                <div class="stat-value">{{ compressionStats.timestamp }}</div>
              </div>
            </div>
          </div>
          
          <div class="popup-actions">
            <button class="btn-primary" @click="closeStats">Compress Another</button>
            <button class="btn-secondary" @click="closeStats">Close</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Error Popup -->
    <div v-if="showErrorPopup" class="popup-overlay" @click.self="closeError">
      <div class="error-popup">
        <div class="popup-header error">
          <span class="error-icon">❌</span>
          <h3>File Name Issue</h3>
          <button class="close-popup" @click="closeError">✕</button>
        </div>
        
        <div class="popup-content">
          <div class="error-content" v-html="errorMessage"></div>
          
          <div class="filename-guidelines">
            <h4>Filename Guidelines:</h4>
            <div class="guidelines-list">
              <div class="guideline allowed">
                <span class="guideline-icon">✅</span>
                <span class="guideline-text"><strong>Allowed:</strong> my-document.pdf, report_2024.pdf, file123.pdf</span>
              </div>
              <div class="guideline not-allowed">
                <span class="guideline-icon">❌</span>
                <span class="guideline-text"><strong>Not Allowed:</strong> file (1).pdf, document[2].pdf, report&summary.pdf</span>
              </div>
            </div>
          </div>
          
          <div class="popup-actions">
            <button class="btn-primary" @click="closeError">OK, I'll Rename</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.converter {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
}

.converter h2 {
  font-size: 24px;
  margin-bottom: 8px;
  color: #2c3e50;
}

.subtitle {
  font-size: 14px;
  color: #666;
  margin-bottom: 25px;
}

.file-info-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}

.file-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.file-icon {
  font-size: 24px;
}

.file-details {
  flex: 1;
  text-align: left;
}

.file-details strong {
  display: block;
  font-size: 14px;
  margin-bottom: 2px;
}

.file-details small {
  font-size: 12px;
  opacity: 0.9;
}

.remove-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.file-stats {
  display: flex;
  gap: 20px;
  font-size: 13px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.stat {
  display: flex;
  gap: 6px;
}

.stat-label {
  opacity: 0.9;
}

/* Upload Box */
.upload-box {
  display: block;
  border: 2px dashed #aaa;
  border-radius: 12px;
  padding: 40px 20px;
  cursor: pointer;
  background: #f9f9f9;
  transition: all 0.3s ease;
  margin-bottom: 20px;
}

.upload-box:hover {
  border-color: #667eea;
  background: #f0f4ff;
}

.upload-content .icon {
  font-size: 40px;
  display: block;
  margin-bottom: 12px;
}

.upload-content p {
  margin: 8px 0;
  font-size: 16px;
  color: #2c3e50;
}

.upload-content small {
  color: #6c757d;
  font-size: 13px;
}

/* Compress Button */
.compress-btn {
  width: 100%;
  padding: 16px;
  font-size: 16px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
  transition: all 0.3s ease;
  margin-top: 10px;
}

.compress-btn:hover:not(:disabled):not(.disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.compress-btn:disabled, .compress-btn.disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

.compress-btn.loading {
  background: #6c757d;
}

.spinner {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255,255,255,.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s ease-in-out infinite;
  margin-right: 8px;
  vertical-align: middle;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Progress Section */
.progress-section {
  margin-top: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  font-size: 14px;
  color: #2c3e50;
}

.time-estimate {
  background: #e9ecef;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  color: #495057;
}

.progress-container {
  height: 12px;
  width: 100%;
  background: #e9ecef;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  transition: width 0.3s ease;
  position: relative;
}

.progress-text {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 10px;
  color: white;
  font-weight: bold;
  text-shadow: 1px 1px 1px rgba(0,0,0,0.2);
}

.status-text {
  margin-top: 12px;
  font-size: 14px;
  color: #495057;
  min-height: 20px;
}

.progress-stats {
  display: flex;
  justify-content: space-between;
  margin-top: 15px;
  font-size: 12px;
  color: #6c757d;
}

/* Success Popup */
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(3px);
}

.success-popup {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  animation: popupIn 0.3s ease-out;
}

@keyframes popupIn {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.popup-header {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.popup-header h3 {
  margin: 0;
  flex: 1;
  text-align: center;
  font-size: 18px;
}

.success-icon {
  font-size: 24px;
}

.close-popup {
  background: rgba(255,255,255,0.2);
  border: none;
  color: white;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-popup:hover {
  background: rgba(255,255,255,0.3);
}

.popup-content {
  padding: 24px;
}

.stats-summary {
  margin-bottom: 24px;
}

.summary-item {
  margin-bottom: 20px;
}

.summary-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.summary-value {
  font-size: 14px;
  color: #2c3e50;
  font-weight: 500;
  word-break: break-all;
}

.size-comparison {
  margin: 25px 0;
  position: relative;
}

.size-bar {
  height: 35px;
  border-radius: 8px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 15px;
  color: white;
  font-weight: 600;
  font-size: 13px;
  transition: width 0.8s ease;
}

.size-bar.original {
  background: linear-gradient(90deg, #6c757d, #495057);
  width: 100%;
}

.size-bar.compressed {
  background: linear-gradient(90deg, #28a745, #20c997);
  position: absolute;
  top: 0;
  left: 0;
  min-width: 80px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 25px;
}

.stat-item {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 10px;
  text-align: center;
}

.stat-item.highlight {
  background: linear-gradient(135deg, #e8f5e9, #d4edda);
  border: 2px solid #28a745;
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
  font-weight: 500;
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  color: #2c3e50;
}

.popup-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.btn-primary, .btn-secondary {
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  opacity: 0.9;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

</style>