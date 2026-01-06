<script setup>
import { ref, computed } from 'vue'

const files = ref([])
const loading = ref(false)
const progress = ref(0)
const statusText = ref('')
const showSuccessPopup = ref(false)
const conversionStats = ref(null)
const uploadTime = ref(null)
const conversionStartTime = ref(null)

// Supported formats display
const supportedFormats = [
  { ext: '.png', name: 'PNG', icon: '🖼️' },
  { ext: '.jpg', name: 'JPG', icon: '📷' },
  { ext: '.jpeg', name: 'JPEG', icon: '📷' },
  { ext: '.webp', name: 'WebP', icon: '🌐' },
  { ext: '.bmp', name: 'BMP', icon: '🖼️' },
  { ext: '.gif', name: 'GIF', icon: '🎬' },
  { ext: '.tiff', name: 'TIFF', icon: '🖨️' },
  { ext: '.svg', name: 'SVG', icon: '🔺' },
  { ext: '.ico', name: 'ICO', icon: '🖥️' },
  { ext: '.heic', name: 'HEIC', icon: '📱' },
  { ext: '.heif', name: 'HEIF', icon: '📱' }
]

// Computed properties
const totalFileSize = computed(() => {
  return files.value.reduce((sum, file) => sum + file.size, 0)
})

const formattedTotalSize = computed(() => {
  return formatBytes(totalFileSize.value)
})

const estimatedTime = computed(() => {
  if (files.value.length === 0) return 'Select files'
  const totalMB = totalFileSize.value / (1024 * 1024)
  const fileCount = files.value.length
  
  if (fileCount === 1 && totalMB < 5) return '~5-10 seconds'
  if (fileCount <= 5 && totalMB < 20) return '~10-30 seconds'
  if (fileCount <= 10 && totalMB < 50) return '~30-60 seconds'
  if (fileCount <= 20) return '~1-2 minutes'
  return '~2-3 minutes'
})

// Helper functions
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const getFileIcon = (filename) => {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'))
  const format = supportedFormats.find(f => f.ext === ext)
  return format ? format.icon : '📄'
}

const selectFiles = (e) => {
  const selectedFiles = Array.from(e.target.files)
  
  if (selectedFiles.length === 0) return
  
  // Check for unsupported formats
  const unsupportedFiles = selectedFiles.filter(file => {
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))
    return !supportedFormats.some(format => format.ext === ext)
  })
  
  if (unsupportedFiles.length > 0) {
    const unsupportedNames = unsupportedFiles.map(f => f.name).join(', ')
    alert(`The following files have unsupported formats and will be ignored:\n${unsupportedNames}\n\nSupported formats: PNG, JPG, JPEG, WebP, BMP, GIF, TIFF, SVG, ICO, HEIC, HEIF`)
    
    // Filter out unsupported files
    const supportedFiles = selectedFiles.filter(file => {
      const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))
      return supportedFormats.some(format => format.ext === ext)
    })
    
    if (supportedFiles.length > 0) {
      files.value = [...files.value, ...supportedFiles]
      uploadTime.value = new Date()
      statusText.value = `Added ${supportedFiles.length} image(s)`
    }
  } else {
    files.value = [...files.value, ...selectedFiles]
    uploadTime.value = new Date()
    statusText.value = `Added ${selectedFiles.length} image(s)`
  }
}

const removeFile = (index) => {
  files.value.splice(index, 1)
}

const removeAllFiles = () => {
  files.value = []
}

