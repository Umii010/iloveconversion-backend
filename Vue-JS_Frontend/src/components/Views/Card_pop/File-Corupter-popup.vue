<!-- FileCorruptorPopup.vue -->
<template>
  <div class="corruptor">
    <h2>⚡ File Corruptor</h2>

    <!-- Upload Area -->
    <label v-if="!file" class="upload-box" @dragover.prevent @drop.prevent="selectFile">
      <input
        type="file"
        :accept="acceptedTypes"
        @change="selectFile"
        hidden
      />
      <div class="upload-content">
        <p style="margin: 0;"><strong>Choose file to corrupt</strong></p>
        <small>Supported: {{ supportedFormats }}</small>
        <div class="file-types">
          <span class="file-type-badge">PDF</span>
          <span class="file-type-badge">DOCX</span>
          <span class="file-type-badge">XLSX</span>
          <span class="file-type-badge">ZIP</span>
          <span class="file-type-badge">MP3</span>
          <span class="file-type-badge">JPEG</span>
        </div>
      </div>
    </label>

    <!-- Corruption Button -->
     <div style="display: flex; justify-content: center;">
    <button 
      class="corrupt-btn" 
      @click="corruptFile" 
      :disabled="loading || !file"
      :class="{ 
        'loading': loading, 
        'disabled': !file,
        'danger': file
      }"
    >
      <span v-if="!loading">
         Corrupt File
      </span>
      <span v-else>
        <span class="spinner"></span> Corrupting...
      </span>
    </button></div>

    <!-- Confirmation Dialog -->
    <div v-if="showConfirmation" class="confirmation-overlay">
      <div class="confirmation-dialog">
        <div class="confirmation-header">
          <h3 style="margin: 0;">Final Warning ?</h3>
        </div>
        
        <div class="confirmation-content">
          <p style="margin: 0;">You are about to <strong>PERMANENTLY CORRUPT</strong>:</p>
          <div class="file-to-corrupt">
            <span class="file-icon">{{ getFileIcon(file.type) }}</span>
            <div>
              <strong>{{ file.name }}</strong><br>
              <small>{{ formatBytes(file.size) }}</small>
            </div>
          </div>
          
          <div class="corruption-details">
            <p><strong>Result:</strong> File will be UNUSABLE</p>
          </div>
          
          <p class="final-warning">THIS ACTION CANNOT BE UNDONE!</p>
        </div>
        
        <div class="confirmation-actions">
          <button class="cancel-btn" @click="showConfirmation = false">Cancel</button>
          <button class="confirm-btn" @click="proceedWithCorruption">Yes, Corrupt It!</button>
        </div>
      </div>
    </div>

    <!-- Progress Section -->
    <div v-if="loading" class="progress-section">
      <div class="progress-header">
        <span class="corrupt-method">{{ corruptionMethod.toUpperCase() }}</span>
      </div>
      
      <div class="progress-container">
        <div class="progress-bar" :style="{ width: progress + '%' }">
          <span class="progress-text">{{ Math.round(progress) }}%</span>
        </div>
      </div>
      
      <p class="status-text">{{ statusText }}</p>
      
      <div class="progress-steps">
        <div class="step" :class="{ active: progress >= 0 }">Reading</div>
        <div class="step" :class="{ active: progress >= 30 }">Applying Corruption</div>
        <div class="step" :class="{ active: progress >= 70 }">Finalizing</div>
      </div>
    </div>

    <!-- Success Popup -->
    <div v-if="showSuccess" class="popup-overlay">
      <div class="success-popup">
        <div class="popup-content">
          <div class="corruption-result">
        
            <div class="result-item">
              <div class="download-link">
                <a :href="corruptedFileUrl" :download="'CORRUPTED_' + file?.name" class="download-btn">
                   Download Corrupted File
                </a>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const file = ref(null)
const loading = ref(false)
const progress = ref(0)
const statusText = ref('')
const showConfirmation = ref(false)
const showSuccess = ref(false)
const corruptionMethod = ref('header')
const intensity = ref(50)
const corruptedFileUrl = ref('')

const acceptedTypes = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.7z,.tar,.mp3,.mp4,.avi,.wav,.jpg,.jpeg,.png,.txt,.csv,.rtf'
const supportedFormats = 'PDF, Word, Excel, ZIP, MP3, Images, etc.'

