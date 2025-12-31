<script setup>
import { ref } from 'vue'

const file = ref(null)
const loading = ref(false)
const progress = ref(0)
const statusText = ref('')

// Conversion settings
const conversionSettings = ref({
  format: 'pptx', // 'ppt', 'pptx', 'odp'
  layout: 'automatic', // 'automatic', 'single', 'grid'
  extractText: true,
  extractImages: true,
  preserveLayout: true,
  quality: 'high'
})

// Output formats
const outputFormats = ref([
  { id: 'pptx', name: 'PowerPoint (.pptx)', icon: '📊', desc: 'Modern PowerPoint format (recommended)' },
  { id: 'ppt', name: 'PowerPoint 97-2003 (.ppt)', icon: '📊', desc: 'Compatible with older versions' },
  { id: 'odp', name: 'OpenDocument (.odp)', icon: '📄', desc: 'OpenOffice/LibreOffice format' }
])

// Layout options
const layoutOptions = ref([
  { id: 'automatic', name: 'Automatic Detection', icon: '🤖', desc: 'Detect page layout automatically' },
  { id: 'single', name: 'Single Page per Slide', icon: '1️⃣', desc: 'Each PDF page becomes one slide' },
  { id: 'grid', name: 'Multi-page Grid', icon: '🔲', desc: 'Multiple PDF pages per slide' }
])

const selectFile = (e) => {
  const selectedFile = e.target.files[0]
  if (!selectedFile) return
  
  // Check if it's a PDF
  if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
    alert('Please select a PDF file')
    e.target.value = ''
    return
  }
  
  file.value = selectedFile
  console.log('PDF file selected:', selectedFile.name)
}

const convertPdfToPpt = async () => {
  if (!file.value) {
    alert('Please select a PDF file')
    return
  }

  loading.value = true
  progress.value = 0
  statusText.value = 'Starting conversion...'

  const formData = new FormData()
  formData.append('pdf', file.value)
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
    const res = await fetch('http://192.168.18.101:3000/api/pdf-to-ppt', {
      method: 'POST',
      body: formData
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`Server error: ${res.status} - ${errorText}`)
    }

    clearInterval(fakeProgress)
    progress.value = 100
    statusText.value = 'Downloading PowerPoint...'

    // Get filename
    const contentDisposition = res.headers.get('content-disposition')
    let fileName = `${file.value.name.replace(/\.[^/.]+$/, '')}.${conversionSettings.format}`
    
    if (contentDisposition) {
      const matches = contentDisposition.match(/filename="(.+)"/)
      if (matches && matches[1]) {
        fileName = matches[1]
      }
    }

    // Download the PowerPoint file
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
    console.error('PDF to PPT error:', err)
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
    statusText.value = 'Analyzing PDF document...'
  } else if (progressValue < 40) {
    statusText.value = 'Extracting content and images...'
  } else if (progressValue < 60) {
    statusText.value = 'Creating presentation structure...'
  } else if (progressValue < 80) {
    statusText.value = 'Generating PowerPoint slides...'
  } else {
    statusText.value = 'Finalizing presentation...'
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
    <h2>PDF to PowerPoint Converter</h2>
    <p class="subtitle">Convert PDF documents to editable PowerPoint presentations</p>

    <!-- File Upload -->
    <label class="upload-box">
      <input
        type="file"
        accept=".pdf"
        @change="selectFile"
        hidden
      />
      <div class="upload-content">
        <span class="icon">📄</span>
        <p><strong>Click to upload</strong> a PDF file</p>
        <small class="file-info">{{ file ? file.name : 'No file selected' }}</small>
        <small>Supports: PDF documents</small>
      </div>
    </label>

    <!-- Conversion Settings -->
    <div v-if="file" class="conversion-settings">
      <h3>Conversion Settings</h3>
      
      <!-- Output Format -->
      <div class="setting-group">
        <h4>📤 Output Format</h4>
        <div class="format-options">
          <label 
            v-for="format in outputFormats" 
            :key="format.id"
            :class="['format-option', { selected: conversionSettings.format === format.id }]"
          >
            <input 
              type="radio" 
              v-model="conversionSettings.format" 
              :value="format.id" 
              hidden
            />
            <div class="format-content">
              <span class="format-icon">{{ format.icon }}</span>
              <div class="format-info">
                <span class="format-name">{{ format.name }}</span>
                <span class="format-desc">{{ format.desc }}</span>
              </div>
            </div>
          </label>
        </div>
      </div>

      <!-- Layout Options -->
      <div class="setting-group">
        <h4>📐 Slide Layout</h4>
        <div class="layout-options">
          <label 
            v-for="layout in layoutOptions" 
            :key="layout.id"
            :class="['layout-option', { selected: conversionSettings.layout === layout.id }]"
          >
            <input 
              type="radio" 
              v-model="conversionSettings.layout" 
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

      <!-- Content Extraction -->
      <div class="setting-group">
        <h4>🔍 Content Extraction</h4>
        <div class="extraction-options">
          <label class="extraction-option">
            <input type="checkbox" v-model="conversionSettings.extractText" />
            <div class="extraction-content">
              <span class="extraction-icon">📝</span>
              <div class="extraction-info">
                <span class="extraction-name">Extract Text</span>
                <span class="extraction-desc">Convert PDF text to editable PowerPoint text</span>
              </div>
            </div>
          </label>
          <label class="extraction-option">
            <input type="checkbox" v-model="conversionSettings.extractImages" />
            <div class="extraction-content">
              <span class="extraction-icon">🖼️</span>
              <div class="extraction-info">
                <span class="extraction-name">Extract Images</span>
                <span class="extraction-desc">Convert PDF images to PowerPoint images</span>
              </div>
            </div>
          </label>
          <label class="extraction-option">
            <input type="checkbox" v-model="conversionSettings.preserveLayout" />
            <div class="extraction-content">
              <span class="extraction-icon">📏</span>
              <div class="extraction-info">
                <span class="extraction-name">Preserve Layout</span>
                <span class="extraction-desc">Maintain original PDF layout in slides</span>
              </div>
            </div>
          </label>
        </div>
      </div>

      <!-- Quality Settings -->
      <div class="setting-group">
        <h4>🎨 Output Quality</h4>
        <div class="quality-slider">
          <div class="quality-labels">
            <span>Fast Conversion</span>
            <span>Best Quality</span>
          </div>
          <input 
            type="range" 
            v-model="conversionSettings.quality" 
            min="1" 
            max="3" 
            step="1"
            class="quality-range"
          />
          <div class="quality-steps">
            <span :class="{ active: conversionSettings.quality === '1' }">Low</span>
            <span :class="{ active: conversionSettings.quality === '2' }">Medium</span>
            <span :class="{ active: conversionSettings.quality === '3' }">High</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Preview Info -->
    <div v-if="file" class="preview-info">
      <div class="preview-card">
        <div class="preview-icon">📄</div>
        <div class="preview-details">
          <h4>PDF Ready for Conversion</h4>
          <p>{{ file.name }}</p>
          <div class="file-stats">
            <span>Size: {{ (file.size / 1024 / 1024).toFixed(2) }} MB</span>
            <span>Type: PDF Document</span>
          </div>
          <div class="conversion-preview">
            <span class="preview-label">Will convert to:</span>
            <span class="preview-output">{{ outputFormats.find(f => f.id === conversionSettings.format)?.name }}</span>
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
        @click="convertPdfToPpt" 
        :disabled="loading || !file"
      >
        <span v-if="loading">🔄 Converting PDF to PowerPoint...</span>
        <span v-else>🚀 Convert to PowerPoint</span>
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
  border-color: #4a6fa5;
  background: #f0f4fa;
}

