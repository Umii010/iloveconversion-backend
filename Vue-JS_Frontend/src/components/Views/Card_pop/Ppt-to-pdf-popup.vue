<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const file = ref(null)
const loading = ref(false)
const progress = ref(0)
const statusText = ref('')
const timeElapsed = ref('0s')
const estimatedTime = ref('')
const showPopup = ref(false)
const popupMessage = ref('')

let startTime = null
let timerInterval = null
let fakeProgressInterval = null

const updateTimer = () => {
  if (!startTime) return
  
  const elapsed = Math.floor((Date.now() - startTime) / 1000)
  const minutes = Math.floor(elapsed / 60)
  const seconds = elapsed % 60
  
  if (minutes > 0) {
    timeElapsed.value = `${minutes}m ${seconds}s`
  } else {
    timeElapsed.value = `${seconds}s`
  }
}

// Start timer
const startTimer = () => {
  startTime = Date.now()
  timeElapsed.value = '0s'
  
  if (timerInterval) clearInterval(timerInterval)
  timerInterval = setInterval(updateTimer, 1000)
}

// Stop timer
const stopTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
  updateTimer() // Final update
}

// Estimate time based on file size
const estimateTime = (fileSizeMB) => {
  if (fileSizeMB < 5) return '10-20 seconds'
  if (fileSizeMB < 20) return '20-40 seconds'
  if (fileSizeMB < 50) return '1-2 minutes'
  return '2-5 minutes'
}

// Show popup notification
const showNotification = (message, duration = 3000) => {
  popupMessage.value = message
  showPopup.value = true
  
  setTimeout(() => {
    showPopup.value = false
  }, duration)
}

// Close popup
const closePopup = () => {
  showPopup.value = false
}

// File selection
const selectFile = (e) => {
  const selectedFile = e.target.files[0]
  if (!selectedFile) return
  
  // Check file type
  const fileName = selectedFile.name.toLowerCase()
  const validExtensions = ['.ppt', '.pptx', '.pps', '.ppsx', '.odp']
  const isValid = validExtensions.some(ext => fileName.endsWith(ext))
  
  if (!isValid) {
    showNotification('Please select a PowerPoint file (.ppt, .pptx, .pps, .ppsx, .odp)', 4000)
    e.target.value = ''
    return
  }
  
  // Check file size (max 100MB)
  if (selectedFile.size > 100 * 1024 * 1024) {
    showNotification('File size exceeds 100MB limit', 4000)
    e.target.value = ''
    return
  }
  
  file.value = selectedFile
  const fileSizeMB = selectedFile.size / (1024 * 1024)
  estimatedTime.value = estimateTime(fileSizeMB)
  
  showNotification(`✓ ${selectedFile.name} loaded (${fileSizeMB.toFixed(1)} MB)`, 3000)
}

const convertPptToPdf = async () => {
  if (!file.value) {
    showNotification('Please select a PowerPoint file first', 3000)
    return
  }

  loading.value = true
  progress.value = 0
  startTimer()
  
  showPopup.value = false

  const formData = new FormData()
  formData.append('file', file.value)

  try {
    // Start fake progress simulation
    fakeProgressInterval = setInterval(() => {
      if (progress.value < 85) {
        // Slower progress as we advance
        const increment = 2 + Math.random() * 3
        progress.value = Math.min(85, progress.value + increment)
        updateStatusText(progress.value)
      }
    }, 500)

    // Call API
    const res = await fetch('http://192.168.18.101:3000/api/ppt-to-pdf', {
      method: 'POST',
      body: formData
    })

    clearInterval(fakeProgressInterval)
    progress.value = 95
    statusText.value = 'Finalizing PDF...'

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`Server error: ${res.status} - ${errorText}`)
    }

    const contentDisposition = res.headers.get('content-disposition')
    let fileName = `${file.value.name.replace(/\.[^/.]+$/, '')}.pdf`
    
    if (contentDisposition) {
      const matches = contentDisposition.match(/filename="(.+)"/)
      if (matches && matches[1]) {
        fileName = matches[1]
      }
    }

    // Download the PDF
    const blob = await res.blob()
    
    if (blob.size === 0) {
      throw new Error('Received empty file from server')
    }
    
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    progress.value = 100
    statusText.value = 'Conversion complete!'
    
    const totalTime = Math.floor((Date.now() - startTime) / 1000)
    const downloadSize = (blob.size / (1024 * 1024)).toFixed(1)
    
    showNotification(
      `✅ Conversion successful!\n` +
      `⏱️ Time: ${totalTime}s\n` +
      `📦 Size: ${downloadSize} MB\n` +
      `📄 Saved as: ${fileName}`,
      6000
    )

  } catch (err) {
    console.error('PPT to PDF error:', err)
    
    let userMessage = 'Conversion failed. '
    
    if (err.message.includes('timeout')) {
      userMessage += 'Server took too long to respond.'
    } else if (err.message.includes('PowerPoint')) {
      userMessage += 'PowerPoint may not be installed on server.'
    } else {
      userMessage += 'Please try again.'
    }
    
    showNotification(` ${userMessage}`, 5000)
    statusText.value = 'Conversion failed'
    
  } finally {
    stopTimer()
    clearInterval(fakeProgressInterval)
    
    // Reset after delay
    setTimeout(() => {
      loading.value = false
      progress.value = 0
      statusText.value = ''
      timeElapsed.value = '0s'
    }, 2000)
  }
}

