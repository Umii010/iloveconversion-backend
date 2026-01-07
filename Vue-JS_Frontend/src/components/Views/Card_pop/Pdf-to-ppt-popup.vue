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
const showPopup = ref(false)
const popupMessage = ref('')
const popupType = ref('success')

// Enhanced conversion settings
const conversionSettings = ref({
  format: 'pptx',
  aspectRatio: 'auto', // 'auto', '16:9', '4:3', 'match-pdf'
  imageQuality: 'high', // 'low', 'medium', 'high'
  dpi: 200,
  includeMargins: true,
  centerContent: true,
  addPageNumbers: false
})

// Aspect ratio options with descriptions
const aspectRatioOptions = [
  { id: 'auto', name: 'Auto Detect', icon: '🤖', desc: 'Automatically choose best fit' },
  { id: 'match-pdf', name: 'Match PDF', icon: '📏', desc: 'Use PDF\'s own aspect ratio' },
  { id: '16:9', name: 'Widescreen (16:9)', icon: '📺', desc: 'Modern widescreen format' },
  { id: '4:3', name: 'Standard (4:3)', icon: '🖥️', desc: 'Traditional presentation format' },
  { id: 'A4', name: 'A4 Portrait', icon: '📄', desc: 'A4 paper size, portrait' }
]

// Quality options
const qualityOptions = [
  { id: 'low', name: 'Fast (Low Quality)', dpi: 150 },
  { id: 'medium', name: 'Balanced (Medium)', dpi: 200 },
  { id: 'high', name: 'Best (High Quality)', dpi: 300 }
]

const selectFile = (e) => {
  const selectedFile = e.target.files[0]
  if (!selectedFile) return
  
  if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
    showNotification('Please select a PDF file', 'error')
    e.target.value = ''
    return
  }
  
  if (selectedFile.size > 100 * 1024 * 1024) {
    showNotification('File size exceeds 100MB limit', 'error')
    e.target.value = ''
    return
  }
  
  file.value = selectedFile
  showNotification(`PDF loaded: ${selectedFile.name}`, 'info')
}

const convertPdfToPpt = async () => {
  if (!file.value) {
    showNotification('Please select a PDF file', 'error')
    return
  }

  loading.value = true
  progress.value = 0
  statusText.value = 'Initializing conversion...'
  showPopup.value = false

  const formData = new FormData()
  formData.append('file', file.value)
  formData.append('settings', JSON.stringify(conversionSettings.value))

  let fakeProgress = null
  const startTime = Date.now()

  try {
    // Enhanced progress simulation
    fakeProgress = setInterval(() => {
      if (progress.value < 90) {
        const baseIncrement = Math.random() * 5
        const timeFactor = Math.min(1, (Date.now() - startTime) / 30000)
        progress.value += baseIncrement * (1 - timeFactor * 0.5)
        updateStatusText(progress.value)
      }
    }, 300)

    const res = await fetch('http://192.168.18.101:3000/api/pdf-to-ppt', {
      method: 'POST',
      body: formData
    })

    clearInterval(fakeProgress)
    progress.value = 100
    statusText.value = 'Finalizing...'

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`Conversion failed: ${res.status} - ${errorText}`)
    }

    const blob = await res.blob()
    
    if (blob.size === 0) {
      throw new Error('Received empty file from server')
    }
    
    const fileName = `${file.value.name.replace('.pdf', '')}_converted.pptx`
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1)
    showNotification(
      `✅ Conversion successful in ${elapsedTime}s!\n` +
      `✓ Aspect ratio preserved\n` +
      `✓ No stretching issues\n` +
      `✓ High quality maintained`,
      'success'
    )
     trackToolUsage('pdf_to_ppt', 'convert', {
      file_size: file.value.size,
      quality: conversionSettings.value.imageQuality,
      aspect_ratio: conversionSettings.value.aspectRatio,
      dpi: conversionSettings.value.dpi,
      conversion_time: elapsedTime
    });

  } catch (err) {
    console.error('Conversion error:', err)
    showNotification(`❌ ${err.message}`, 'error')
     trackToolUsage('pdf_to_ppt', 'convert_error', {
      error_message: err.message.substring(0, 100),
      file_size: file.value?.size || 0
    });
  } finally {
    if (fakeProgress) clearInterval(fakeProgress)
    loading.value = false
    setTimeout(() => {
      progress.value = 0
      statusText.value = ''
    }, 2000)
  }
}

const showNotification = (message, type = 'success') => {
  popupMessage.value = message
  popupType.value = type
  showPopup.value = true
   if (type === 'success' && message.includes('Conversion successful')) {
    trackToolUsage('pdf_to_ppt', 'download');
  }
  setTimeout(() => {
    showPopup.value = false
  }, 6000)
}

