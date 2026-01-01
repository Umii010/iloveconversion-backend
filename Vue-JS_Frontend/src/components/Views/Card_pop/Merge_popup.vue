<script setup>
import { ref, computed } from 'vue'

const files = ref([])
const loading = ref(false)
const progress = ref(0)
const statusText = ref('')
const showSuccessPopup = ref(false)
const mergeStats = ref(null)
const uploadTime = ref(null)

// Computed properties
const totalFileSize = computed(() => {
  return files.value.reduce((sum, file) => sum + file.size, 0)
})

const formattedTotalSize = computed(() => {
  const size = totalFileSize.value
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
})

const formattedIndividualSizes = computed(() => {
  return files.value.map(file => {
    const size = file.size
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  })
})

const selectFiles = (e) => {
  const selectedFiles = Array.from(e.target.files)
  
  // Filter only PDF files
  const pdfFiles = selectedFiles.filter(file => file.type === 'application/pdf')
  
  if (pdfFiles.length !== selectedFiles.length) {
    alert('Some files were not PDFs and were ignored.')
  }
  
  if (pdfFiles.length > 0) {
    files.value = [...files.value, ...pdfFiles]
    uploadTime.value = new Date()
    statusText.value = `Added ${pdfFiles.length} PDF file(s)`
  }
}

const removeFile = (index) => {
  files.value.splice(index, 1)
}

const removeAllFiles = () => {
  files.value = []
}

const getTimeEstimate = () => {
  const totalMB = totalFileSize.value / (1024 * 1024)
  const fileCount = files.value.length
  
  if (fileCount === 0) return 'Add files to estimate'
  if (totalMB < 2) return '~3-5 seconds'
  if (totalMB < 10) return '~5-15 seconds'
  if (totalMB < 50) return '~15-30 seconds'
  return '~30+ seconds'
}

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const mergePdf = async () => {
  if (!files.value.length) {
    alert('Please select PDF files')
    return
  }

  if (files.value.length < 2) {
    alert('Please select at least 2 PDF files to merge')
    return
  }

  loading.value = true
  progress.value = 0
  statusText.value = 'Preparing files for merge...'
  const startTime = Date.now()

  const formData = new FormData()
  files.value.forEach((file) => {
    formData.append('files', file)
  })

  try {
    // Progress simulation based on merge stages
    const progressStages = [
      { stage: 'Uploading files...', progress: 10 },
      { stage: 'Processing PDFs...', progress: 25 },
      { stage: 'Reading PDF content...', progress: 40 },
      { stage: 'Merging pages...', progress: 65 },
      { stage: 'Creating final PDF...', progress: 85 },
      { stage: 'Finalizing merge...', progress: 95 }
    ]

    let currentStage = 0
    const progressInterval = setInterval(() => {
      if (currentStage < progressStages.length) {
        statusText.value = progressStages[currentStage].stage
        progress.value = progressStages[currentStage].progress
        currentStage++
      }
    }, 800)

    const res = await fetch('http://192.168.18.101:3000/api/merge-pdf', {
      method: 'POST',
      body: formData
    })

    clearInterval(progressInterval)
    progress.value = 100

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.message || 'Merge failed')
    }

    // Get stats from API
    const mergedSize = res.headers.get('X-Merged-Size')
    const originalNames = res.headers.get('X-Original-Names')
    const totalPages = res.headers.get('X-Total-Pages') || 'Unknown'
    const fileName = res.headers.get('X-Filename') || 'merged.pdf'
    
    const endTime = Date.now()
    const timeTaken = ((endTime - startTime) / 1000).toFixed(1)

    // Store stats for popup
    mergeStats.value = {
      fileName,
      totalPages,
      mergedSize: mergedSize ? formatBytes(mergedSize) : 'Calculating...',
      originalSize: formattedTotalSize.value,
      fileCount: files.value.length,
      timeTaken: `${timeTaken} seconds`,
      timestamp: new Date().toLocaleTimeString()
    }

    statusText.value = 'Merge complete! Downloading...'

    const blob = await res.blob()
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = mergeStats.value.fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    // Show success popup
    showSuccessPopup.value = true

    // Reset progress after download
    setTimeout(() => {
      progress.value = 0
      statusText.value = ''
    }, 1000)

  } catch (err) {
    console.error(err)
    statusText.value = `Error: ${err.message}`
    alert(`Merge failed: ${err.message}`)
  } finally {
    loading.value = false
  }
}

const closePopup = () => {
  showSuccessPopup.value = false
  // Reset files after viewing stats
  files.value = []
  const input = document.querySelector('input[type="file"]')
  if (input) input.value = ''
}

const handleDragOver = (e) => {
  e.preventDefault()
  e.currentTarget.classList.add('drag-over')
}

const handleDragLeave = (e) => {
  e.preventDefault()
  e.currentTarget.classList.remove('drag-over')
}

const handleDrop = (e) => {
  e.preventDefault()
  e.currentTarget.classList.remove('drag-over')
  
  const droppedFiles = Array.from(e.dataTransfer.files)
  const pdfFiles = droppedFiles.filter(file => file.type === 'application/pdf')
  
  if (pdfFiles.length > 0) {
    files.value = [...files.value, ...pdfFiles]
    uploadTime.value = new Date()
    statusText.value = `Added ${pdfFiles.length} PDF file(s) via drag & drop`
  } else if (droppedFiles.length > 0) {
    alert('Only PDF files are supported for merging.')
  }
}
</script>