// Clear selected file
const clearFile = () => {
  file.value = null
  estimatedTime.value = ''
  const input = document.querySelector('input[type="file"]')
  if (input) input.value = ''
  showNotification('File cleared', 2000)
}

// Clean up intervals on component unmount
onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
  if (fakeProgressInterval) clearInterval(fakeProgressInterval)
})
</script>

<template>
  <div class="converter">
    <!-- Popup Notification -->
    <div v-if="showPopup" class="popup-notification" :class="{ 'popup-error': popupMessage.includes('❌') }">
      <div class="popup-content">
        <div class="popup-message">
          {{ popupMessage }}
        </div>
        <button class="popup-close" @click="closePopup">✕</button>
      </div>
    </div>

    <h2>📊 PowerPoint to PDF Converter</h2>
    <p class="subtitle">Convert PPT, PPTX, PPS to high-quality PDF documents</p>

    <!-- File Upload Section -->
    <label class="upload-box">
      <input
        type="file"
        accept=".ppt,.pptx,.pps,.ppsx,.odp"
        @change="selectFile"
        hidden
      />
      <div class="upload-content">
        <p class="upload-subtitle">or drag and drop here</p>
        <div class="supported-formats">
          <span>Supports: PPT • PPTX • PPS • PPSX • ODP</span>
        </div>
        <div v-if="file" class="selected-file">
          <span class="file-icon">📄</span>
          <span class="file-name">{{ file.name }}</span>
          <span class="file-size">({{ (file.size / (1024 * 1024)).toFixed(1) }} MB)</span>
        </div>
      </div>
    </label>
    <!-- Action Buttons -->
    <div class="action-buttons">
      <button 
        v-if="file" 
        @click="clearFile" 
        class="secondary-btn"
        :disabled="loading"
      >
         Clear File
      </button>
      <button 
        class="convert-btn" 
        @click="convertPptToPdf" 
        :disabled="loading || !file"
        :class="{ loading: loading }"
      >
        <template v-if="loading">
          <span class="spinner">⟳</span>
          Converting... {{ progress.toFixed(0) }}%
        </template>
        <template v-else>
           Convert to PDF
        </template>
      </button>
    </div>
  </div>
</template>