const closePopup = () => {
  showPopup.value = false
}

const selectAspectRatio = (ratio) => {
  conversionSettings.value.aspectRatio = ratio
  showNotification(`Aspect ratio set to: ${aspectRatioOptions.find(r => r.id === ratio)?.name}`, 'info')
    trackToolUsage('pdf_to_ppt', 'set_aspect_ratio', { aspect_ratio: ratio });

}

const selectQuality = (quality) => {
  conversionSettings.value.imageQuality = quality.id
  conversionSettings.value.dpi = quality.dpi
  showNotification(`Quality set to: ${quality.name} (${quality.dpi} DPI)`, 'info')
    trackToolUsage('pdf_to_ppt', 'set_quality', { quality: quality.id, dpi: quality.dpi });

}

const updateStatusText = (progressValue) => {
  const messages = [
    { min: 0, max: 15, text: 'Analyzing PDF structure...' },
    { min: 15, max: 30, text: 'Detecting aspect ratio...' },
    { min: 30, max: 50, text: 'Converting pages to images...' },
    { min: 50, max: 70, text: 'Optimizing slide layout...' },
    { min: 70, max: 85, text: 'Preserving aspect ratio...' },
    { min: 85, max: 95, text: 'Creating PowerPoint slides...' },
    { min: 95, max: 100, text: 'Finalizing presentation...' }
  ]
  
  const message = messages.find(m => progressValue >= m.min && progressValue <= m.max)
  if (message) statusText.value = message.text
}
</script>

<template>
  <div class="converter">
    <!-- Popup Notification -->
    <div v-if="showPopup" class="popup-notification" :class="popupType">
      <div class="popup-content">
        <span class="popup-icon">{{ popupType === 'success' ? '✅' : '❌' }}</span>
        <div class="popup-message">
          <span v-html="popupMessage.replace(/\n/g, '<br>')"></span>
        </div>
        <button class="popup-close" @click="closePopup">✕</button>
      </div>
      <div class="popup-progress"></div>
    </div>

    <h2 style="margin: 0;">📊 PDF to PowerPoint Converter</h2>
    <!-- File Upload -->
    <label class="upload-box">
      <input type="file" accept=".pdf" @change="selectFile" hidden />
      <div class="upload-content">
        <p><strong>Drag & drop</strong> or click to upload PDF</p>
        <small class="file-info">{{ file ? file.name : 'No file selected' }}</small>
        <small>Max size: 100MB • Supports all PDF formats</small>
      </div>
    </label>



    <!-- Conversion Button -->
    <button 
      class="convert-btn" 
      @click="convertPdfToPpt" 
      :disabled="loading || !file"
      :class="{ loading: loading }"
    >
      <span v-if="loading">
        <span class="spinner">⟳</span> 
        Converting... {{ progress.toFixed(0) }}%
      </span>
      <span v-else>
        Convert to PowerPoint
      </span>
    </button>

    <!-- Progress Bar -->
    <div v-if="loading" class="progress-container">
      <div class="progress-info">
        <span class="status">{{ statusText }}</span>
        <span class="percentage">{{ progress.toFixed(0) }}%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progress + '%' }"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.converter {
  max-width: 800px;
  margin: 0 auto;
  padding: 30px 20px;
}

/* Popup */
.popup-notification {
  position: fixed;
  top: 60px;
  right: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  animation: slideIn 0.3s ease;
  overflow: hidden;
  border-left: 5px solid;
  max-width: 400px;
}