const getFileIcon = (fileType) => {
  const typeMap = {
    'pdf': '📄',
    'word': '📝',
    'excel': '📊',
    'archive': '📦',
    'audio': '🎵',
    'video': '🎬',
    'image': '🖼️',
    'text': '📃'
  }
  
  if (fileType.includes('pdf')) return '📄'
  if (fileType.includes('word') || fileType.includes('document')) return '📝'
  if (fileType.includes('excel') || fileType.includes('sheet')) return '📊'
  if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('archive')) return '📦'
  if (fileType.includes('audio')) return '🎵'
  if (fileType.includes('video')) return '🎬'
  if (fileType.includes('image')) return '🖼️'
  return '📁'
}

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const selectFile = (e) => {
  const selectedFile = e.target.files?.[0] || e.dataTransfer?.files?.[0]
  if (selectedFile) {
    file.value = selectedFile
    corruptionMethod.value = 'header'
    intensity.value = 50
  }
}

const corruptFile = () => {
  showConfirmation.value = true
}

const proceedWithCorruption = async () => {
  showConfirmation.value = false
  loading.value = true
  progress.value = 0
  statusText.value = 'Initializing corruption...'

  const formData = new FormData()
  formData.append('file', file.value)
  formData.append('method', corruptionMethod.value)
  formData.append('intensity', intensity.value.toString())

  try {
    const progressInterval = setInterval(() => {
      if (progress.value < 90) {
        progress.value += 10
        statusText.value = getStatusMessage(progress.value)
      }
    }, 300)

    const res = await fetch('http://192.168.18.101:3000/api/corrupt-file', {
      method: 'POST',
      body: formData
    })

    clearInterval(progressInterval)

    if (!res.ok) {
      throw new Error('Corruption failed')
    }

    progress.value = 100
    statusText.value = 'Corruption complete!'

    const blob = await res.blob()
    corruptedFileUrl.value = URL.createObjectURL(blob)

    setTimeout(() => {
      showSuccess.value = true
      loading.value = false
    }, 1000)

  } catch (err) {
    console.error('Corruption error:', err)
    statusText.value = `Error: ${err.message}`
    loading.value = false
  }
}

const getStatusMessage = (progress) => {
  if (progress < 30) return 'Reading file structure...'
  if (progress < 50) return 'Identifying vulnerable areas...'
  if (progress < 70) return `Applying ${corruptionMethod.value} corruption...`
  if (progress < 90) return 'Finalizing damage...'
  return 'Corruption complete!'
}

const closeSuccess = () => {
  showSuccess.value = false
  file.value = null
  progress.value = 0
  statusText.value = ''
  if (corruptedFileUrl.value) {
    URL.revokeObjectURL(corruptedFileUrl.value)
    corruptedFileUrl.value = ''
  }
}
</script>

<style scoped>
.corruptor {
  max-width: 600px;
  margin: 0 auto;
  padding: 10px;
}

.warning-alert {
  background: linear-gradient(135deg, #ff6b6b 0%, #c92a2a 100%);
  color: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 25px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.9; }
  100% { opacity: 1; }
}

.warning-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.warning-icon {
  font-size: 24px;
}

.warning-content ul {
  margin: 10px 0;
  padding-left: 20px;
}

.warning-content li {
  margin: 5px 0;
}

.warning-note {
  font-weight: bold;
  font-size: 16px;
  margin-top: 15px;
  text-align: center;
  background: rgba(255, 255, 255, 0.2);
  padding: 8px;
  border-radius: 6px;
}

/* Corruption Options */
.corrupt-options {
  margin: 25px 0;
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin: 20px 0;
}

.option-card {
  background: #f8f9fa;
  border: 2px solid #dee2e6;
  border-radius: 10px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.option-card:hover {
  border-color: #6c757d;
  transform: translateY(-2px);
}

.option-card.selected {
  border-color: #ff6b6b;
  background: #fff5f5;
}

.option-icon {
  font-size: 24px;
  display: block;
  margin-bottom: 10px;
}

.option-content strong {
  display: block;
  margin-bottom: 5px;
  font-size: 14px;
}

.option-content small {
  font-size: 12px;
  color: #6c757d;
}

.option-effects {
  margin-top: 10px;
  font-size: 11px;
  color: #495057;
}

.option-effects span {
  display: block;
  margin: 2px 0;
}

/* Intensity Slider */
.intensity-slider {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
  margin-top: 25px;
}

.slider-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  font-weight: 600;
}

.intensity-value {
  color: #ff6b6b;
  font-weight: bold;
  font-size: 18px;
}