.upload-content .icon {
  font-size: 42px;
  display: block;
  margin-bottom: 12px;
}

.file-info {
  display: block;
  margin: 10px 0 5px;
  font-weight: 500;
  color: #4a6fa5 !important;
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

/* Format Options */
.format-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.format-option {
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.format-option:hover {
  border-color: #4a6fa5;
}

.format-option.selected {
  border-color: #4a6fa5;
  background: #f0f4fa;
}

.format-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.format-icon {
  font-size: 24px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 8px;
}

.format-info {
  flex: 1;
  text-align: left;
}

.format-name {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.format-desc {
  display: block;
  font-size: 12px;
  color: #666;
  line-height: 1.4;
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
  border-color: #4a6fa5;
}

.layout-option.selected {
  border-color: #4a6fa5;
  background: #f0f4fa;
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

/* Extraction Options */
.extraction-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.extraction-option {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.extraction-option:hover {
  border-color: #4a6fa5;
}

.extraction-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.extraction-icon {
  font-size: 20px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 8px;
}

.extraction-info {
  flex: 1;
  text-align: left;
}

.extraction-name {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.extraction-desc {
  display: block;
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

.extraction-option input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #4a6fa5;
}

/* Quality Slider */
.quality-slider {
  background: white;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.quality-labels {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 12px;
  color: #666;
}

.quality-range {
  width: 100%;
  height: 8px;
  -webkit-appearance: none;
  appearance: none;
  background: linear-gradient(90deg, #4a6fa5, #8FBC5D);
  border-radius: 4px;
  outline: none;
  margin: 10px 0;
}

.quality-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 24px;
  height: 24px;
  background: white;
  border: 2px solid #4a6fa5;
  border-radius: 50%;
  cursor: pointer;
}

.quality-steps {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
}

.quality-steps span {
  font-size: 13px;
  color: #999;
  padding: 4px 12px;
  border-radius: 20px;
  transition: all 0.3s;
}

.quality-steps span.active {
  background: #4a6fa5;
  color: white;
  font-weight: 500;
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
  background: #f0f4fa;
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
  margin-bottom: 10px;
}

.conversion-preview {
  display: flex;
  align-items: center;
  gap: 10px;
}

.preview-label {
  font-size: 12px;
  color: #666;
}

.preview-output {
  font-size: 13px;
  font-weight: 600;
  color: #4a6fa5;
  background: #f0f4fa;
  padding: 4px 12px;
  border-radius: 20px;
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

/* Use Cases */
.use-cases {
  background: #f0f4fa;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 25px;
  border: 1px solid #d1dce9;
}

.use-cases h4 {
  font-size: 16px;
  color: #333;
  margin: 0 0 20px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

.cases-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.use-case {
  background: white;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}

.case-icon {
  font-size: 32px;
  margin-bottom: 10px;
}

.use-case h5 {
  font-size: 14px;
  color: #333;
  margin: 0 0 8px 0;
  font-weight: 600;
}

.use-case p {
  font-size: 12px;
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
  background: linear-gradient(135deg, #4a6fa5, #3a5a8c);
  color: white;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(74, 111, 165, 0.2);
}

.convert-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(74, 111, 165, 0.3);
  background: linear-gradient(135deg, #3a5a8c, #2a4a7c);
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
</style>