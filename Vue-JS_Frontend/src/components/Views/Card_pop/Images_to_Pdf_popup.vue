<script setup>
import { ref } from 'vue'

const files = ref([])
const loading = ref(false)
const progress = ref(0)
const statusText = ref('')
const showSuccessPopup = ref(false)

const selectFiles = (e) => {
  files.value = Array.from(e.target.files)
}

const closePopup = () => {
  showSuccessPopup.value = false
}

const imagesToPdf = async () => {
  if (!files.value.length) {
    alert('Please select JPG or PNG images')
    return
  }

  loading.value = true
  progress.value = 0
  statusText.value = 'Starting conversion...'
  showSuccessPopup.value = false

  const formData = new FormData()
  files.value.forEach(file => {
    formData.append('images', file)
  })

  let fakeProgress = null

  try {
    // Enhanced progress simulation
    fakeProgress = setInterval(() => {
      if (progress.value < 95) {
        progress.value += 2
        if (progress.value < 30) {
          statusText.value = `Uploading images... ${Math.round(progress.value)}%`
        } else if (progress.value < 60) {
          statusText.value = `Processing... ${Math.round(progress.value)}%`
        } else if (progress.value < 85) {
          statusText.value = `Creating PDF... ${Math.round(progress.value)}%`
        } else {
          statusText.value = `Finalizing... ${Math.round(progress.value)}%`
        }
      }
    }, 100)

    const res = await fetch('http://192.168.18.101:3000/api/image-to-pdf', {
      method: 'POST',
      body: formData
    })

    clearInterval(fakeProgress)
    progress.value = 100
    statusText.value = 'Conversion complete!'

    if (!res.ok) throw new Error('Failed')

    const blob = await res.blob()
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = 'images.pdf'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    // Show success popup
    showSuccessPopup.value = true
    
    // Keep the files in the list until user closes popup
    statusText.value = 'PDF created successfully'

  } catch (e) {
    console.error(e)
    statusText.value = 'Conversion failed'
    alert('Conversion failed')
  } finally {
    clearInterval(fakeProgress)
    setTimeout(() => {
      loading.value = false
      setTimeout(() => {
        progress.value = 0
        if (!showSuccessPopup.value) {
          statusText.value = ''
        }
      }, 1000)
    }, 1500)
  }
}
</script>

<template>
  <div class="converter">
    <h2>JPG / PNG to PDF</h2>
    <p class="subtitle">Convert images into a single PDF file</p>

    <label class="upload-box">
      <input
        type="file"
        accept="image/jpeg,image/png"
        multiple
        hidden
        @change="selectFiles"
        name="images"
      />
      <div class="upload-content">
        <span class="icon">🖼️➡️📄</span>
        <p><strong>Click to upload</strong> images</p>
        <small>
          {{ files.length ? files.length + ' files selected' : 'No files selected' }}
        </small>
      </div>
    </label>

    <button 
      class="merge-btn" 
      @click="imagesToPdf" 
      :disabled="loading || files.length === 0"
      :class="{ 'loading': loading }"
    >
      <template v-if="loading">
        Converting... {{ Math.round(progress) }}%
      </template>
      <template v-else>
        Convert to PDF
      </template>
    </button>

    <div v-if="loading" class="progress-container">
      <p class="status-text">{{ statusText }}</p>
      <div class="progress-wrapper">
        <div class="progress-bar" :style="{ width: progress + '%' }"></div>
      </div>
    </div>

    <p v-if="statusText && !loading" class="status-message">{{ statusText }}</p>

    <!-- Success Popup -->
    <div v-if="showSuccessPopup" class="popup-overlay" @click="closePopup">
      <div class="popup-content" @click.stop>
        <div class="popup-icon">🎉</div>
        <h3>Success!</h3>
        <p>Your images have been converted to PDF successfully.</p>
        <p class="popup-details">
          {{ files.length }} image{{ files.length > 1 ? 's' : '' }} converted
        </p>
        <div class="popup-buttons">
          <button class="popup-btn" @click="files.value = []; closePopup()">
            Convert More
          </button>
          <button class="popup-btn secondary" @click="closePopup">
            OK
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.converter {
  text-align: center;
}

.converter h2 {
  font-size: 22px;
  margin-bottom: 4px;
}

.subtitle {
  font-size: 14px;
  color: #666;
  margin-bottom: 20px;
}

.upload-box {
  display: block;
  border: 2px dashed #aaa;
  border-radius: 12px;
  padding: 30px 20px;
  cursor: pointer;
  background: #f9f9f9;
  transition: all 0.3s ease;
  margin-bottom: 20px;
}

.upload-box:hover {
  border-color: rgb(238, 108, 77);
  background: #fff5f3;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(238, 108, 77, 0.1);
}

.upload-content .icon {
  font-size: 36px;
  margin-bottom: 10px;
  display: block;
}

.upload-content p {
  margin: 0 0 5px 0;
  color: #333;
}

.upload-content small {
  color: #666;
  font-size: 13px;
}

.merge-btn {
  width: 100%;
  padding: 14px;
  margin-top: 20px;
  border-radius: 10px;
  border: none;
  background: rgb(238, 108, 77);
  color: #fff;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.merge-btn:hover:not(:disabled) {
  background: rgb(220, 95, 65);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(238, 108, 77, 0.3);
}

.merge-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.merge-btn.loading {
  background: linear-gradient(90deg, rgb(238, 108, 77), rgb(255, 140, 100));
}

.progress-container {
  margin-top: 25px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 12px;
}

.status-text {
  margin-bottom: 10px;
  font-size: 14px;
  color: #444;
  font-weight: 500;
  min-height: 20px;
}

.progress-wrapper {
  height: 10px;
  background: #e9ecef;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, rgb(238, 108, 77), rgb(255, 140, 100));
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

.status-message {
  margin-top: 15px;
  font-size: 14px;
  color: #107667;
  font-weight: 500;
  padding: 10px;
  background: #eef7f5;
  border-radius: 8px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
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

.popup-content {
  background: white;
  border-radius: 16px;
  padding: 30px;
  width: 90%;
  max-width: 400px;
  text-align: center;
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

.popup-icon {
  font-size: 48px;
  margin-bottom: 15px;
  animation: bounce 0.5s ease;
}

@keyframes bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

.popup-content h3 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 20px;
}

.popup-content p {
  margin: 0 0 15px 0;
  color: #666;
  font-size: 15px;
  line-height: 1.5;
}

.popup-details {
  background: #f8f9fa;
  padding: 10px;
  border-radius: 8px;
  font-weight: 500;
  color: rgb(238, 108, 77) !important;
  margin-bottom: 25px !important;
}

.popup-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.popup-btn {
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  background: rgb(238, 108, 77);
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
}

.popup-btn:hover {
  background: rgb(220, 95, 65);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(238, 108, 77, 0.3);
}

.popup-btn.secondary {
  background: #6c757d;
}

.popup-btn.secondary:hover {
  background: #5a6268;
  box-shadow: 0 4px 12px rgba(108, 117, 125, 0.3);
}
</style>