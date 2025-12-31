<script setup>
import { ref } from 'vue'

const file = ref(null)
const loading = ref(false)
const progress = ref(0)
const statusText = ref('')

// Conversion settings
const conversionSettings = ref({
  quality: 'high', // 'low', 'medium', 'high'
  slidesPerPage: 'single', // 'single', 'multiple', 'notes'
  includeNotes: false,
  includeHiddenSlides: false,
  pageSize: 'A4',
  orientation: 'portrait'
})

// Supported formats
const supportedFormats = ref([
  { ext: '.ppt', name: 'PowerPoint 97-2003', icon: '📊' },
  { ext: '.pptx', name: 'PowerPoint 2007+', icon: '📊' },
  { ext: '.pps', name: 'PowerPoint Show', icon: '🎬' },
  { ext: '.ppsx', name: 'PowerPoint Show 2007+', icon: '🎬' },
  { ext: '.odp', name: 'OpenDocument', icon: '📄' }
])

// Quality options
const qualityOptions = ref([
  { id: 'low', name: 'Low Quality', desc: 'Small file size, faster conversion', size: '~50-100 KB per slide' },
  { id: 'medium', name: 'Medium Quality', desc: 'Balanced quality and size', size: '~100-300 KB per slide' },
  { id: 'high', name: 'High Quality', desc: 'Best quality for printing', size: '~300-800 KB per slide' }
])

// Slides per page options
const slidesPerPageOptions = ref([
  { id: 'single', name: 'Single Slide', desc: 'One slide per page', icon: '1️⃣' },
  { id: 'multiple', name: 'Multiple Slides', desc: '2, 4, or 6 slides per page', icon: '2️⃣' },
  { id: 'notes', name: 'Slides with Notes', desc: 'Slide with speaker notes', icon: '📝' },
  { id: 'handout', name: 'Handout Format', desc: 'Lines for notes', icon: '📄' }
])

const selectFile = (e) => {
  const selectedFile = e.target.files[0]
  if (!selectedFile) return
  
  // Check file extension
  const fileName = selectedFile.name.toLowerCase()
  const isValidFormat = supportedFormats.value.some(format => 
    fileName.endsWith(format.ext)
  )
  
  if (!isValidFormat) {
    alert('Please select a PowerPoint file (.ppt, .pptx, .pps, .ppsx, .odp)')
    e.target.value = ''
    return
  }
  
  file.value = selectedFile
  console.log('PPT file selected:', selectedFile.name)
}

const convertPptToPdf = async () => {
  if (!file.value) {
    alert('Please select a PowerPoint file')
    return
  }

  loading.value = true
  progress.value = 0
  statusText.value = 'Starting conversion...'

  const formData = new FormData()
  formData.append('ppt', file.value)
  formData.append('settings', JSON.stringify(conversionSettings.value))

  let fakeProgress = null

  try {
    // Fake progress for better UX
    fakeProgress = setInterval(() => {
      if (progress.value < 90) {
        progress.value += Math.random() * 10
        updateStatusText(progress.value)
      }
    }, 400)

    // Call conversion API
    const res = await fetch('http://192.168.18.101:3000/api/ppt-to-pdf', {
      method: 'POST',
      body: formData
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`Server error: ${res.status} - ${errorText}`)
    }

    clearInterval(fakeProgress)
    progress.value = 100
    statusText.value = 'Downloading PDF...'

    // Get filename
    const contentDisposition = res.headers.get('content-disposition')
    let fileName = `${file.value.name.replace(/\.[^/.]+$/, '')}.pdf`
    
    if (contentDisposition) {
      const matches = contentDisposition.match(/filename="(.+)"/)
      if (matches && matches[1]) {
        fileName = matches[1]
      }
    }

    // Download the PDF
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    statusText.value = 'Conversion completed!'

  } catch (err) {
    statusText.value = 'Conversion failed'
    alert('Conversion failed: ' + err.message)
    console.error('PPT to PDF error:', err)
  } finally {
    if (fakeProgress) clearInterval(fakeProgress)
    loading.value = false
    setTimeout(() => {
      progress.value = 0
      statusText.value = ''
    }, 2000)
  }
}

