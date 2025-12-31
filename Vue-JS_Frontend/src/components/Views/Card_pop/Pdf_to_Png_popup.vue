<script setup>
import { ref } from 'vue'

const file = ref(null)
const loading = ref(false)
const progress = ref(0)
const statusText = ref('')
const showSuccessPopup = ref(false)
const popupMessage = ref('')

const selectFile = (e) => {
  file.value = e.target.files[0]
}

const closePopup = () => {
  showSuccessPopup.value = false
}

const pdfToPng = async () => {
  if (!file.value) {
    alert('Please select a PDF file')
    return
  }

  loading.value = true
  progress.value = 0
  statusText.value = 'Starting conversion...'
  showSuccessPopup.value = false

  const formData = new FormData()
  formData.append('file', file.value)

  let fakeProgress = null

  try {
    // Better fake progress with realistic stages
    fakeProgress = setInterval(() => {
      if (progress.value < 95) {
        // Faster progress in beginning, slower toward end
        const increment = progress.value < 70 ? 2 : 1
        progress.value += increment
        
        // Update status text based on progress
        if (progress.value < 20) {
          statusText.value = `Uploading PDF... ${Math.round(progress.value)}%`
        } else if (progress.value < 50) {
          statusText.value = `Processing pages... ${Math.round(progress.value)}%`
        } else if (progress.value < 80) {
          statusText.value = `Converting to images... ${Math.round(progress.value)}%`
        } else {
          statusText.value = `Finalizing conversion... ${Math.round(progress.value)}%`
        }
      }
    }, 100)

    const res = await fetch('http://192.168.18.101:3000/api/pdf-to-png', {
      method: 'POST',
      body: formData
    })

    clearInterval(fakeProgress)
    progress.value = 100
    statusText.value = 'Conversion complete!'

    if (!res.ok) {
      throw new Error('Conversion failed')
    }

    // Get file info from headers
    const originalFileName = res.headers.get('X-Original-Filename') || file.value.name
    const pageCount = res.headers.get('X-Page-Count')
    const isZip = res.headers.get('Content-Type')?.includes('application/zip')
    
    // Set success message
    if (pageCount && parseInt(pageCount) > 1) {
      popupMessage.value = `Successfully converted ${pageCount} pages to PNG images!`
    } else {
      popupMessage.value = 'PDF converted to PNG successfully! <br> Thanks for using our service.'
    }

    const blob = await res.blob()
    const url = URL.createObjectURL(blob)

    // Determine download name
    let downloadName = ''
    if (isZip) {
      downloadName = originalFileName.replace(/\.pdf$/i, '_converted.zip')
    } else {
      downloadName = originalFileName.replace(/\.pdf$/i, '.png')
    }

    // Create and trigger download
    const a = document.createElement('a')
    a.href = url
    a.download = downloadName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    // Show success popup
    showSuccessPopup.value = true

    // Reset input after download
    file.value = null
    const input = document.querySelector('input[type="file"]')
    if (input) input.value = ''

  } catch (err) {
    console.error('Conversion error:', err)
    statusText.value = 'Conversion failed'
    popupMessage.value = '❌ Conversion failed. Please try again.'
    showSuccessPopup.value = true
  } finally {
    clearInterval(fakeProgress)
    // Keep progress at 100% briefly before resetting
    setTimeout(() => {
      loading.value = false
      setTimeout(() => {
        progress.value = 0
        statusText.value = ''
      }, 1000)
    }, 1500)
  }
}
</script>

