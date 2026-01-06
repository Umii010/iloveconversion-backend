<script setup>
import { ref, computed } from 'vue'

const file = ref(null)
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const progress = ref(0)
const statusText = ref('')
const showSuccessPopup = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const showPasswordPopup = ref(false)

const selectFile = (e) => {
  file.value = e.target.files[0]
  password.value = ''
  confirmPassword.value = ''
}

const openPasswordPopup = () => {
  if (!file.value) {
    alert('Please select a PDF file first')
    return
  }
  showPasswordPopup.value = true
}

const closePasswordPopup = () => {
  showPasswordPopup.value = false
  password.value = ''
  confirmPassword.value = ''
}

const passwordsMatch = computed(() => {
  if (!password.value || !confirmPassword.value) return true
  return password.value === confirmPassword.value
})

const isFormValid = computed(() => {
  return file.value && 
         password.value && 
         confirmPassword.value && 
         passwordsMatch.value
})

const closeSuccessPopup = () => {
  showSuccessPopup.value = false
  // Reset everything
  file.value = null
  password.value = ''
  confirmPassword.value = ''
  const input = document.querySelector('input[type="file"]')
  if (input) input.value = ''
}

const protectPdf = async () => {
  if (!file.value || !password.value || !confirmPassword.value) {
    alert('Please complete all fields')
    return
  }

  if (password.value !== confirmPassword.value) {
    alert('Passwords do not match')
    return
  }

  loading.value = true
  progress.value = 0
  statusText.value = 'Starting protection...'
  showSuccessPopup.value = false
  showPasswordPopup.value = false

  const formData = new FormData()
  formData.append('file', file.value)
  formData.append('password', password.value)

  let fakeProgress = null

  try {
    // Enhanced progress simulation
    fakeProgress = setInterval(() => {
      if (progress.value < 95) {
        progress.value += 2
        if (progress.value < 30) {
          statusText.value = `Uploading PDF... ${Math.round(progress.value)}%`
        } else if (progress.value < 60) {
          statusText.value = `Applying encryption... ${Math.round(progress.value)}%`
        } else if (progress.value < 85) {
          statusText.value = `Securing document... ${Math.round(progress.value)}%`
        } else {
          statusText.value = `Finalizing... ${Math.round(progress.value)}%`
        }
      }
    }, 100)

    const res = await fetch('http://192.168.18.101:3000/api/protect-pdf', {
      method: 'POST',
      body: formData
    })

    clearInterval(fakeProgress)
    progress.value = 100
    statusText.value = 'Protection complete!'

    if (!res.ok) throw new Error('Protection failed')

    const blob = await res.blob()
    const url = URL.createObjectURL(blob)

    const fileName = file.value.name.replace(/\.pdf$/i, '-protected.pdf')

    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    // Show success popup
    showSuccessPopup.value = true
    statusText.value = 'PDF protected successfully'

  } catch (err) {
    console.error(err)
    statusText.value = 'Protection failed'
    alert('Protection failed. Please try again.')
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
    <h2>Protect PDF</h2>
    <p class="subtitle">Add password protection to your PDF file</p>

    <!-- File Upload -->
    <label class="upload-box">
      <input
        type="file"
        accept="application/pdf"
        @change="selectFile"
        hidden
      />
      <div class="upload-content">
        <span class="icon">🔒📄</span>
        <p><strong>Click to upload</strong> a PDF file</p>
        <small>{{ file ? file.name : 'No file selected' }}</small>
        <small v-if="file" class="file-size">
          Size: {{ (file.size / 1024 / 1024).toFixed(2) }} MB
        </small>
      </div>
    </label>

    <!-- Protect Button (Shows after file select) -->
    <button 
      v-if="file"
      class="protect-btn" 
      @click="openPasswordPopup" 
      :disabled="loading"
    >
      🔒 Set Password & Protect
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
          {{ progress < 50 ? 'About 10-20 seconds remaining' : 'Almost done...' }}
        </span>
      </div>
    </div>

    <!-- Status Message (non-loading) -->
    <p v-if="statusText && !loading" class="status-message">{{ statusText }}</p>

    <!-- Password Popup Modal -->
    <div v-if="showPasswordPopup" class="popup-overlay" @click="closePasswordPopup">
      <div class="popup-content password-popup" @click.stop>
        <button class="close-btn" @click="closePasswordPopup">×</button>
        
        <div class="popup-header">
          <span class="popup-icon">🔒</span>
          <h3>Set Password</h3>
          <p>Protect: <strong>{{ file?.name }}</strong></p>
        </div>

        <div class="password-input-group">
          <div class="input-wrapper">
            <label for="password">Password</label>
            <div class="input-with-icon">
              <input
                id="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Enter password"
                v-model="password"
                :disabled="loading"
                autofocus
              />
              <button 
                type="button" 
                class="toggle-password"
                @click="showPassword = !showPassword"
                :disabled="loading"
              >
                {{ showPassword ? '🙈' : '👁️' }}
              </button>
            </div>
          </div>

          <div class="input-wrapper">
            <label for="confirmPassword">Confirm Password</label>
            <div class="input-with-icon">
              <input
                id="confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                placeholder="Confirm password"
                v-model="confirmPassword"
                :disabled="loading"
                :class="{ 'error': !passwordsMatch && confirmPassword.length > 0 }"
              />
              <button 
                type="button" 
                class="toggle-password"
                @click="showConfirmPassword = !showConfirmPassword"
                :disabled="loading"
              >
                {{ showConfirmPassword ? '🙈' : '👁️' }}
              </button>
            </div>
            <p v-if="!passwordsMatch && confirmPassword.length > 0" class="error-message">
              ⚠️ Passwords do not match
            </p>
          </div>

          <div class="password-strength" v-if="password">
            <div class="strength-label">Password Strength:</div>
            <div class="strength-bar">
              <div 
                class="strength-fill" 
                :class="{
                  'weak': password.length < 6,
                  'medium': password.length >= 6 && password.length < 10,
                  'strong': password.length >= 10
                }"
                :style="{ width: Math.min(password.length * 10, 100) + '%' }"
              ></div>
            </div>
            <div class="strength-text" :class="{
              'weak-text': password.length < 6,
              'medium-text': password.length >= 6 && password.length < 10,
              'strong-text': password.length >= 10
            }">
              {{ 
                password.length < 6 ? 'Weak' : 
                password.length < 10 ? 'Medium' : 
                'Strong' 
              }}
            </div>
          </div>

          <div class="password-tips">
            <small>💡 Use at least 6 characters for better security</small>
          </div>
        </div>

        <div class="popup-buttons">
          <button 
            class="popup-btn" 
            @click="protectPdf" 
            :disabled="loading || !password || !confirmPassword || !passwordsMatch"
            :class="{ 'loading': loading }"
          >
            <template v-if="loading">
              <span class="spinner"></span> Protecting...
            </template>
            <template v-else>
              🔒 Protect Now
            </template>
          </button>
          <button class="popup-btn secondary" @click="closePasswordPopup">
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Success Popup (Compact Version) -->
    <div v-if="showSuccessPopup" class="popup-overlay" @click="closeSuccessPopup">
      <div class="popup-content success-popup" @click.stop>
        <button class="close-btn" @click="closeSuccessPopup">×</button>
        <div class="popup-header">
          <span class="popup-icon success">✅</span>
          <h3>PDF Protected!</h3>
          <p>Your file is now password protected.</p>
        </div>
        
        <div class="file-info">
          <div class="info-row">
            <span class="info-label">File:</span>
            <span class="info-value">{{ file?.name }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Status:</span>
            <span class="info-value success">Secured 🔒</span>
          </div>
        </div>

        <div class="security-alert">
          <span class="alert-icon">⚠️</span>
          <span class="alert-text">Remember your password!</span>
        </div>

        <div class="popup-buttons">
          <button class="popup-btn" @click="closeSuccessPopup">
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
  position: relative;
}

