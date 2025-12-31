<script setup>
import { ref, computed } from 'vue'

const file = ref(null)
const loading = ref(false)
const progress = ref(0)
const statusText = ref('')
const showSuccessPopup = ref(false)
const conversionStats = ref(null)
const uploadTime = ref(null)
const fileSize = ref(null)

// Computed for formatted file size
const formattedFileSize = computed(() => {
  if (!fileSize.value) return ''
  const size = fileSize.value
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
})

const selectFile = (e) => {
  const selectedFile = e.target.files[0]
  if (selectedFile) {
    file.value = selectedFile
    fileSize.value = selectedFile.size
    uploadTime.value = new Date()
    statusText.value = `File selected: ${selectedFile.name} (${formattedFileSize.value})`
  }
}

const pdfToWord = async () => {
  if (!file.value) {
    alert('Please select a PDF file')
    return
  }

  loading.value = true
  progress.value = 0
  statusText.value = 'Preparing conversion...'
  const startTime = Date.now()

  const formData = new FormData()
  formData.append('file', file.value)

  try {
    // Update progress in stages
    const progressStages = [
      { stage: 'Uploading to server...', progress: 10 },
      { stage: 'Processing PDF...', progress: 30 },
      { stage: 'Extracting text...', progress: 50 },
      { stage: 'Creating Word document...', progress: 75 },
      { stage: 'Finalizing...', progress: 90 }
    ]

    let currentStage = 0
    const progressInterval = setInterval(() => {
      if (currentStage < progressStages.length) {
        statusText.value = progressStages[currentStage].stage
        progress.value = progressStages[currentStage].progress
        currentStage++
      }
    }, 800)

    const res = await fetch('http://192.168.18.101:3000/api/pdf-to-word', {
      method: 'POST',
      body: formData
    })

    clearInterval(progressInterval)
    progress.value = 100

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.message || 'Conversion failed')
    }

    // Get stats from API
    const originalSize = res.headers.get('X-Original-Size')
    const convertedSize = res.headers.get('X-Converted-Size')
    const apiFileName = res.headers.get('X-Original-Filename')
    const pageCount = res.headers.get('X-Page-Count') || 'Unknown'
    
    const endTime = Date.now()
    const timeTaken = ((endTime - startTime) / 1000).toFixed(1)

    // Store stats for popup
    conversionStats.value = {
      fileName: apiFileName || file.value.name.replace(/\.pdf$/i, '.docx'),
      originalSize: originalSize ? formatBytes(originalSize) : formattedFileSize.value,
      convertedSize: convertedSize ? formatBytes(convertedSize) : 'Calculating...',
      pageCount,
      timeTaken: `${timeTaken} seconds`,
      timestamp: new Date().toLocaleTimeString()
    }

    statusText.value = 'Conversion complete! Downloading...'

    const blob = await res.blob()
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = conversionStats.value.fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    // Show success popup
    showSuccessPopup.value = true

    // Reset after 3 seconds
    setTimeout(() => {
      progress.value = 0
      statusText.value = ''
      // Don't reset file here - let user see stats
    }, 1000)

  } catch (err) {
    console.error(err)
    statusText.value = `Error: ${err.message}`
    alert(`Conversion failed: ${err.message}`)
  } finally {
    loading.value = false
  }
}

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const closePopup = () => {
  showSuccessPopup.value = false
  // Reset file input
  file.value = null
  fileSize.value = null
  const input = document.querySelector('input[type="file"]')
  if (input) input.value = ''
}

const getTimeEstimate = (size) => {
  if (!size) return 'Estimating...'
  const mb = size / (1024 * 1024)
  if (mb < 1) return '~5-10 seconds'
  if (mb < 5) return '~10-20 seconds'
  if (mb < 20) return '~20-40 seconds'
  return '~40+ seconds'
}
</script>