const imagesToPdf = async () => {
  if (!files.value.length) {
    alert('Please select image files')
    return
  }

  loading.value = true
  progress.value = 0
  statusText.value = 'Preparing conversion...'
  showSuccessPopup.value = false
  conversionStartTime.value = Date.now()

  const formData = new FormData()
  files.value.forEach((file) => {
    formData.append('images', file)
  })

  try {
    // Progress simulation stages
    const progressStages = [
      { stage: 'Uploading images to server...', progress: 10, time: 800 },
      { stage: 'Validating image formats...', progress: 20, time: 600 },
      { stage: 'Processing images...', progress: 40, time: 1200 },
      { stage: 'Optimizing image quality...', progress: 60, time: 1000 },
      { stage: 'Creating PDF document...', progress: 80, time: 1500 },
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
    const res = await fetch('http://192.168.18.101:3000/api/image-to-pdf', {
      method: 'POST',
      body: formData
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.message || 'Conversion failed')
    }

    // Get stats from headers
    const imageCount = parseInt(res.headers.get('X-Image-Count')) || files.value.length
    const totalOriginalSize = parseInt(res.headers.get('X-Total-Original-Size')) || totalFileSize.value
    const pdfSize = parseInt(res.headers.get('X-PDF-Size')) || 0
    const compressionRatio = res.headers.get('X-Compression-Ratio') || '0.00'
    const avgImageSize = parseInt(res.headers.get('X-Avg-Image-Size')) || 0
    
    const endTime = Date.now()
    const timeTaken = ((endTime - conversionStartTime.value) / 1000).toFixed(1)

    // Store stats for popup
    conversionStats.value = {
      imageCount,
      pdfSize: formatBytes(pdfSize),
      originalSize: formatBytes(totalOriginalSize),
      compressionRatio,
      avgImageSize: formatBytes(avgImageSize),
      timeTaken: `${timeTaken} seconds`,
      timestamp: new Date().toLocaleTimeString(),
      fileNames: files.value.map(f => f.name)
    }

    progress.value = 100
    statusText.value = 'Conversion complete! Downloading...'

    // Get blob and download
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `images_${Date.now()}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

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
  
  if (droppedFiles.length > 0) {
    // Simulate file input change
    const dataTransfer = new DataTransfer()
    droppedFiles.forEach(file => dataTransfer.items.add(file))
    
    const event = new Event('change', { bubbles: true })
    Object.defineProperty(event, 'target', { value: { files: dataTransfer.files } })
    
    selectFiles(event)
  }
}
</script>

<template>
  <div class="converter">
    <h2>🖼️ Images to PDF Converter</h2>
    <p class="subtitle">Combine multiple images into a single PDF document</p>


    <!-- Upload Area -->
    <label 
      class="upload-box"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <input
        type="file"
        accept=".png,.jpg,.jpeg,.webp,.bmp,.gif,.tiff,.tif,.svg,.ico,.heic,.heif"
        multiple
        @change="selectFiles"
        hidden
      />
      <div class="upload-content">
        <p><strong>Click to upload</strong> or drag & drop images</p>
        <small>Combine multiple images into one PDF</small>
        <div class="upload-tips">
          <small>Supports: PNG, JPG, WebP, GIF, TIFF, SVG, HEIC, etc.</small><br>
          <small>Order: Images are combined in the order shown</small>
        </div>
      </div>
    </label>

     <!-- File Summary -->
    <div v-if="files.length > 0" class="file-summary">
      <div class="summary-header">
        <h3>Selected Images ({{ files.length }})</h3>
        <button @click="removeAllFiles" class="clear-all-btn" :disabled="loading">
          Clear All
        </button>
      </div>
      <div class="summary-stats">
        <span class="stat">
          <strong>Total Size:</strong> {{ formattedTotalSize }}
        </span>
        <span class="stat">
          <strong>Time Estimate:</strong> {{ estimatedTime }}
        </span>
      </div>
    </div>

    <!-- Convert Button -->
    <button 
      class="convert-btn" 
      @click="imagesToPdf" 
      :disabled="loading || files.length === 0"
      :class="{ 'loading': loading, 'disabled': files.length === 0 }"
    >
      <span v-if="!loading">
        Convert {{ files.length }} Image{{ files.length !== 1 ? 's' : '' }} to PDF
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
        <span class="stat">Quality: 300 DPI (High)</span>
        <span class="stat">Stage: {{ Math.floor(progress / 20) + 1 }}/6</span>
      </div>
    </div>

    <!-- Success Popup -->
    <div v-if="showSuccessPopup" class="popup-overlay" @click.self="closePopup">
      <div class="success-popup">
        <div class="popup-header">
          <h3>Images Converted Successfully !!</h3>
          <button class="close-popup" @click="closePopup">✕</button>
        </div>
        
        <div class="popup-content" v-if="conversionStats">
          <div class="stats-summary">
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-label">Time Taken</div>
                <div class="stat-value">{{ conversionStats.timeTaken }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">PDF Quality</div>
                <div class="stat-value">300 DPI</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">Completed</div>
                <div class="stat-value">{{ conversionStats.timestamp }}</div>
              </div>
            </div>
          </div>
          
          <div class="popup-actions">
            <button class="btn-primary" @click="closePopup">Convert More Images</button>
            <button class="btn-secondary" @click="closePopup">Close</button>
          </div>
        </div>
      </div>
    </div>  
  </div>
</template>

<style scoped>
.converter {
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

/* Supported Formats */
.supported-formats {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  border: 1px solid #e9ecef;
}

.formats-header {
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.formats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 10px;
}

.format-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  background: white;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  transition: all 0.3s ease;
}

.format-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.format-icon {
  font-size: 20px;
  margin-bottom: 5px;
}

.format-name {
  font-size: 11px;
  color: #495057;
  font-weight: 500;
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
  flex-wrap: wrap;
}

.stat {
  display: flex;
  gap: 6px;
  align-items: center;
}

.upload-box {
  display: block;
  border: 2px dashed #aaa;
  border-radius: 12px;
  padding: 20px 10px;
  cursor: pointer;
  background: #f9f9f9;
  transition: all 0.3s ease;
  margin-bottom: 20px;
  text-align: center;
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

.upload-tips {
  margin-top: 10px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 11px;
  color: #666;
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

/* Convert Button */
.convert-btn {
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

.convert-btn:hover:not(:disabled):not(.disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
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
}

/* Size Comparison */
.size-comparison {
  margin: 25px 0;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 10px;
  border: 1px solid #e9ecef;
}

.comparison-header {
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 15px;
  text-align: center;
}

.size-bars {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.size-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 13px;
}

.size-bar.original {
  background: linear-gradient(90deg, #6c757d, #495057);
  color: white;
}

.size-bar.pdf {
  background: linear-gradient(90deg, #28a745, #20c997);
  color: white;
}

.compression-info {
  margin-top: 15px;
  text-align: center;
  font-size: 13px;
}

.compression-label {
  color: #666;
  margin-right: 8px;
}

.compression-value {
  color: #28a745;
  font-weight: 600;
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
  color: #666;
  margin-bottom: 8px;
  font-weight: 500;
}

.stat-value {
  font-size: 16px;
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