const updateStatusText = (progressValue) => {
  if (progressValue < 20) {
    statusText.value = 'Analyzing PowerPoint file...'
  } else if (progressValue < 40) {
    statusText.value = 'Extracting slides...'
  } else if (progressValue < 60) {
    statusText.value = 'Converting slides to images...'
  } else if (progressValue < 80) {
    statusText.value = 'Generating PDF document...'
  } else {
    statusText.value = 'Finalizing PDF...'
  }
}

const clearFile = () => {
  file.value = null
  const input = document.querySelector('input[type="file"]')
  if (input) input.value = ''
}
</script>

<template>
  <div class="converter">
    <h2>PPT to PDF Converter</h2>
    <p class="subtitle">Convert PowerPoint presentations to high-quality PDF documents</p>

    <!-- File Upload -->
    <label class="upload-box">
      <input
        type="file"
        :accept="supportedFormats.map(f => f.ext).join(',')"
        @change="selectFile"
        hidden
      />
      <div class="upload-content">
        <span class="icon">📊</span>
        <p><strong>Click to upload</strong> a PowerPoint file</p>
        <div class="supported-formats">
          <span v-for="format in supportedFormats" :key="format.ext" class="format-badge">
            {{ format.icon }} {{ format.ext }}
          </span>
        </div>
        <small class="file-info">{{ file ? file.name : 'No file selected' }}</small>
      </div>
    </label>

    <!-- Conversion Settings -->
    <div v-if="file" class="conversion-settings">
      <h3>Conversion Settings</h3>
      
      <!-- Quality Settings -->
      <div class="setting-group">
        <h4>📈 Output Quality</h4>
        <div class="quality-options">
          <label 
            v-for="quality in qualityOptions" 
            :key="quality.id"
            :class="['quality-option', { selected: conversionSettings.quality === quality.id }]"
          >
            <input 
              type="radio" 
              v-model="conversionSettings.quality" 
              :value="quality.id" 
              hidden
            />
            <div class="quality-content">
              <div class="quality-header">
                <span class="quality-name">{{ quality.name }}</span>
                <span class="quality-size">{{ quality.size }}</span>
              </div>
              <p class="quality-desc">{{ quality.desc }}</p>
            </div>
          </label>
        </div>
      </div>

      <!-- Layout Settings -->
      <div class="setting-group">
        <h4>📐 Page Layout</h4>
        <div class="layout-options">
          <label 
            v-for="layout in slidesPerPageOptions" 
            :key="layout.id"
            :class="['layout-option', { selected: conversionSettings.slidesPerPage === layout.id }]"
          >
            <input 
              type="radio" 
              v-model="conversionSettings.slidesPerPage" 
              :value="layout.id" 
              hidden
            />
            <div class="layout-content">
              <span class="layout-icon">{{ layout.icon }}</span>
              <div class="layout-info">
                <span class="layout-name">{{ layout.name }}</span>
                <span class="layout-desc">{{ layout.desc }}</span>
              </div>
            </div>
          </label>
        </div>
      </div>

      <!-- Additional Options -->
      <div class="additional-options">
        <h4>⚙️ Additional Options</h4>
        <div class="option-grid">
          <label class="option-item">
            <input type="checkbox" v-model="conversionSettings.includeNotes" />
            <span class="option-text">Include Speaker Notes</span>
          </label>
          <label class="option-item">
            <input type="checkbox" v-model="conversionSettings.includeHiddenSlides" />
            <span class="option-text">Include Hidden Slides</span>
          </label>
        </div>
      </div>

      <!-- Page Settings -->
      <div class="page-settings">
        <h4>📄 Page Settings</h4>
        <div class="page-options">
          <div class="page-option">
            <label>Page Size:</label>
            <select v-model="conversionSettings.pageSize" class="page-select">
              <option value="A4">A4 (210 × 297 mm)</option>
              <option value="Letter">Letter (216 × 279 mm)</option>
              <option value="Legal">Legal (216 × 356 mm)</option>
              <option value="A3">A3 (297 × 420 mm)</option>
            </select>
          </div>
          <div class="page-option">
            <label>Orientation:</label>
            <select v-model="conversionSettings.orientation" class="page-select">
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Preview Info -->
    <div v-if="file" class="preview-info">
      <div class="preview-card">
        <div class="preview-icon">📊</div>
        <div class="preview-details">
          <h4>File Ready for Conversion</h4>
          <p>{{ file.name }}</p>
          <div class="file-stats">
            <span>Size: {{ (file.size / 1024 / 1024).toFixed(2) }} MB</span>
            <span>Type: {{ file.name.split('.').pop().toUpperCase() }}</span>
          </div>
        </div>
      </div>
    </div>
    <!-- Action Buttons -->
    <div class="action-buttons">
      <button v-if="file" @click="clearFile" class="secondary-btn">
        Clear File
      </button>
      <button 
        class="convert-btn" 
        @click="convertPptToPdf" 
        :disabled="loading || !file"
      >
        <span v-if="loading">🔄 Converting PPT to PDF...</span>
        <span v-else>🚀 Convert to PDF</span>
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
  max-width: 800px;
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
  border-color: #8FBC5D;
  background: #f5f9f0;
}

