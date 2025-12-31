<script setup>
import { ref } from 'vue'

const file = ref(null)
const loading = ref(false)
const progress = ref(0)

const selectFile = (e) => {
  file.value = e.target.files[0]
}

const splitPdf = async () => {
  if (!file.value) {
    alert('Please select a PDF file')
    return
  }

  loading.value = true
  progress.value = 0

  const formData = new FormData()
  formData.append('file', file.value)

  try {
    // Fake progress (replace with real backend progress if available)
    const fakeProgress = setInterval(() => {
      if (progress.value < 90) progress.value += 5
    }, 120)

    const res = await fetch('http://localhost:3000/split-pdf', {
      method: 'POST',
      body: formData
    })

    clearInterval(fakeProgress)
    progress.value = 100

    const blob = await res.blob()
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = 'split-pages.zip'
    a.click()

    URL.revokeObjectURL(url)
  } catch (err) {
    alert('Split failed')
  } finally {
    loading.value = false
    setTimeout(() => (progress.value = 0), 800)
  }
}
</script>

<template>
  <div class="converter">
    <h2>Split PDF</h2>
    <p class="subtitle">Upload a PDF and split it into separate pages</p>

    <label class="upload-box">
      <input
        type="file"
        accept="application/pdf"
        @change="selectFile"
        hidden
      />
      <div class="upload-content">
        <span class="icon">📑</span>
        <p><strong>Click to upload</strong> a PDF file</p>
        <small>{{ file ? file.name : 'No file selected' }}</small>
      </div>
    </label>

    <button class="merge-btn" @click="splitPdf" :disabled="loading">
      {{ loading ? 'Splitting PDF...' : 'Split PDF' }}
    </button>

    <!-- Progress Bar -->
    <div v-if="loading" class="progress-wrapper">
      <div class="progress-bar" :style="{ width: progress + '%' }"></div>
    </div>
  </div>
</template>

<style scoped>
/* Same styles – unchanged */
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
  transition: all 0.3s ease;
  background: #f9f9f9;
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

.merge-btn {
  width: 100%;
  padding: 12px;
  font-size: 15px;
  border-radius: 10px;
  margin-top: 20px;
  border: none;
  cursor: pointer;
  background: rgb(238, 108, 77);
  color: white;
}

.progress-wrapper {
  margin-top: 20px;
  height: 10px;
  width: 100%;
  background: #eee;
  border-radius: 8px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: rgb(238, 108, 77);
  transition: width 0.2s ease;
}
</style>
