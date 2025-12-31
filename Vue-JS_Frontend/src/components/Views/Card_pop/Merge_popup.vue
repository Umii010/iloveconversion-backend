<script setup>
import { ref } from 'vue'

const files = ref([])
const loading = ref(false)
const progress = ref(0)

const selectFiles = (e) => {
  files.value = Array.from(e.target.files)
}

const removeFile = (index) => {
  files.value.splice(index, 1)
}

const mergePdf = async () => {
  if (!files.value.length) {
    alert('Please select PDF files')
    return
  }

  loading.value = true
  progress.value = 0

  const formData = new FormData()
  files.value.forEach((file) => {
    formData.append('files', file)
  })

  let fakeProgress = null

  try {
    fakeProgress = setInterval(() => {
      if (progress.value < 90) progress.value += 5
    }, 100)

    const res = await fetch('http://192.168.18.101:3000/api/merge-pdf', {
      method: 'POST',
      body: formData
    })

    clearInterval(fakeProgress)
    progress.value = 100

    if (!res.ok) throw new Error('Merge failed')

    const blob = await res.blob()
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = 'merged.pdf'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    // Reset files and input after download
    files.value = []
    const input = document.querySelector('input[type="file"]')
    if (input) input.value = ''

  } catch (err) {
    alert('Merge failed')
    console.error(err)
  } finally {
    loading.value = false
    setTimeout(() => (progress.value = 0), 800)
  }
}
</script>

<template>
  <div class="converter">
    <h2>Merge PDF</h2>
    <p class="subtitle">Select multiple PDF files and merge into one</p>

    <label class="upload-box">
      <input
        type="file"
        accept="application/pdf"
        multiple
        @change="selectFiles"
        hidden
      />
      <div class="upload-content">
        <span class="icon">📄</span>
        <p><strong>Click to upload</strong> or drag & drop PDFs</p>
        <small>{{ files.length }} file(s) selected</small>
      </div>
    </label>

    <ul v-if="files.length" class="file-list">
      <li v-for="(file, index) in files" :key="index">
        {{ file.name }}
        <button type="button" class="remove-btn" @click="removeFile(index)">×</button>
      </li>
    </ul>

    <button type="button" class="merge-btn" @click="mergePdf" :disabled="loading">
      {{ loading ? 'Merging PDFs...' : 'Merge PDF' }}
    </button>

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

.upload-content p {
  margin: 0;
  font-size: 15px;
}

.upload-content small {
  display: block;
  margin-top: 6px;
  color: #777;
}

.file-list {
  margin: 20px 0;
  padding: 0;
  list-style: none;
  max-height: 120px;
  overflow-y: auto;
  text-align: left;
}

.file-list li {
  padding: 8px 12px;
  border-radius: 8px;
  background: #f1f1f1;
  margin-bottom: 6px;
  font-size: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.remove-btn {
  background: transparent;
  border: none;
  color: #ff4d4f;
  font-size: 18px;
  cursor: pointer;
  line-height: 1;
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
  transition: all 0.3s ease;
}

.merge-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.2);
}

.merge-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
  border-radius: 8px 0 0 8px;
}
</style>