.converter h2 {
  font-size: 22px;
  margin: 0px;
  color: #333;
}

.subtitle {
  font-size: 14px;
  color: #666;
}

.upload-box {
  display: block;
  border: 2px dashed #aaa;
  border-radius: 12px;
  padding: 10px 5px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #f9f9f9;
  max-width: 550px;
  margin: auto;
}

.upload-box:hover {
  border-color: #107667;
  background: #eef7f5;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 118, 103, 0.1);
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
  color: #107667;
  font-weight: 500;
  margin-top: 5px !important;
}

/* Protect Button */
.protect-btn {
  width: 100%;
  padding: 12px;
  font-size: 16px;
  border-radius: 10px;
  margin-top: 8px;
  border: none;
  cursor: pointer;
  background: linear-gradient(135deg, #107667 0%, #0d5c50 100%);
  color: white;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  max-width: 550px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.protect-btn:hover:not(:disabled) {
  box-shadow: 0 6px 20px rgba(16, 118, 103, 0.3);
  transform: translateY(-2px);
}

.protect-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Progress Container */
.progress-container {
  padding: 5px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.status-text {
  margin-bottom: 5px;
  font-size: 15px;
  color: #333;
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
  background: linear-gradient(90deg, #107667, #0d5c50);
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
  color: #107667;
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

/* Popup Overlay (Shared for both modals) */
.popup-overlay {
  position: fixed;
  top: 25px;
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
  backdrop-filter: blur(3px);
}

/* Popup Content (Shared) */
.popup-content {
  background: white;
  border-radius: 16px;
  padding: 0;
  width: 100%;
  max-width: 420px;
  text-align: center;
  animation: slideUp 0.3s ease;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  position: relative;
  max-height: 90vh;
  overflow-y: auto;
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
  z-index: 10;
}

.close-btn:hover {
  background: #f5f5f5;
  color: #333;
}

.popup-header {
  padding: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.popup-icon {
  font-size: 33px;
  display: block;
}

.popup-icon.success {
  animation: bounce 0.5s ease;
}

@keyframes bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.popup-header h3 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 17px;
}

.popup-header p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.password-popup {
  max-width: 400px;
}

.password-input-group {
  padding: 10px;
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
  display: flex;
  align-items: center;
}

.input-with-icon input {
      width: 100%;
    padding: 6px 20px 6px 7px;
    border-radius: 8px;
    border: 2px solid #e0e0e0;
    font-size: 15px;
    transition: all 0.3s ease;
    background: white;
}

.input-with-icon input:focus {
  outline: none;
  border-color: #107667;
  box-shadow: 0 0 0 3px rgba(16, 118, 103, 0.1);
}

.input-with-icon input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.input-with-icon input.error {
  border-color: #f44336;
  background: #fff5f5;
}

.toggle-password {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  transition: all 0.3s;
  color: #666;
}

.toggle-password:hover:not(:disabled) {
  background: #f0f0f0;
  color: #333;
}

.toggle-password:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-message {
  color: #f44336;
  font-size: 13px;
  margin-top: 5px;
  display: flex;
  align-items: center;
  gap: 5px;
}

/* Password Strength */
.password-strength {
  padding: 5px;
  background: #f8f9fa;
  border-radius: 8px;
}

.strength-label {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}

.strength-bar {
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 8px;
}

.strength-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease, background-color 0.3s ease;
}

.strength-fill.weak {
  background: #f44336;
}

.strength-fill.medium {
  background: #ff9800;
}

.strength-fill.strong {
  background: #4CAF50;
}

.strength-text {
  font-size: 12px;
  font-weight: 600;
  text-align: right;
}

.weak-text {
  color: #f44336;
}

.medium-text {
  color: #ff9800;
}

.strong-text {
  color: #4CAF50;
}

.password-tips {
  padding: 6px;
  background: #e3f2fd;
  border-radius: 6px;
  border-left: 4px solid #2196F3;
  text-align: center;
}

.password-tips small {
  color: #1976d2;
  font-size: 13px;
}

.popup-buttons {
  padding: 5px 15px;
  background: #f8f9fa;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 12px;
}

.popup-btn {
  flex: 1;
  border-radius: 8px;
  border: none;
  background: black;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 35px;
}

.popup-btn:hover:not(:disabled) {
  box-shadow: 0 4px 12px rgba(16, 118, 103, 0.3);
}

.popup-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.popup-btn.loading {
  background: linear-gradient(135deg, #0d5c50 0%, #107667 100%);
}

.popup-btn.secondary {
  background: #6c757d;
  color: white;
}

.popup-btn.secondary:hover:not(:disabled) {
  background: #5a6268;
  box-shadow: 0 4px 12px rgba(108, 117, 125, 0.3);
}

.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.file-info {
  padding: 20px 25px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.info-label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.info-value {
  font-size: 14px;
  color: #333;
  font-weight: 600;
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.info-value.success {
  color: #107667;
}

/* Security Alert */
.security-alert {
  background: #fff3e0;
  border-radius: 8px;
  padding: 12px 15px;
  margin: 0 25px 20px 25px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-left: 4px solid #ff9800;
}

.alert-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.alert-text {
  font-size: 14px;
  color: #e65100;
  font-weight: 500;
  text-align: left;
  flex: 1;
}

/* Responsive adjustments */
@media (max-width: 480px) {
  .popup-content {
    max-width: 340px;
  }
  
  .password-popup {
    max-width: 320px;
  }
  
  .popup-header {
    padding: 20px;
  }
  
  .password-input-group {
    padding: 20px;
  }
  
  .popup-buttons {
    padding: 15px 20px;
    flex-direction: column;
  }
  
  .file-info {
    padding: 15px 20px;
  }
  
  .info-value {
    max-width: 150px;
  }
  
  .security-alert {
    margin: 0 20px 15px 20px;
  }
}
</style>