.slider {
  width: 100%;
  height: 8px;
  -webkit-appearance: none;
  background: linear-gradient(90deg, #28a745, #ffc107, #fd7e14, #ff6b6b);
  border-radius: 4px;
  outline: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #212529;
  cursor: pointer;
  border: 3px solid #ff6b6b;
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: #6c757d;
}

/* Upload Area */
.upload-box {
  display: block;
  border: 2px dashed #aaa;
  border-radius: 12px;
  padding: 10px 5px;
  cursor: pointer;
  background: #f9f9f9;
  transition: all 0.3s ease;
  margin: 10px 0;
}

.upload-box:hover {
  border-color: #ff6b6b;
  background: #fff5f5;
}

.upload-content {
  text-align: center;
}

.upload-content .icon {
  font-size: 40px;
  display: block;
  margin-bottom: 15px;
}

.file-types {
  margin-top: 15px;
}

.file-type-badge {
  display: inline-block;
  background: #e9ecef;
  padding: 4px 10px;
  margin: 3px;
  border-radius: 15px;
  font-size: 12px;
  font-weight: 500;
}

/* Corrupt Button */
.corrupt-btn {
  width: 100%;
  padding: 10px;
  font-size: 15px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  background: linear-gradient(135deg, #ff6b6b 0%, #c92a2a 100%);
  color: white;
  transition: all 0.3s ease;
}

.corrupt-btn:hover:not(:disabled) {
  box-shadow: 0 10px 30px rgba(255, 107, 107, 0.4);
}

.corrupt-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

@keyframes danger-pulse {
  0% { box-shadow: 0 0 0 0 rgba(255, 107, 107, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(255, 107, 107, 0); }
  100% { box-shadow: 0 0 0 0 rgba(255, 107, 107, 0); }
}

/* Confirmation Dialog */
.confirmation-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.confirmation-dialog {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  overflow: hidden;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateY(-50px) scale(0.9);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

.confirmation-header {
  background: linear-gradient(135deg, #ff6b6b 0%, #c92a2a 100%);
  color: white;
  padding: 10px;
  text-align: center;
}

.confirmation-icon {
  font-size: 40px;
  display: block;
  margin-bottom: 10px;
}

.confirmation-content {
  padding: 10px;
}

.file-to-corrupt {
  display: flex;
  align-items: center;
  gap: 15px;
  background: #f8f9fa;
  padding: 5px;
  border-radius: 8px;
  margin: 5px 0;
}

.file-to-corrupt .file-icon {
  font-size: 16px;
}

.corruption-details {
  background: #fff5f5;
  padding: 5px;
  border-radius: 8px;
  margin: 5px 0;
}

.corruption-details p {
  margin: 8px 0;
}

.final-warning {
  text-align: center;
  font-size: 14px;
  color: #ff6b6b;
  margin: 5px 0;
  padding: 5px;
  background: rgba(255, 107, 107, 0.1);
  border-radius: 8px;
}

.confirmation-actions {
  display: flex;
  gap: 15px;
  padding: 5px;
  border-top: 1px solid #dee2e6;
}

.cancel-btn, .confirm-btn {
  flex: 1;
  padding: 10px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn {
  background: #6c757d;
  color: white;
}

.cancel-btn:hover {
  background: #5a6268;
}

.confirm-btn {
  background: linear-gradient(135deg, #ff6b6b 0%, #c92a2a 100%);
  color: white;
}

.confirm-btn:hover {
  opacity: 0.9;
  transform: translateY(-2px);
}

/* Progress Steps */
.progress-steps {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
  position: relative;
}

.progress-steps::before {
  content: '';
  position: absolute;
  top: 15px;
  left: 0;
  right: 0;
  height: 3px;
  background: #e9ecef;
  z-index: 1;
}

.step {
  position: relative;
  z-index: 2;
  background: #e9ecef;
  padding: 8px 15px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  color: #6c757d;
  transition: all 0.3s ease;
}

.step.active {
  background: #ff6b6b;
  color: white;
  box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
}

/* Success Popup */
.popup-header.danger {
  background: linear-gradient(135deg, #212529 0%, #343a40 100%);
}

.success-icon {
  font-size: 24px;
}

.download-btn[data-v-1a468976] {
    justify-content: center;
    display: flex;
    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
    color: white;
    padding: 12px 25px;
    border-radius: 8px;
    text-decoration: none;
    margin-top: 5px;
    transition: all 0.3s ease;
}

.download-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(40, 167, 69, 0.3);
}

.corruption-tips {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-top: 20px;
  font-size: 14px;
}

.corruption-tips ul {
  margin: 10px 0;
  padding-left: 20px;
}

.corruption-tips li {
  margin: 5px 0;
  color: #495057;
}

/* Responsive */
@media (max-width: 768px) {
  .options-grid {
    grid-template-columns: 1fr;
  }
  
}
</style>