<script setup>
import { ref } from 'vue'

const file = ref(null)
const loading = ref(false)
const progress = ref(0)
const statusText = ref('')
const selectedLanguage = ref('eng') // Default English
const outputFormat = ref('searchable-pdf') // Default output format
const extractedText = ref('')
const showTextPreview = ref(false)

// Supported languages for OCR
const languages = ref([
  { code: 'eng', name: 'English' },
  { code: 'spa', name: 'Spanish' },
  { code: 'fra', name: 'French' },
  { code: 'deu', name: 'German' },
  { code: 'ita', name: 'Italian' },
  { code: 'por', name: 'Portuguese' },
  { code: 'rus', name: 'Russian' },
  { code: 'chi_sim', name: 'Chinese Simplified' },
  { code: 'jpn', name: 'Japanese' },
  { code: 'kor', name: 'Korean' },
  { code: 'ara', name: 'Arabic' },
  { code: 'hin', name: 'Hindi' }
])

// Output formats
const formats = ref([
  { id: 'searchable-pdf', name: 'Searchable PDF', desc: 'Original PDF with hidden text layer' },
  { id: 'text-pdf', name: 'Text PDF', desc: 'New PDF with extracted text only' },
  { id: 'txt', name: 'Text File (.txt)', desc: 'Plain text file' },
  { id: 'docx', name: 'Word Document (.docx)', desc: 'Editable Word document' }
])

const selectFile = (e) => {
  const selectedFile = e.target.files[0]
  if (!selectedFile) return
  
  file.value = selectedFile
  extractedText.value = ''
  showTextPreview.value = false
  console.log('File selected for OCR:', selectedFile.name)
}

const performOcr = async () => {
  if (!file.value) {
    alert('Please select a PDF or image file')
    return
  }

  loading.value = true
  progress.value = 0
  statusText.value = 'Starting OCR process...'
  extractedText.value = ''
  showTextPreview.value = false

  const formData = new FormData()
  formData.append('file', file.value)
  formData.append('language', selectedLanguage.value)
  formData.append('outputFormat', outputFormat.value)

  let fakeProgress = null

  try {
    // Fake progress for better UX
    fakeProgress = setInterval(() => {
      if (progress.value < 90) {
        progress.value += Math.random() * 10
        updateStatusText(progress.value)
      }
    }, 500)

    // Call OCR API
    const res = await fetch('http://192.168.18.101:3000/api/ocr-pdf', {
      method: 'POST',
      body: formData
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`Server error: ${res.status} - ${errorText}`)
    }

    clearInterval(fakeProgress)
    progress.value = 100
    statusText.value = 'OCR completed! Processing download...'

    // Check content type to determine how to handle response
    const contentType = res.headers.get('content-type')
    
    if (contentType.includes('application/json')) {
      // JSON response (text preview)
      const result = await res.json()
      
      if (result.text) {
        extractedText.value = result.text
        showTextPreview.value = true
        statusText.value = 'Text extracted successfully!'
        
        // Also offer download if there's a file URL
        if (result.downloadUrl) {
          downloadFile(result.downloadUrl, result.filename || 'ocr_result.pdf')
        }
      } else if (result.downloadUrl) {
        downloadFile(result.downloadUrl, result.filename || 'ocr_result.pdf')
      }
    } else {
      // Binary response (direct file download)
      const contentDisposition = res.headers.get('content-disposition')
      let fileName = 'ocr_result'
      
      if (contentDisposition) {
        const matches = contentDisposition.match(/filename="(.+)"/)
        if (matches && matches[1]) {
          fileName = matches[1]
        } else {
          // Determine filename based on output format
          const ext = outputFormat.value === 'txt' ? '.txt' : 
                     outputFormat.value === 'docx' ? '.docx' : '.pdf'
          fileName = `${file.value.name.replace(/\.[^/.]+$/, '')}_ocr${ext}`
        }
      }
      
      const blob = await res.blob()
      downloadBlob(blob, fileName)
    }

  } catch (err) {
    statusText.value = 'OCR failed'
    alert('OCR failed: ' + err.message)
    console.error('OCR error:', err)
  } finally {
    if (fakeProgress) clearInterval(fakeProgress)
    loading.value = false
    setTimeout(() => {
      progress.value = 0
      statusText.value = ''
    }, 3000)
  }
}