.upload-content .icon {
  font-size: 42px;
  display: block;
  margin-bottom: 12px;
}

.supported-formats {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  margin: 15px 0;
}

.format-badge {
  background: #e9ecef;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  color: #666;
}

.file-info {
  display: block;
  margin-top: 10px;
  font-weight: 500;
  color: #8FBC5D !important;
}

/* Conversion Settings */
.conversion-settings {
  background: #f8f9fa;
  padding: 25px;
  border-radius: 12px;
  margin-bottom: 25px;
  border: 1px solid #e9ecef;
  text-align: left;
}

.conversion-settings h3 {
  font-size: 18px;
  color: #333;
  margin: 0 0 20px 0;
  text-align: center;
}

.setting-group {
  margin-bottom: 25px;
}

.setting-group h4 {
  font-size: 16px;
  color: #333;
  margin: 0 0 15px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Quality Options */
.quality-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.quality-option {
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.quality-option:hover {
  border-color: #8FBC5D;
}

.quality-option.selected {
  border-color: #8FBC5D;
  background: #f5f9f0;
}

.quality-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.quality-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.quality-size {
  font-size: 12px;
  color: #666;
  background: #f8f9fa;
  padding: 2px 8px;
  border-radius: 10px;
}

.quality-desc {
  font-size: 13px;
  color: #666;
  margin: 0;
  line-height: 1.5;
}

/* Layout Options */
.layout-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
}

.layout-option {
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.layout-option:hover {
  border-color: #8FBC5D;
}

.layout-option.selected {
  border-color: #8FBC5D;
  background: #f5f9f0;
}

.layout-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.layout-icon {
  font-size: 24px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 8px;
}

.layout-info {
  flex: 1;
  text-align: left;
}

.layout-name {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.layout-desc {
  display: block;
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

/* Additional Options */
.additional-options h4 {
  margin-bottom: 15px;
}

.option-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
}

.option-item input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #8FBC5D;
}

.option-text {
  flex: 1;
}

/* Page Settings */
.page-settings h4 {
  margin-bottom: 15px;
}

.page-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.page-option {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.page-option label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.page-select {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  cursor: pointer;
}

.page-select:focus {
  outline: none;
  border-color: #8FBC5D;
}

/* Preview Info */
.preview-info {
  margin-bottom: 25px;
}

.preview-card {
  display: flex;
  align-items: center;
  gap: 20px;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 20px;
  text-align: left;
}

.preview-icon {
  font-size: 40px;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f9f0;
  border-radius: 12px;
}

.preview-details h4 {
  font-size: 16px;
  color: #333;
  margin: 0 0 8px 0;
}

.preview-details p {
  font-size: 14px;
  color: #666;
  margin: 0 0 10px 0;
}

.file-stats {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: #999;
}

/* Tips Section */
.tips-section {
  background: #fff8e1;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #ffecb3;
  margin-bottom: 25px;
}

.tips-section h4 {
  font-size: 16px;
  color: #333;
  margin: 0 0 15px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

.tips-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}

.tip {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  text-align: left;
}

.tip-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.tip p {
  font-size: 13px;
  color: #666;
  margin: 0;
  line-height: 1.5;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin: 30px 0;
}

.convert-btn {
  flex: 1;
  max-width: 300px;
  padding: 16px 30px;
  font-size: 16px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  background: linear-gradient(135deg, #8FBC5D, #7CAF4D);
  color: white;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(143, 188, 93, 0.2);
}

.convert-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(143, 188, 93, 0.3);
  background: linear-gradient(135deg, #7CAF4D, #6BA23D);
}

.convert-btn:disabled {
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
  color: #8FBC5D;
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
  background: linear-gradient(90deg, #8FBC5D, #A3D47A);
  transition: width 0.3s ease;
}
</style>