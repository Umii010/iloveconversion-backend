<script setup>
import { ref, computed } from 'vue'
function trackToolUsage(toolName, action, extraData = {}) {
  if (typeof gtag !== 'undefined') {
    gtag('event', 'tool_used', {
      'tool_name': toolName,
      'action': action,
      'event_category': 'Tools',
      'event_label': `${toolName} - ${action}`,
      ...extraData
    });
    console.log(`Tracked: ${toolName} - ${action}`);
  }
}
const file = ref(null)
const loading = ref(false)
const progress = ref(0)
const statusText = ref('')
const showSuccessPopup = ref(false)
const conversionStats = ref(null)
const uploadTime = ref(null)
const conversionStartTime = ref(null)

// Computed properties
const formattedFileSize = computed(() => {
  if (!file.value) return ''
  return formatBytes(file.value.size)
})

const estimatedTime = computed(() => {
  if (!file.value) return 'Select a file'
  const sizeMB = file.value.size / (1024 * 1024)
  const pageEstimate = Math.max(1, Math.floor(sizeMB * 5)) // Rough estimate
  
  if (pageEstimate < 5) return '~10-20 seconds'
  if (pageEstimate < 20) return '~20-40 seconds'
  if (pageEstimate < 50) return '~40-60 seconds'
  return '~1-2 minutes'
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
      alert('Please select a PDF file')
      return
    }
    file.value = selectedFile
    uploadTime.value = new Date()
    statusText.value = `File selected: ${selectedFile.name}`
    trackToolUsage('pdf_to_png', 'file_selected', {
      file_size: selectedFile.size,
      file_name: selectedFile.name
    });
  }
}

const pdfToPng = async () => {
  if (!file.value) {
    alert('Please select a PDF file')
    return
  }

  loading.value = true
  progress.value = 0
  statusText.value = 'Initializing conversion...'
  showSuccessPopup.value = false
  conversionStartTime.value = Date.now()

  const formData = new FormData()
  formData.append('file', file.value)

  try {
    // Progress simulation stages
    const progressStages = [
      { stage: 'Uploading PDF to server...', progress: 15, time: 800 },
      { stage: 'Analyzing document structure...', progress: 25, time: 600 },
      { stage: 'Preparing page rendering...', progress: 35, time: 700 },
      { stage: 'Converting pages to images...', progress: 60, time: 1500 },
      { stage: 'Optimizing PNG quality...', progress: 80, time: 1000 },
      { stage: 'Finalizing conversion...', progress: 95, time: 500 }
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
    const res = await fetch('http://192.168.18.101:3000/api/pdf-to-png', {
      method: 'POST',
      body: formData
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.message || 'Conversion failed')
    }

    // Get stats from headers
    const originalFileName = res.headers.get('X-Original-Filename') || file.value.name
    const pageCount = res.headers.get('X-Page-Count') || '1'
    const isZip = res.headers.get('X-Is-Zip') === 'true'
    const imageQuality = res.headers.get('X-Image-Quality') || '150 DPI'
    const totalSize = res.headers.get('X-Total-Size') || '0'
    
    const endTime = Date.now()
    const timeTaken = ((endTime - conversionStartTime.value) / 1000).toFixed(1)

    // Store stats for popup
    conversionStats.value = {
      fileName: originalFileName,
      pageCount: parseInt(pageCount),
      isZip,
      imageQuality,
      totalSize: formatBytes(parseInt(totalSize) || 0),
      timeTaken: `${timeTaken} seconds`,
      originalSize: formatBytes(file.value.size),
      timestamp: new Date().toLocaleTimeString()
    }

    progress.value = 100
    statusText.value = 'Conversion complete! Downloading...'
     trackToolUsage('pdf_to_png', 'convert', {
      file_size: file.value.size,
      page_count: parseInt(pageCount),
      is_zip: isZip,
      conversion_time: parseFloat(timeTaken),
      original_size: formatBytes(file.value.size),
      converted_size: formatBytes(parseInt(totalSize) || 0)
    });

    // Get blob and download
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)

    // Determine download name
    let downloadName = ''
    if (isZip) {
      downloadName = originalFileName.replace(/\.pdf$/i, '_images.zip')
    } else {
      downloadName = originalFileName.replace(/\.pdf$/i, '.png')
    }

    const a = document.createElement('a')
    a.href = url
    a.download = downloadName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    trackToolUsage('pdf_to_png', 'download', {
  download_name: downloadName,
  is_zip: isZip,
  page_count: parseInt(pageCount)
});

    // Show success popup
    setTimeout(() => {
      showSuccessPopup.value = true
    }, 800)

    // Reset progress
    setTimeout(() => {
      progress.value = 0
      statusText.value = ''
    }, 2000)

  } catch (err) {
    console.error('Conversion error:', err)
    statusText.value = `Error: ${err.message}`
    alert(`Conversion failed: ${err.message}`)
     trackToolUsage('pdf_to_png', 'error', {
      error_message: err.message,
      file_size: file.value?.size || 0
    });
  } finally {
    loading.value = false
  }
}

const closePopup = () => {
  showSuccessPopup.value = false
  // Reset file
  file.value = null
  const input = document.querySelector('input[type="file"]')
  if (input) input.value = ''
}
</script>

