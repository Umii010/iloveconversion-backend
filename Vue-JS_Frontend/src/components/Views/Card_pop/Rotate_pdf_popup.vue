<script setup>
import { ref } from 'vue'

const file = ref(null)
const loading = ref(false)
const progress = ref(0)
const statusText = ref('')
const rotationAngle = ref('90') 

const selectFile = (e) => {
  file.value = e.target.files[0]
}

const rotatePdf = async () => {
  if (!file.value) {
    alert('Please select a PDF file')
    return
  }

  loading.value = true
  progress.value = 0
  statusText.value = 'Sending request to server...'

  const formData = new FormData()
  formData.append('files', file.value)
  formData.append('angle', rotationAngle.value)

  let fakeProgress = null

  try {
    fakeProgress = setInterval(() => {
      if (progress.value < 90) progress.value += 5
    }, 120)

    
    const res = await fetch('http://192.168.18.101:3000/api/rotate-pdf', {
      method: 'POST',
      body: formData
    })

    if (!res.ok) {
      throw new Error('Server error')
    }

    const apiFileName = res.headers.get('X-Original-Filename')
    const fileName = apiFileName || `rotated_${file.value.name}`

    clearInterval(fakeProgress)
    progress.value = 100
    statusText.value = `Downloading ${fileName}`

    const blob = await res.blob()
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    statusText.value = 'Rotation completed'

    // Reset input after download
    file.value = null
    const input = document.querySelector('input[type="file"]')
    if (input) input.value = ''

  } catch (err) {
    statusText.value = 'Rotation failed'
    alert('Rotation failed: ' + err.message)
    console.error(err)
  } finally {
    clearInterval(fakeProgress)
    loading.value = false
    setTimeout(() => {
      progress.value = 0
      statusText.value = ''
    }, 1500)
  }
}
</script>

<template>
  <div class="converter">
    <h2>Rotate PDF</h2>
    <p class="subtitle">Rotate PDF pages to desired orientation</p>

    <label class="upload-box">
      <input
        type="file" name="files"
        accept="application/pdf"
        @change="selectFile"
        hidden
      />
      <div class="upload-content">
        <span class="icon">↻</span>
        <p><strong>Click to upload</strong> a PDF file</p>
        <small>{{ file ? file.name : 'No file selected' }}</small>
      </div>
    </label>

    <div class="rotation-options">
      <label>Rotation Angle:</label>
      <div class="angle-buttons">
        <button 
          :class="['angle-btn', rotationAngle === '90' ? 'active' : '']"
          @click="rotationAngle = '90'"
        >90°</button>
        <button 
          :class="['angle-btn', rotationAngle === '180' ? 'active' : '']"
          @click="rotationAngle = '180'"
        >180°</button>
        <button 
          :class="['angle-btn', rotationAngle === '270' ? 'active' : '']"
          @click="rotationAngle = '270'"
        >270°</button>
      </div>
    </div>

    <button class="merge-btn" @click="rotatePdf" :disabled="loading">
      {{ loading ? 'Rotating PDF...' : 'Rotate PDF' }}
    </button>

    <p v-if="loading" class="status-text">{{ statusText }}</p>

    <div v-if="loading" class="progress-wrapper">
      <div class="progress-bar" :style="{ width: progress + '%' }"></div>
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
  border-color: #107667;
  background: #eef7f5;
}

.upload-content .icon {
  font-size: 36px;
  display: block;
  margin-bottom: 10px;
}

.rotation-options {
  margin-bottom: 20px;
  text-align: left;
}

.rotation-options label {
  display: block;
  margin-bottom: 10px;
  font-weight: 500;
  color: #333;
}

.angle-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.angle-btn {
  padding: 10px 20px;
  border: 2px solid #ddd;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.angle-btn:hover {
  border-color: #107667;
}

.angle-btn.active {
  border-color: #107667;
  background: #107667;
  color: white;
}

.merge-btn {
  width: 100%;
  padding: 12px;
  font-size: 15px;
  border-radius: 10px;
  margin-top: 10px;
  border: none;
  cursor: pointer;
  background: #107667;
  color: #fff;
  transition: background 0.3s ease;
}

.merge-btn:hover:not(:disabled) {
  background: #0d5d4f;
}

.merge-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.status-text {
  margin-top: 10px;
  font-size: 13px;
  color: #444;
}

.progress-wrapper {
  margin-top: 15px;
  height: 10px;
  width: 100%;
  background: #eee;
  border-radius: 8px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: #107667;
  transition: width 0.2s ease;
}
</style>