.popup-notification.success {
  border-left-color: #10b981;
  background: linear-gradient(135deg, #f0fdf4, #dcfce7);
}

.popup-notification.error {
  border-left-color: #ef4444;
  background: linear-gradient(135deg, #fef2f2, #fee2e2);
}

.popup-notification.info {
  border-left-color: #3b82f6;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
}

.popup-content {
  padding: 20px;
  display: flex;
  align-items: flex-start;
  gap: 15px;
}

.popup-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.popup-message {
  flex: 1;
  font-size: 14px;
  line-height: 1.5;
}

.popup-close {
  background: none;
  border: none;
  cursor: pointer;
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
  background: rgba(0, 0, 0, 0.1);
}

.popup-progress {
  height: 3px;
  background: linear-gradient(90deg, #10b981, #34d399);
  animation: progress 6s linear forwards;
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

@keyframes progress {
  from { width: 100%; }
  to { width: 0%; }
}

/* Upload */
.upload-box {
  border-radius: 16px;
  padding: 50px 30px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  margin: 30px 0;
  
}

.upload-content .icon {
  font-size: 56px;
  display: block;
  margin-bottom: 15px;
}

.file-info {
  display: block;
  color: #ee6c4d;
  font-size: 15px;
}

/* Settings Panel */
.settings-panel {
  background: white;
  border-radius: 16px;
  padding: 30px;
  margin: 30px 0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e5e7eb;
}

.settings-panel h3 {
  margin: 0 0 25px 0;
  color: #1f2937;
  font-size: 20px;
  text-align: center;
}

.setting-group {
  margin-bottom: 30px;
}

.setting-group h4 {
  margin: 0 0 10px 0;
  color: #374151;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.setting-description {
  margin: 0 0 15px 0;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.5;
}

.ratio-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ratio-option {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 18px 20px;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.ratio-option:hover {
  border-color: #3b82f6;
  background: #eff6ff;
  transform: translateY(-2px);
}

.ratio-option.selected {
  border-color: #3b82f6;
  background: #eff6ff;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.ratio-icon {
  font-size: 28px;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 12px;
  flex-shrink: 0;
}

.ratio-info {
  flex: 1;
  text-align: left;
}

.ratio-info strong {
  display: block;
  font-size: 15px;
  color: #1f2937;
  margin-bottom: 4px;
}

.ratio-info span {
  display: block;
  font-size: 13px;
  color: #6b7280;
  line-height: 1.4;
}

.ratio-check {
  font-size: 20px;
  color: #10b981;
  opacity: 0;
  transition: opacity 0.3s;
}

.ratio-option.selected .ratio-check {
  opacity: 1;
}

.quality-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
}

.quality-option {
  padding: 20px;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  text-align: center;
  transition: all 0.3s;
}

.quality-option:hover {
  border-color: #ee6c4d;
  background: #eff6ff;
 
}

.quality-option.selected {
  border-color: #ee6c4d;
  background: #eff6ff;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.quality-level {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
  font-size: 14px;
}

.quality-dpi {
  font-size: 18px;
  font-weight: 700;
  color: #ee6c4d;
  margin-bottom: 8px;
}

.quality-desc {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.4;
}

/* Additional Options */
.additional-options {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.checkbox-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px;
  background: #f9fafb;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s;
}

.checkbox-option:hover {
  background: #f3f4f6;
}

.checkbox-option input[type="checkbox"] {
  width: 20px;
  height: 20px;
  accent-color: #ee6c4d;
  cursor: pointer;
}

.checkbox-option span {
  font-size: 14px;
  color: #374151;
  flex: 1;
}

.convert-btn {
  width: 85%;
  padding: 10px 15px;
  background: #ee6c4d;
  color: white;
  border: none;
  border-radius: 14px;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s;
  margin: 10px 0;
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
  position: relative;
  overflow: hidden;
}

.convert-btn:hover:not(:disabled) {
  box-shadow: 0 12px 30px rgba(59, 130, 246, 0.4);
  background: #ee6c4d;
}

.convert-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.convert-btn.loading {
  background: linear-gradient(135deg, #6b7280, #4b5563);
}

.spinner {
  display: inline-block;
  margin-right: 10px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Progress */
.progress-container {
  margin-block: 15px;
  max-width: 599px;
  margin: auto;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 14px;
}

.progress-info .status {
  color: #374151;
  font-weight: 500;
}

.progress-info .percentage {
  color: green;
  font-weight: 400;
}

.progress-bar {
  height: 10px;
  background: #e5e7eb;
  border-radius: 5px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: green;
  border-radius: 5px;
  transition: width 0.3s ease;
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

@keyframes shimmer {
  100% { left: 100%; }
}

/* Tips */
.tips-box {
  background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
  border: 1px solid #bae6fd;
  border-radius: 16px;
  padding: 25px;
  margin-top: 30px;
}

.tips-box h4 {
  margin: 0 0 15px 0;
  color: #0369a1;
  font-size: 17px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tips-box ul {
  margin: 0;
  padding-left: 20px;
}

.tips-box li {
  margin-bottom: 10px;
  color: #0c4a6e;
  font-size: 14px;
  line-height: 1.5;
}

.tips-box li:last-child {
  margin-bottom: 0;
}

.tips-box strong {
  color: #0369a1;
}

/* Responsive */
@media (max-width: 768px) {
  .converter {
    padding: 20px 15px;
  }
  
  .upload-box {
    padding: 30px 20px;
  }
  
  .settings-panel {
    padding: 20px;
  }
  
  .quality-options {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .ratio-option {
    padding: 15px;
  }
  
  .popup-notification {
    left: 20px;
    right: 20px;
    max-width: none;
  }
}
</style>