const updateStatusText = (progressValue) => {
  if (progressValue < 20) {
    statusText.value = 'Uploading file...'
  } else if (progressValue < 40) {
    statusText.value = 'Analyzing document structure...'
  } else if (progressValue < 60) {
    statusText.value = 'Performing OCR...'
  } else if (progressValue < 80) {
    statusText.value = 'Extracting text...'
  } else {
    statusText.value = 'Finalizing output...'
  }
}

const downloadFile = (url, filename) => {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const copyTextToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(extractedText.value)
    alert('Text copied to clipboard!')
  } catch (err) {
    console.error('Failed to copy text:', err)
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = extractedText.value
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    alert('Text copied to clipboard!')
  }
}

const downloadText = () => {
  const blob = new Blob([extractedText.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${file.value.name.replace(/\.[^/.]+$/, '')}_extracted.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const clearFile = () => {
  file.value = null
  extractedText.value = ''
  showTextPreview.value = false
  const input = document.querySelector('input[type="file"]')
  if (input) input.value = ''
}

// Sample extracted text for demo (would come from API in real app)
const sampleExtractedText = `This is a sample of extracted text from OCR:

Document Title: Sample Scanned Document
Date: January 15, 2024
Author: John Doe

ABSTRACT
This document demonstrates the capabilities of Optical Character Recognition (OCR) technology. OCR converts different types of documents, such as scanned paper documents, PDF files, or images captured by a digital camera into editable and searchable data.

INTRODUCTION
Optical Character Recognition has revolutionized document management by enabling the conversion of physical documents into digital formats. This technology recognizes text within images and converts it into machine-encoded text.

KEY FEATURES:
1. Text extraction from scanned documents
2. Support for multiple languages
3. Preservation of document layout
4. Searchable PDF creation
5. High accuracy with modern AI algorithms

CONCLUSION
OCR technology continues to improve with advancements in machine learning and artificial intelligence, making document digitization more accurate and accessible than ever before.`
</script>

<template>
  <div class="converter">
    <h2>OCR PDF</h2>
    <p class="subtitle">Extract text from scanned PDFs and images using Optical Character Recognition</p>

    <!-- File Upload -->
    <label class="upload-box">
      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.tiff,.bmp,.gif"
        @change="selectFile"
        hidden
      />
      <div class="upload-content">
        <span class="icon">🔍</span>
        <p><strong>Click to upload</strong> a PDF or image file</p>
        <small>Supports: PDF, JPG, PNG, TIFF, BMP</small>
        <small class="file-info">{{ file ? file.name : 'No file selected' }}</small>
      </div>
    </label>

    <!-- Extracted Text Preview -->
    <div v-if="showTextPreview && extractedText" class="text-preview">
      <div class="preview-header">
        <h3>Extracted Text Preview</h3>
        <div class="preview-actions">
          <button @click="copyTextToClipboard" class="action-btn">
            📋 Copy Text
          </button>
          <button @click="downloadText" class="action-btn">
            ⬇️ Download .txt
          </button>
        </div>
      </div>
      <div class="text-content">
        <pre>{{ extractedText }}</pre>
      </div>
      <div class="text-stats">
        <span>Characters: {{ extractedText.length }}</span>
        <span>Words: {{ extractedText.split(/\s+/).filter(w => w).length }}</span>
        <span>Lines: {{ extractedText.split('\n').length }}</span>
      </div>
    </div>


    <!-- Action Buttons -->
    <div class="action-buttons">
      <button v-if="file" @click="clearFile" class="secondary-btn">
        Clear File
      </button>
      <button 
        class="ocr-btn" 
        @click="performOcr" 
        :disabled="loading || !file"
      >
        <span v-if="loading">🔄 Processing OCR...</span>
        <span v-else>🚀 Perform OCR</span>
      </button>
    </div>

    <!-- Status & Progress -->
    <p v-if="loading" class="status-text">{{ statusText }}</p>
    <div v-if="loading" class="progress-wrapper">
      <div class="progress-bar" :style="{ width: progress + '%' }"></div>
    </div>

  </div>
</template>

<style scoped>
.converter {
  text-align: center;
  max-width: 900px;
  margin: 0 auto;
}

.converter h2 {
  font-size: 24px;
  margin-bottom: 8px;
  color: #333;
}

.subtitle {
  font-size: 14px;
  color: #666;
  margin-bottom: 25px;
  line-height: 1.5;
}

/* File Upload */
.upload-box {
  display: block;
  border: 2px dashed #aaa;
  border-radius: 12px;
  padding: 30px 20px;
  cursor: pointer;
  background: #f9f9f9;
  transition: all 0.3s ease;
  margin-bottom: 25px;
}

.upload-box:hover {
  border-color: #4a6fa5;
  background: #f0f4fa;
}

.upload-content .icon {
  font-size: 42px;
  display: block;
  margin-bottom: 12px;
}

.upload-content small {
  display: block;
  margin-top: 5px;
  color: #666;
}

.file-info {
  margin-top: 10px !important;
  font-weight: 500;
  color: #4a6fa5 !important;
}

/* OCR Settings */
.ocr-settings {
  background: #f8f9fa;
  padding: 25px;
  border-radius: 12px;
  margin-bottom: 25px;
  border: 1px solid #e9ecef;
  text-align: left;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 25px;
  margin-bottom: 20px;
}

.setting-group {
  margin-bottom: 15px;
}

.setting-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 15px;
  color: #333;
  font-weight: 600;
}

.setting-select {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.setting-select:focus {
  outline: none;
  border-color: #4a6fa5;
  box-shadow: 0 0 0 3px rgba(74, 111, 165, 0.1);
}

.setting-desc {
  font-size: 12px;
  color: #666;
  margin-top: 6px;
  line-height: 1.4;
}

.supported-formats {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e9ecef;
}

.format-badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.badge {
  background: #4a6fa5;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

/* Text Preview */
.text-preview {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 25px;
  text-align: left;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e9ecef;
}

.preview-header h3 {
  font-size: 18px;
  color: #333;
  margin: 0;
}

.preview-actions {
  display: flex;
  gap: 10px;
}

.action-btn {
  padding: 8px 16px;
  background: white;
  border: 1px solid #4a6fa5;
  border-radius: 6px;
  color: #4a6fa5;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #4a6fa5;
  color: white;
}

.text-content {
  max-height: 300px;
  overflow-y: auto;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.text-stats {
  display: flex;
  justify-content: space-around;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #e9ecef;
  font-size: 12px;
  color: #666;
}

.text-stats span {
  font-weight: 600;
  color: #4a6fa5;
}

/* Demo Preview */
.demo-preview {
  background: #f0f4fa;
  padding: 25px;
  border-radius: 12px;
  margin-bottom: 25px;
  text-align: center;
}

.demo-preview h3 {
  font-size: 18px;
  color: #333;
  margin-bottom: 20px;
}

.demo-steps {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-bottom: 25px;
  flex-wrap: wrap;
}

.step {
  flex: 1;
  min-width: 200px;
  max-width: 250px;
}

.step-icon {
  width: 40px;
  height: 40px;
  background: #4a6fa5;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 18px;
  margin: 0 auto 15px;
}

.step p {
  font-size: 14px;
  color: #555;
  line-height: 1.5;
}

.sample-output {
  background: white;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #d1dce9;
}

.sample-output h4 {
  font-size: 16px;
  color: #333;
  margin-bottom: 15px;
}

.sample-text {
  font-style: italic;
  color: #666;
  line-height: 1.6;
  border-left: 3px solid #4a6fa5;
  padding-left: 15px;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin: 30px 0;
}

.ocr-btn {
  flex: 1;
  max-width: 300px;
  padding: 16px 30px;
  font-size: 16px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  background: linear-gradient(135deg, #4a6fa5, #3a5a8c);
  color: white;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(74, 111, 165, 0.2);
}

.ocr-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(74, 111, 165, 0.3);
  background: linear-gradient(135deg, #3a5a8c, #2a4a7c);
}

.ocr-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.secondary-btn {
  padding: 16px 25px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 10px;
  color: #666;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.secondary-btn:hover {
  background: #f8f9fa;
  border-color: #999;
}

/* Status & Progress */
.status-text {
  margin-top: 15px;
  font-size: 14px;
  color: #4a6fa5;
  font-weight: 500;
}

.progress-wrapper {
  margin: 15px auto 25px;
  height: 10px;
  width: 100%;
  max-width: 400px;
  background: #e9ecef;
  border-radius: 8px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #4a6fa5, #6a8fc5);
  transition: width 0.3s ease;
}

/* OCR Tips */
.ocr-tips {
  background: #fff8e1;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #ffecb3;
  margin-top: 25px;
  text-align: left;
}

.ocr-tips h4 {
  font-size: 16px;
  color: #333;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.ocr-tips ul {
  margin: 0;
  padding-left: 20px;
  color: #666;
}

.ocr-tips li {
  margin-bottom: 8px;
  line-height: 1.5;
  font-size: 13px;
}
</style>