<template>
  <div class="converter">
    <h2>🔗 Merge PDF Files</h2>
    <p class="subtitle">Combine multiple PDFs into a single document</p>


    <!-- Upload Area -->
    <label 
      class="upload-box"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <input
        type="file"
        accept="application/pdf"
        multiple
        @change="selectFiles"
        hidden
      />
      <div class="upload-content">
        <p><strong>Click to upload</strong> or drag & drop PDFs</p>
        <small>Minimum 2 files required for merge</small>
      </div>
    </label>
      <div v-if="files.length > 0" class="file-summary">
      <div class="summary-header">
        <h3>Selected Files ({{ files.length }})</h3>
        <button @click="removeAllFiles" class="clear-all-btn" :disabled="loading">
          Clear All
        </button>
      </div>
      <div class="summary-stats">
        <span class="stat">
          <strong>Total Size:</strong> {{ formattedTotalSize }}
        </span>
        <span class="stat">
          <strong>Time Estimate:</strong> {{ getTimeEstimate() }}
        </span>
      </div>
    </div>
    <!-- Merge Button -->
    <button 
      class="merge-btn" 
      @click="mergePdf" 
      :disabled="loading || files.length < 2"
      :class="{ 
        'loading': loading,
        'disabled': files.length < 2
      }"
    >
      <span v-if="!loading">
        <span v-if="files.length < 2">Select {{ 2 - files.length }} more file(s)</span>
        <span v-else>Merge {{ files.length }} PDFs</span>
      </span>
      <span v-else>
        <span class="spinner"></span> Merging...
      </span>
    </button>

    <!-- Progress Section -->
    <div v-if="loading" class="progress-section">
      <div class="progress-header">
        <span>Merging Progress</span>
        <span class="time-estimate">{{ getTimeEstimate() }}</span>
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
          <h3>PDFs Merged Successfully !</h3>
          <button class="close-popup" @click="closePopup">✕</button>
        </div>
        
        <div class="popup-content" v-if="mergeStats">
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">Output File:</span>
              <span class="stat-value">{{ mergeStats.fileName }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Files Merged:</span>
              <span class="stat-value">{{ mergeStats.fileCount }} PDFs</span>
            </div>
          
            <div class="stat-item">
              <span class="stat-label">Time Taken:</span>
              <span class="stat-value">{{ mergeStats.timeTaken }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Completed:</span>
              <span class="stat-value">{{ mergeStats.timestamp }}</span>
            </div>
          </div>
          
          <div class="popup-actions">
            <button class="btn-primary" @click="closePopup">Merge More Files</button>
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
  max-width: 600px;
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

/* File Summary */
.file-summary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 16px 20px;
  border-radius: 12px;
  margin-bottom: 20px;
  text-align: left;
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.summary-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.clear-all-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.clear-all-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
}

.clear-all-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.summary-stats {
  display: flex;
  gap: 20px;
  font-size: 13px;
}

.stat {
  display: flex;
  gap: 6px;
  align-items: center;
}

/* Upload Box */
.upload-box {
  display: block;
  border: 2px dashed #aaa;
  border-radius: 12px;
  padding: 20px 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #f9f9f9;
  margin-bottom: 20px;
}

.upload-box:hover, .upload-box.drag-over {
  border-color: #667eea;
  background: #f0f4ff;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.1);
}

.upload-content .icon {
  font-size: 40px;
  display: block;
  margin-bottom: 12px;
}

.upload-content p {
  margin: 8px 0;
  color: #2c3e50;
  font-size: 16px;
}

.upload-content small {
  color: #6c757d;
  font-size: 13px;
}

/* File List */
.file-list-container {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e9ecef;
  border-radius: 10px;
  margin-bottom: 20px;
  background: white;
}

.file-list-scroll {
  padding: 10px;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s ease;
}

.file-item:hover {
  background-color: #f8f9fa;
}

.file-item:last-child {
  border-bottom: none;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.file-icon {
  font-size: 20px;
  color: #667eea;
}

.file-details {
  text-align: left;
}

.file-name {
  font-size: 14px;
  color: #2c3e50;
  margin-bottom: 2px;
  word-break: break-word;
}

.file-size {
  font-size: 12px;
  color: #6c757d;
}

.remove-file-btn {
  background: none;
  border: none;
  color: #ff6b6b;
  font-size: 22px;
  cursor: pointer;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.remove-file-btn:hover:not(:disabled) {
  background: #ffeaea;
  transform: scale(1.1);
}

.remove-file-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Merge Button */
.merge-btn {
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
  position: relative;
  overflow: hidden;
}

.merge-btn:hover:not(:disabled):not(.disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
}

.merge-btn:disabled, .merge-btn.disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

.merge-btn.loading {
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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


/* Scrollbar Styling */
.file-list-container::-webkit-scrollbar {
  width: 6px;
}

.file-list-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.file-list-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.file-list-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>