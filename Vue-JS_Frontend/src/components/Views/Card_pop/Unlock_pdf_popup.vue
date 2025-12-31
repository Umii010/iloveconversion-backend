<script setup>
import { ref, computed } from 'vue'

const file = ref(null)
const password = ref('')
const loading = ref(false)
const progress = ref(0)
const statusText = ref('')
const showSuccessPopup = ref(false)
const showPasswordField = ref(false)
const popupMessage = ref('')

const selectFile = (e) => {
  file.value = e.target.files[0]
  password.value = ''
  showPasswordField.value = true
}

const closePopup = () => {
  showSuccessPopup.value = false
}

const unlockPdf = async () => {
  if (!file.value) {
    alert('Please select a PDF file')
    return
  }

  if (!password.value) {
    alert('Please enter PDF password')
    return
  }

  loading.value = true
  progress.value = 0
  statusText.value = 'Starting unlock process...'
  showSuccessPopup.value = false

  const formData = new FormData()
  formData.append('files', file.value)
  formData.append('password', password.value)

  let fakeProgress = null

  try {
    // Enhanced progress simulation
    fakeProgress = setInterval(() => {
      if (progress.value < 95) {
        progress.value += 2
        if (progress.value < 25) {
          statusText.value = `Uploading PDF... ${Math.round(progress.value)}%`
        } else if (progress.value < 50) {
          statusText.value = `Verifying password... ${Math.round(progress.value)}%`
        } else if (progress.value < 75) {
          statusText.value = `Removing protection... ${Math.round(progress.value)}%`
        } else {
          statusText.value = `Finalizing... ${Math.round(progress.value)}%`
        }
      }
    }, 100)

    const res = await fetch('http://192.168.18.101:3000/api/unlock-pdf', {
      method: 'POST',
      body: formData
    })

    clearInterval(fakeProgress)
    progress.value = 100
    statusText.value = 'Unlock complete!'

    if (!res.ok) throw new Error('Unlock failed')

    const blob = await res.blob()
    const url = URL.createObjectURL(blob)

    const fileName = file.value.name.replace(/\.pdf$/i, '-unlocked.pdf')

    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    // Show success popup
    showSuccessPopup.value = true
    popupMessage.value = '✅ PDF successfully unlocked!'
    statusText.value = 'PDF unlocked successfully'

  } catch (err) {
    console.error(err)
    statusText.value = 'Unlock failed'
    popupMessage.value = '❌ Invalid password or corrupted PDF'
    showSuccessPopup.value = true
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
    <h2>Unlock PDF</h2>
    <p class="subtitle">Remove password protection from PDF</p>

    <!-- File Upload -->
    <label class="upload-box">
      <input
        type="file"
        accept="application/pdf"
        name="files"
        hidden
        @change="selectFile"
      />
      <div class="upload-content">
        <span class="icon">🔓📄</span>
        <p><strong>Click to upload</strong> a protected PDF</p>
        <small>{{ file ? file.name : 'No file selected' }}</small>
        <small v-if="file" class="file-size">
          Size: {{ (file.size / 1024 / 1024).toFixed(2) }} MB
        </small>
      </div>
    </label>

    <!-- Password Field -->
    <div v-if="showPasswordField" class="password-section">
      <div class="input-wrapper">
        <label for="password">PDF Password</label>
        <div class="input-with-icon">
          <input
            id="password"
            type="password"
            placeholder="Enter the PDF password"
            v-model="password"
            :disabled="loading"
            @keyup.enter="unlockPdf"
          />
          <div class="input-hint">
            <small>Press Enter to unlock</small>
          </div>
        </div>
      </div>
    </div>

    <!-- Unlock Button -->
    <button 
      class="unlock-btn" 
      @click="unlockPdf" 
      :disabled="loading || !password || !file"
      :class="{ 
        'loading': loading,
        'disabled': !password || !file
      }"
    >
      <template v-if="loading">
        Unlocking... {{ Math.round(progress) }}%
      </template>
      <template v-else>
        🔓 Unlock PDF
      </template>
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
          {{ progress < 50 ? 'Verifying password...' : 'Almost done...' }}
        </span>
      </div>
    </div>

    <!-- Status Message -->
    <p v-if="statusText && !loading" class="status-message">{{ statusText }}</p>

    <!-- Result Popup -->
    <div v-if="showSuccessPopup" class="popup-overlay" @click="closePopup">
      <div class="popup-content" @click.stop>
        <button class="close-btn" @click="closePopup">×</button>
        <div class="popup-icon" :class="{ 'error': popupMessage.includes('❌') }">
          {{ popupMessage.includes('✅') ? '🔓' : '❌' }}
        </div>
        <h3>{{ popupMessage.includes('✅') ? 'PDF Unlocked!' : 'Unlock Failed' }}</h3>
        <p>{{ popupMessage.includes('✅') ? 'Your PDF is now accessible without password protection.' : 'Please check the password and try again.' }}</p>
        
        <div v-if="popupMessage.includes('✅')" class="success-details">
          <div class="detail-item">
            <span class="detail-label">File:</span>
            <span class="detail-value">{{ file?.name }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Status:</span>
            <span class="detail-value success">Unlocked 🔓</span>
          </div>
        </div>

        <div v-if="popupMessage.includes('❌')" class="error-tips">
          <p><strong>💡 Tips:</strong></p>
          <ul>
            <li>Check if the password is correct</li>
            <li>Ensure the PDF file is not corrupted</li>
            <li>Try with a different PDF if available</li>
          </ul>
        </div>

        <div class="popup-buttons">
          <button class="popup-btn" @click="closePopup">
            {{ popupMessage.includes('✅') ? 'OK' : 'Try Again' }}
          </button>
          <button 
            v-if="popupMessage.includes('✅')"
            class="popup-btn secondary" 
            @click="file = null; password = ''; showPasswordField = false; closePopup()"
          >
            Unlock Another
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

/* File Upload */
.upload-box {
  display: block;
  border: 2px dashed #aaa;
  border-radius: 12px;
  padding: 30px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #f9f9f9;
  margin-bottom: 25px;
}

.upload-box:hover {
  border-color: #9C27B0;
  background: #f3e5f5;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(156, 39, 176, 0.1);
}

.upload-content .icon {
  font-size: 36px;
  display: block;
  margin-bottom: 10px;
}

.upload-content p {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 16px;
}

.upload-content small {
  display: block;
  color: #666;
  font-size: 13px;
}

.file-size {
  color: #9C27B0;
  font-weight: 500;
  margin-top: 5px !important;
}

/* Password Section */
.password-section {
  margin-bottom: 25px;
  text-align: left;
}

.input-wrapper {
  margin-bottom: 5px;
}

.input-wrapper label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.input-with-icon {
  position: relative;
}

.input-with-icon input {
  width: 100%;
  padding: 12px 15px;
  border-radius: 8px;
  border: 2px solid #e0e0e0;
  font-size: 15px;
  transition: all 0.3s ease;
  background: white;
}

.input-with-icon input:focus {
  outline: none;
  border-color: #9C27B0;
  box-shadow: 0 0 0 3px rgba(156, 39, 176, 0.1);
}

.input-with-icon input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.input-hint {
  margin-top: 5px;
  text-align: right;
}

.input-hint small {
  color: #666;
  font-size: 12px;
  font-style: italic;
}

/* Unlock Button */
.unlock-btn {
  width: 100%;
  padding: 16px;
  font-size: 16px;
  border-radius: 10px;
  margin-top: 20px;
  border: none;
  cursor: pointer;
  background: linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%);
  color: white;
  font-weight: 600;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.unlock-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(156, 39, 176, 0.3);
}

.unlock-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.unlock-btn.loading {
  background: linear-gradient(135deg, #7B1FA2 0%, #9C27B0 100%);
}

.unlock-btn.disabled:not(.loading) {
  background: #95a5a6;
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
  background: linear-gradient(90deg, #9C27B0, #7B1FA2);
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
  color: #9C27B0;
  font-weight: 600;
  font-size: 14px;
}

.progress-estimate {
  color: #666;
  font-style: italic;
}

/* Status Message */
.status-message {
  margin-top: 15px;
  font-size: 14px;
  color: #9C27B0;
  font-weight: 500;
  padding: 10px;
  background: #f3e5f5;
  border-radius: 8px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Result Popup */
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
  padding: 20px;
  animation: fadeIn 0.3s ease;
}

.popup-content {
  background: white;
  border-radius: 16px;
  padding: 25px;
  width: 100%;
  max-width: 400px;
  text-align: center;
  animation: slideUp 0.3s ease;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  position: relative;
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

.close-btn {
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s;
}

.close-btn:hover {
  background: #f5f5f5;
  color: #333;
}

.popup-icon {
  font-size: 48px;
  margin-bottom: 15px;
  animation: bounce 0.5s ease;
}

.popup-icon.error {
  color: #f44336;
}

@keyframes bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.popup-content h3 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 20px;
  font-weight: 600;
}

.popup-content > p {
  margin: 0 0 20px 0;
  color: #666;
  font-size: 15px;
  line-height: 1.4;
}

/* Success Details */
.success-details {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 15px;
  margin: 0 0 20px 0;
  text-align: left;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.detail-item:first-child {
  border-bottom: 1px solid #e9ecef;
  padding-bottom: 10px;
  margin-bottom: 8px;
}

.detail-label {
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

.detail-value {
  font-size: 13px;
  color: #333;
  font-weight: 600;
  max-width: 180px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.detail-value.success {
  color: #9C27B0;
}

/* Error Tips */
.error-tips {
  background: #ffebee;
  border-radius: 10px;
  padding: 15px;
  margin: 0 0 20px 0;
  text-align: left;
  border-left: 4px solid #f44336;
}

.error-tips p {
  margin: 0 0 10px 0 !important;
  color: #c62828;
  font-size: 14px !important;
}

.error-tips ul {
  margin: 0;
  padding-left: 20px;
  color: #666;
  font-size: 13px;
  line-height: 1.5;
}

.error-tips li {
  margin-bottom: 5px;
}

/* Popup Buttons */
.popup-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.popup-btn {
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%);
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 100px;
  font-size: 14px;
}

.popup-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(156, 39, 176, 0.3);
}

.popup-btn.secondary {
  background: #6c757d;
  color: white;
}

.popup-btn.secondary:hover {
  background: #5a6268;
  box-shadow: 0 4px 12px rgba(108, 117, 125, 0.3);
}

/* Responsive */
@media (max-width: 480px) {
  .popup-content {
    padding: 20px;
    max-width: 320px;
  }
  
  .popup-buttons {
    flex-direction: column;
    gap: 8px;
  }
  
  .popup-btn {
    width: 100%;
  }
}
</style>