<template>
  <div class="converter">
    <h2>📄 PDF to Word Converter</h2>
    <p class="subtitle">Convert PDF files into editable Word documents</p>

    <div class="file-info" v-if="file">
      <div class="file-details">
        <span class="file-icon">📄</span>
        <div class="file-text">
          <strong>{{ file.name }}</strong>
          <small>{{ formattedFileSize }} • {{ getTimeEstimate(file.size) }}</small>
        </div>
        <button v-if="!loading" @click="file = null; fileSize = null" class="remove-btn">✕</button>
      </div>
    </div>

    <label class="upload-box" v-if="!file">
      <input
        type="file"
        accept="application/pdf"
        @change="selectFile"
        hidden
      />
      <div class="upload-content">
        <span class="icon">📄 ➡️ 📝</span>
        <p><strong>Click to upload PDF</strong></p>
        <small>Max file size: 50MB</small>
      </div>
    </label>

    <button 
      class="convert-btn" 
      @click="pdfToWord" 
      :disabled="loading || !file"
      :class="{ 'loading': loading }"
    >
      <span v-if="!loading">Convert to Word</span>
      <span v-else>
        <span class="spinner"></span> Converting...
      </span>
    </button>

    <!-- Progress Section -->
    <div v-if="loading" class="progress-section">
      <div class="progress-header">
        <span>Conversion Progress</span>
        <span class="time-estimate">{{ getTimeEstimate(fileSize) }}</span>
      </div>
      
      <div class="progress-wrapper">
        <div class="progress-bar" :style="{ width: progress + '%' }">
          <span class="progress-text">{{ progress }}%</span>
        </div>
      </div>
      
      <p class="status-text">{{ statusText }}</p>
    </div>

    <!-- Success Popup -->
    <div v-if="showSuccessPopup" class="popup-overlay" @click.self="closePopup">
      <div class="success-popup">
        <div class="popup-header">
          <span class="success-icon"></span>
          <h3>Conversion Successful !!</h3>
          <button class="close-popup" @click="closePopup">✕</button>
        </div>
        
        <div class="popup-content" v-if="conversionStats">
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">File:</span>
              <span class="stat-value">{{ conversionStats.fileName }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Original Size:</span>
              <span class="stat-value">{{ conversionStats.originalSize }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Time Taken:</span>
              <span class="stat-value">{{ conversionStats.timeTaken }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Completed:</span>
              <span class="stat-value">{{ conversionStats.timestamp }}</span>
            </div>
          </div>
          
          <div class="popup-actions">
            <button class="btn-primary" @click="closePopup">Convert Another File</button>
            <button class="btn-secondary" @click="closePopup">Close</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.converter {
  text-align: center;
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
  margin-bottom: 30px;
}

.file-info {
  margin-bottom: 20px;
}

.file-details {
  display: flex;
  align-items: center;
  background: #f8f9fa;
  border-radius: 10px;
  padding: 12px 16px;
  border: 1px solid #e9ecef;
}

.file-icon {
  font-size: 24px;
  margin-right: 12px;
}

.file-text {
  flex: 1;
  text-align: left;
}

.file-text strong {
  display: block;
  font-size: 14px;
  color: #2c3e50;
}

.file-text small {
  color: #6c757d;
  font-size: 12px;
}

.remove-btn {
  background: none;
  border: none;
  color: #dc3545;
  cursor: pointer;
  font-size: 18px;
  padding: 0;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-btn:hover {
  background: #ffeaea;
}

.upload-box {
  display: block;
  border: 2px dashed #aaa;
  border-radius: 12px;
  padding: 40px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #f9f9f9;
  margin-bottom: 20px;
}

.upload-box:hover {
  border-color: #107667;
  background: #eef7f5;
}

.upload-content .icon {
  font-size: 40px;
  display: block;
  margin-bottom: 12px;
}

.upload-content p {
  margin: 8px 0;
  color: #2c3e50;
}

.upload-content small {
  color: #6c757d;
}

.convert-btn {
  width: 100%;
  padding: 14px;
  font-size: 16px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  background: rgb(238, 108, 77);
  color: white;
  font-weight: 600;
  transition: all 0.3s ease;
  margin-top: 10px;
}

.convert-btn:hover:not(:disabled) {
  background: rgb(218, 88, 57);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(238, 108, 77, 0.3);
}

.convert-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

.convert-btn.loading {
  background: #6c757d;
}

.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
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

.progress-wrapper {
  height: 12px;
  width: 100%;
  background: #e9ecef;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, rgb(238, 108, 77), rgb(255, 152, 124));
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
  max-width: 450px;
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
  background: linear-gradient(135deg, #4CAF50, #45a049);
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

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 24px;
}

.stat-item {
  text-align: left;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.stat-value {
  display: block;
  font-size: 14px;
  color: #2c3e50;
  font-weight: 500;
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
  background: rgb(238, 108, 77);
  color: white;
}

.btn-primary:hover {
  background: rgb(218, 88, 57);
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}
</style>