<style scoped>
.converter {
  max-width: 700px;
  margin: 0 auto;
  padding: 20px 10px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

h2 {
  font-size: 24px;
  color: #2d3748;
  text-align: center;
  margin: 0;
  font-weight: 400;
}

.subtitle {
  color: #718096;
  text-align: center;
  font-size: 16px;
  margin-bottom: 5px;
}

.popup-notification {
  position: fixed;
  top: 60px;
  right: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  border-left: 5px solid #10b981;
  z-index: 1000;
  animation: slideIn 0.3s ease;
  max-width: 400px;
}

.popup-notification.popup-error {
  border-left-color: #ef4444;
}

.popup-content {
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
}

.popup-message {
  flex: 1;
  white-space: pre-line;
  font-size: 14px;
  line-height: 1.5;
  color: #2d3748;
}

.popup-close {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  font-size: 18px;
  padding: 5px;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.popup-close:hover {
  background: #f3f4f6;
  color: #374151;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* File Upload */
.upload-box {
  display: block;
  border: 3px dashed #d1d5db;
  border-radius: 16px;
  padding: 10px 5px;
  cursor: pointer;
  background: #f9fafb;
  transition: all 0.3s;
  text-align: center;
}

.upload-box:hover {
  border-color: #8b5cf6;
  background: #f5f3ff;
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(139, 92, 246, 0.1);
}

.upload-content .icon {
  font-size: 56px;
  display: block;
  margin-bottom: 15px;
  color: #8b5cf6;
}

.upload-title {
  font-size: 20px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 8px 0;
}

.upload-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 20px 0;
}

.supported-formats {
  font-size: 13px;
  color: #9ca3af;
}

.selected-file {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: white;
  padding: 12px 20px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  margin-top: 15px;
}

.file-icon {
  font-size: 20px;
  color: #8b5cf6;
}

.file-name {
  font-weight: 500;
  color: #374151;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  font-size: 13px;
  color: #6b7280;
}

/* File Stats */
.file-stats {
  background: white;
  border-radius: 12px;
  padding: 10px;
  margin: 10px 0;
  border: 1px solid #e5e7eb;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f3f4f6;
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-label {
  font-weight: 500;
  color: #6b7280;
  font-size: 14px;
}

.stat-value {
  font-weight: 600;
  color: #374151;
  font-size: 15px;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin: 10px 0;
}

.convert-btn {
  flex: 1;
  max-width: 350px;
  padding: 10px 0px;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  border: none;
  border-radius: 14px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 8px 25px rgba(139, 92, 246, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.convert-btn:hover:not(:disabled) {
  box-shadow: 0 12px 30px rgba(139, 92, 246, 0.4);
  background: linear-gradient(135deg, #7c3aed, #6d28d9);
}

.convert-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.convert-btn.loading {
  background: linear-gradient(135deg, #6b7280, #4b5563);
}

.secondary-btn {
  padding: 10px 15px;
  background: white;
  border: 2px solid #d1d5db;
  border-radius: 14px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 16px;
}

.secondary-btn:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
  color: #374151;
}

.secondary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  display: inline-block;
  animation: spin 1s linear infinite;
  font-size: 20px;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Progress Section */
.progress-section {
  margin: 40px 0;
  padding: 30px;
  background: white;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.progress-header .status {
  font-weight: 600;
  color: #374151;
  font-size: 17px;
}

.progress-header .timer {
  font-weight: 500;
  color: #8b5cf6;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.progress-container {
  margin-bottom: 30px;
}

.progress-bar {
  height: 14px;
  background: #f3f4f6;
  border-radius: 7px;
  overflow: hidden;
  margin-bottom: 10px;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6, #a78bfa);
  border-radius: 7px;
  transition: width 0.5s ease;
  position: relative;
  overflow: hidden;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: shimmer 2s infinite;
}

.progress-text {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: white;
  font-size: 11px;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.progress-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #9ca3af;
  padding: 0 5px;
}

.progress-stages {
  display: flex;
  justify-content: space-between;
  position: relative;
  margin-top: 40px;
}

.progress-stages::before {
  content: '';
  position: absolute;
  top: 10px;
  left: 0;
  right: 0;
  height: 3px;
  background: #f3f4f6;
  z-index: 1;
}

.stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 2;
}

.stage-dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #f3f4f6;
  border: 3px solid #f3f4f6;
  margin-bottom: 8px;
  transition: all 0.3s;
}

.stage.active .stage-dot {
  background: white;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2);
}

.stage-label {
  font-size: 13px;
  color: #9ca3af;
  font-weight: 500;
  text-align: center;
}

.stage.active .stage-label {
  color: #374151;
  font-weight: 600;
}

@keyframes shimmer {
  100% { left: 100%; }
}

/* Info Box */
.info-box {
  background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
  border: 1px solid #bae6fd;
  border-radius: 16px;
  padding: 25px;
  margin-top: 30px;
}

.info-box h4 {
  margin: 0 0 15px 0;
  color: #0369a1;
  font-size: 18px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-box ul {
  margin: 0;
  padding-left: 20px;
  list-style: none;
}

.info-box li {
  margin-bottom: 10px;
  color: #0c4a6e;
  font-size: 15px;
  line-height: 1.5;
  position: relative;
  padding-left: 25px;
}

.info-box li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: #10b981;
  font-weight: bold;
}

.info-box li:last-child {
  margin-bottom: 0;
}

/* Responsive Design */
@media (max-width: 768px) {
  .converter {
    padding: 20px 15px;
  }
  
  .upload-box {
    padding: 30px 20px;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .convert-btn,
  .secondary-btn {
    width: 100%;
    max-width: none;
  }
  
  .progress-section {
    padding: 20px;
  }
  
  .progress-stages {
    flex-wrap: wrap;
    gap: 20px;
    justify-content: space-around;
  }
  
  .stage {
    min-width: 80px;
  }
  
  .popup-notification {
    left: 20px;
    right: 20px;
    max-width: none;
  }
}

@media (max-width: 480px) {
  .file-stats {
    padding: 20px;
  }
  
  .stat-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
  
  .selected-file {
    flex-direction: column;
    text-align: center;
    gap: 8px;
    padding: 15px;
  }
  
  .file-name {
    max-width: 250px;
  }
}
</style>