<template>
  <div class="converter">
    <h2>PDF to PNG</h2>
    <p class="subtitle">Convert PDF pages into high-quality PNG images</p>

    <label class="upload-box">
      <input
        type="file"
        accept="application/pdf"
        @change="selectFile"
        hidden
      />
      <div class="upload-content">
        <span class="icon">📄➡️🖼️</span>
        <p><strong>Click to upload</strong> a PDF file</p>
        <small>{{ file ? file.name : 'No file selected' }}</small>
        <small v-if="file" class="file-size">
          Size: {{ (file.size / 1024 / 1024).toFixed(2) }} MB
        </small>
      </div>
    </label>

    <button 
      class="convert-btn" 
      @click="pdfToPng" 
      :disabled="loading || !file"
      :class="{ 'loading': loading }"
    >
      <span v-if="loading">Converting... {{ Math.round(progress) }}%</span>
      <span v-else>Convert to PNG</span>
    </button>

    <!-- Progress Section -->
    <div v-if="loading" class="progress-container">
      <p class="status-text">{{ statusText }}</p>
      <div class="progress-wrapper">
        <div class="progress-bar" :style="{ width: progress + '%' }"></div>
      </div>
      <div class="progress-details">
        <span class="progress-percent">{{ Math.round(progress) }}%</span>
        <span class="progress-estimate" v-if="progress < 90">
          {{ progress < 50 ? 'About 15-30 seconds remaining' : 'Almost done...' }}
        </span>
      </div>
    </div>

    <!-- Success Popup -->
    <div v-if="showSuccessPopup" class="popup-overlay" @click="closePopup">
      <div class="popup-content" @click.stop>
        <div class="popup-header">
          <h3>Conversion Complete</h3>
          <button class="close-btn" @click="closePopup">×</button>
        </div>
        <div class="popup-body">
          <div class="success-icon">🎉</div>
          <p>{{ popupMessage }}</p>
          <p class="popup-note">
            Your file has been downloaded automatically.
            <br>
            Check your downloads folder for the converted file.
          </p>
        </div>
        <div class="popup-footer">
          <button class="popup-btn" @click="closePopup">OK</button>
          <button 
            class="popup-btn secondary" 
            @click="file = null; closePopup()"
            v-if="file"
          >
            Convert Another File
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.converter {
  text-align: center;
  position: relative;
}

.converter h2 {
  font-size: 22px;
  margin-bottom: 4px;
  color: #333;
}

.subtitle {
  font-size: 14px;
  color: #666;
  margin-bottom: 25px;
}

.upload-box {
  display: block;
  border: 2px dashed #aaa;
  border-radius: 12px;
  padding: 35px 20px;
  cursor: pointer;
  background: #f9f9f9;
  transition: all 0.3s ease;
  margin-bottom: 20px;
}

.upload-box:hover {
  border-color: #107667;
  background: #eef7f5;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.upload-content .icon {
  font-size: 42px;
  margin-bottom: 15px;
  display: block;
}

.upload-content p {
  margin: 8px 0;
  color: #333;
  font-size: 16px;
}

.upload-content small {
  display: block;
  color: #666;
  font-size: 13px;
  margin-top: 5px;
}

.file-size {
  color: #107667;
  font-weight: 500;
  margin-top: 8px !important;
}

.convert-btn {
  width: 100%;
  padding: 14px;
  margin-top: 20px;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.convert-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(106, 17, 203, 0.3);
}

.convert-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.convert-btn.loading {
  background: linear-gradient(135deg, #2575fc 0%, #6a11cb 100%);
}

/* Progress Container */
.progress-container {
  margin-top: 25px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.status-text {
  margin-bottom: 15px;
  font-size: 15px;
  color: #333;
  font-weight: 500;
  min-height: 24px;
}

.progress-wrapper {
  height: 12px;
  background: #e9ecef;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #6a11cb, #2575fc);
  transition: width 0.3s ease;
  position: relative;
}

.progress-bar::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.progress-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  font-size: 13px;
}

.progress-percent {
  color: #6a11cb;
  font-weight: 600;
  font-size: 14px;
}

.progress-estimate {
  color: #666;
  font-style: italic;
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
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.popup-content {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 400px;
  overflow: hidden;
  animation: slideUp 0.3s ease;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.popup-header {
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  color: white;
  padding: 20px;
  position: relative;
}

.popup-header h3 {
  margin: 0;
  font-size: 18px;
}

.close-btn {
  position: absolute;
  top: 15px;
  right: 20px;
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.3s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.popup-body {
  padding: 30px 20px;
  text-align: center;
}

.success-icon {
  font-size: 48px;
  margin-bottom: 20px;
  animation: bounce 0.5s ease;
}

@keyframes bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

.popup-body p {
  margin: 10px 0;
  color: #333;
  font-size: 15px;
  line-height: 1.5;
}

.popup-note {
  color: #666;
  font-size: 13px;
  margin-top: 20px !important;
  line-height: 1.6;
  background: #f8f9fa;
  padding: 12px;
  border-radius: 8px;
}

.popup-footer {
  padding: 20px;
  display: flex;
  gap: 10px;
  justify-content: center;
  border-top: 1px solid #e9ecef;
}

.popup-btn {
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 100px;
}

.popup-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(106, 17, 203, 0.3);
}

.popup-btn.secondary {
  background: #6c757d;
  color: white;
}

.popup-btn.secondary:hover {
  background: #5a6268;
  box-shadow: 0 4px 12px rgba(108, 117, 125, 0.3);
}
</style>