<template>
  <div class="converter">
    <h2>📄 PDF to PNG Converter</h2>
    <p class="subtitle">Convert PDF pages into high-quality PNG images</p>

    <!-- File Info Card -->
    <div v-if="file" class="file-info-card">
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
        <p><strong>Click to upload</strong> or drag & drop PDF</p>
        <small>Max file size: 50MB</small>
        <div class="conversion-info">
          <small> Converts each page to high-quality PNG</small><br>
          <small>Multiple pages = ZIP download</small>
        </div>
      </div>
    </label>

    <!-- Convert Button -->
    <button 
      class="convert-btn" 
      @click="pdfToPng" 
      :disabled="loading || !file"
      :class="{ 'loading': loading, 'disabled': !file }"
    >
      <span v-if="!loading">
        Convert to PNG
      </span>
      <span v-else>
        <span class="spinner"></span> Converting...
      </span>
    </button>

    <!-- Progress Section -->
    <div v-if="loading" class="progress-section">
      <div class="progress-header">
        <span>Conversion Progress</span>
        <span class="time-estimate">{{ estimatedTime }}</span>
      </div>
      
      <div class="progress-container">
        <div class="progress-bar" :style="{ width: progress + '%' }">
          <span class="progress-text">{{ Math.round(progress) }}%</span>
        </div>
      </div>
      
      <p class="status-text">{{ statusText }}</p>
      
      <div class="progress-stats">
        <span class="stat">Quality: 150 DPI (High)</span>
        <span class="stat">Stage: {{ Math.floor(progress / 20) + 1 }}/6</span>
      </div>
    </div>

    <!-- Success Popup -->
    <div v-if="showSuccessPopup" class="popup-overlay" @click.self="closePopup">
      <div class="success-popup">
        <div class="popup-header">
          <h3>Conversion Successful !</h3>
          <button class="close-popup" @click="closePopup">✕</button>
        </div>
        
        <div class="popup-content" v-if="conversionStats">
          <div class="stats-summary">
            <div class="summary-item">
              <div class="summary-label">Original File</div>
              <div class="summary-value">{{ conversionStats.fileName }}</div>
            </div>
            
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-label">Image Quality</div>
                <div class="stat-value">{{ conversionStats.imageQuality }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">Original Size</div>
                <div class="stat-value">{{ conversionStats.originalSize }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">Time Taken</div>
                <div class="stat-value">{{ conversionStats.timeTaken }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">Completed</div>
                <div class="stat-value">{{ conversionStats.timestamp }}</div>
              </div>
            </div>
          </div>
          
          <div class="popup-actions">
            <button class="btn-primary" @click="closePopup">Convert Another</button>
            <button class="btn-secondary" @click="closePopup">Close</button>
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
  padding: 10px;
}

.converter h2 {
  font-size: 24px;
  margin: 0;
  color: #2c3e50;
}

.subtitle {
  font-size: 14px;
  color: #666;
}

.file-info-card {
  background: #ee6c4d;
  color: white;
  border-radius: 12px;
  padding: 8px;
}

.file-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
}

.file-icon {
  font-size: 20px;
}

.file-details {
  flex: 1;
  text-align: left;
}

.file-details strong {
  display: block;
  font-size: 14px;
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
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.stat {
  display: flex;
  gap: 6px;
}

.stat-label {
  opacity: 0.9;
}

.upload-box {
  display: block;
  text-align: center;
  border: 2px dashed #aaa;
  border-radius: 12px;
  padding: 10px 5px;
  cursor: pointer;
  background: #f9f9f9;
  transition: all 0.3s ease;
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

.conversion-info {
  padding: 8px;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 11px;
  color: #666;
}

.convert-btn {
  width: 100%;
  padding: 10px;
  font-size: 16px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  background: #ee6c4d;
  color: white;
  transition: all 0.3s ease;
  margin-top: 5px;
}

.convert-btn:disabled, .convert-btn.disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

.convert-btn.loading {
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
  margin-top: 10px;
  padding: 7px;
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
  background: green;
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
     font-size: 14px;
    color: #495057;
    margin: 3px;
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

.conversion-type {
  margin: 20px 0;
  text-align: center;
}

.type-indicator {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  border-radius: 25px;
  font-weight: 600;
  font-size: 14px;
}

.type-indicator.single {
  background: linear-gradient(135deg, #e8f5e9, #d4edda);
  color: #155724;
  border: 2px solid #28a745;
}

.type-indicator.multi {
  background: linear-gradient(135deg, #e3f2fd, #bbdefb);
  color: #0d47a1;
  border: 2px solid #2196f3;
}

.type-icon {
  font-size: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin: 25px 0;
}

.stat-item {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 10px;
  text-align: center;
}

.stat-label {
  font-size: 12px;
  color: white;
  margin-bottom: 8px;
  font-weight: 500;
}

.stat-value {
  font-size: 12px;
  font-weight: 700;
  color: white;
}

.download-info {
  background: #e8f5e9;
  padding: 15px;
  border-radius: 10px;
  margin-top: 20px;
  text-align: center;
}

.download-info p {
  margin: 0 0 8px 0;
  color: #155724;
  font-size: 14px;
}

.download-info small {
  color: #666;
  font-size: 12px;
  display: block;
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