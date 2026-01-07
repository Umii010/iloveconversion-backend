<script setup>
import { ref } from 'vue'
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

const selectFile = (e) => {
  file.value = e.target.files[0]
   if (file.value && typeof gtag !== 'undefined') {
    gtag('event', 'file_selected', {
      'tool_name': 'word_to_pdf',
      'file_size': file.value.size,
      'file_type': file.value.type,
      'file_name': file.value.name,
      'event_category': 'File Upload'
    });
  }
}

const wordToPdf = async () => {
  if (!file.value) {
    alert('Please select a Word file')
    return
  }

  loading.value = true
  progress.value = 0
  statusText.value = 'Sending request to server...'

  const formData = new FormData()
  formData.append('file', file.value)

  let fakeProgress = null

  try {
    // Fake progress simulation
    fakeProgress = setInterval(() => {
      if (progress.value < 90) progress.value += 5
    }, 120)

    const res = await fetch('http://192.168.18.101:3000/api/word-to-pdf', {
      method: 'POST',
      body: formData
    })

    clearInterval(fakeProgress)
    progress.value = 100

    if (!res.ok) throw new Error('Conversion failed')

    // Read headers from API
    const originalSize = res.headers.get('X-Original-Size')
    const convertedSize = res.headers.get('X-Converted-Size')
    const apiFileName = res.headers.get('X-Original-Filename')

    // Show API response as status text
    statusText.value = `Original: ${originalSize || 'N/A'} bytes | Converted: ${convertedSize || 'N/A'} bytes`

    // Use original Word name but with .pdf extension
    const fileName = apiFileName || file.value.name.replace(/\.(docx|doc)$/i, '.pdf')

    const blob = await res.blob()
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
      trackToolUsage('word_to_pdf', 'convert', {
      original_file_size: originalSize || file.value.size,
      converted_file_size: convertedSize || blob.size,
      file_extension: file.value.name.split('.').pop().toLowerCase(),
      success: true
    });

    // Reset input after download
    file.value = null
    const input = document.querySelector('input[type="file"]')
    if (input) input.value = ''
  } catch (err) {
    console.error(err)
    statusText.value = 'Conversion failed'
    alert('Conversion failed')
     trackToolUsage('word_to_pdf', 'convert', {
      file_extension: file.value?.name?.split('.').pop().toLowerCase() || 'unknown',
      file_size: file.value?.size || 0,
      success: false,
      error: err.message.substring(0, 50)
    });
  } finally {
    loading.value = false
    setTimeout(() => {
      progress.value = 0
      statusText.value = ''
    }, 3000)
  }
}
</script>

<template>
  <div class="converter">
    <h2>Word to PDF</h2>
    <p class="subtitle">Convert Word files into PDF documents</p>

    <label class="upload-box">
      <input
        type="file"
        accept=".doc,.docx"
        @change="selectFile"
        hidden
      />
      <div class="upload-content">
        <span class="icon">📝➡️📄</span>
        <p><strong>Click to upload</strong> a Word file</p>
        <small>{{ file ? file.name : 'No file selected' }}</small>
      </div>
    </label>

    <button class="merge-btn" @click="wordToPdf" :disabled="loading">
      {{ loading ? 'Converting...' : 'Convert to PDF' }}
    </button>

    <div v-if="loading" class="progress-wrapper">
      <div class="progress-bar" :style="{ width: progress + '%' }"></div>
    </div>

    <p v-if="statusText" class="status-text">{{ statusText }}</p>
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

.status-text {
  margin-top: 12px;
  font-size: 13px;
  color: #444;
}
</style>
