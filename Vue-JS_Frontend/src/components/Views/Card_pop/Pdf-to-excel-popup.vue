<script setup>
import { ref, computed } from 'vue'

const file = ref(null)
const loading = ref(false)
const progress = ref(0)
const statusText = ref('')
const processingTime = ref('')
const fileSize = ref('')

// Conversion settings
const conversionSettings = ref({
  format: 'xlsx', // 'xlsx', 'xls', 'csv'
  extractionMode: 'automatic', // 'automatic', 'tables', 'text', 'all'
  includeHeaders: true,
  preserveFormatting: true,
  extractImages: false,
  multipleSheets: true,
  dataTypeDetection: 'automatic' // 'automatic', 'text', 'numbers', 'dates'
})

// Table detection options
const tableDetection = ref({
  detectTables: true,
  detectBorders: true,
  mergeCells: true,
  detectMergedCells: true,
  ignoreEmptyCells: true
})

// Estimate processing time based on file size
const estimateTime = (sizeMB) => {
  if (sizeMB < 2) return '5-10 seconds'
  if (sizeMB < 10) return '10-30 seconds'
  if (sizeMB < 50) return '30-60 seconds'
  return '1-2 minutes'
}

const selectFile = (e) => {
  const selectedFile = e.target.files[0]
  if (!selectedFile) return
  
  if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
    alert('Please select a PDF file')
    e.target.value = ''
    return
  }
  
  file.value = selectedFile
  fileSize.value = (selectedFile.size / (1024 * 1024)).toFixed(1) + ' MB'
  console.log('PDF file selected for Excel conversion:', selectedFile.name)
}

const convertPdfToExcel = async () => {
  if (!file.value) {
    alert('Please select a PDF file')
    return
  }

  loading.value = true
  progress.value = 0
  statusText.value = 'Starting PDF analysis...'
  processingTime.value = ''
  
  const startTime = Date.now()

  const formData = new FormData()
  formData.append('file', file.value)
  formData.append('settings', JSON.stringify({
    conversion: conversionSettings.value,
    tables: tableDetection.value
  }))

  let fakeProgress = null
  let progressInterval = null

  try {
    // More realistic progress simulation based on typical conversion stages
    const stages = [
      { min: 0, max: 15, duration: 2000 },  // Upload & analysis
      { min: 15, max: 40, duration: 3000 }, // Table detection
      { min: 40, max: 70, duration: 4000 }, // Data extraction
      { min: 70, max: 90, duration: 3000 }  // Excel creation
    ]
    
    let currentStage = 0
    let stageStartTime = Date.now()
    
    progressInterval = setInterval(() => {
      const now = Date.now()
      const stageElapsed = now - stageStartTime
      const stageDuration = stages[currentStage].duration
      
      // Calculate progress within current stage
      const stageProgress = Math.min(1, stageElapsed / stageDuration)
      const stageRange = stages[currentStage].max - stages[currentStage].min
      const newProgress = stages[currentStage].min + (stageProgress * stageRange)
      
      if (newProgress > progress.value) {
        progress.value = Math.min(90, newProgress)
      }
      
      // Move to next stage if current one is complete
      if (stageProgress >= 1 && currentStage < stages.length - 1) {
        currentStage++
        stageStartTime = now
      }
      
      updateStatusText(progress.value)
      
    }, 200)

    // Call conversion API
    const res = await fetch('http://192.168.18.101:3000/api/pdf-to-excel', {
      method: 'POST',
      body: formData
    })

    clearInterval(progressInterval)
    progress.value = 95
    statusText.value = 'Finalizing Excel file...'

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`Server error: ${res.status} - ${errorText}`)
    }

    // Get processing time from headers
    const procTime = res.headers.get('X-Processing-Time') || '0s'
    const fSize = res.headers.get('X-File-Size') || 'Unknown'
    
    processingTime.value = `Processed in ${procTime}`
    
    // Get filename
    const contentDisposition = res.headers.get('content-disposition')
    let fileName = `${file.value.name.replace('.pdf', '')}.${conversionSettings.value.format}`
    
    if (contentDisposition) {
      const matches = contentDisposition.match(/filename="(.+)"/)
      if (matches && matches[1]) {
        fileName = matches[1]
      }
    }

    // Calculate total time
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`Total conversion time: ${totalTime}s`)

    // Download the Excel file
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    progress.value = 100
    statusText.value = `✅ Conversion complete! Downloading...`

    // Show success message with stats
    setTimeout(() => {
      statusText.value = `✅ Complete! File: ${fileName}`
    }, 1000)

  } catch (err) {
    statusText.value = '❌ Conversion failed'
    console.error('PDF to Excel error:', err)
    
    let userMessage = 'Conversion failed: '
    if (err.message.includes('No tables detected')) {
      userMessage += 'The PDF does not contain extractable tables.'
    } else if (err.message.includes('timeout')) {
      userMessage += 'Conversion took too long. Try a smaller PDF.'
    } else {
      userMessage += err.message
    }
    
    alert(userMessage)
    
  } finally {
    if (progressInterval) clearInterval(progressInterval)
    
    // Reset after delay
    setTimeout(() => {
      loading.value = false
      progress.value = 0
      statusText.value = ''
    }, 3000)
  }
}

const updateStatusText = (progressValue) => {
  if (progressValue < 10) {
    statusText.value = '📤 Uploading PDF to server...'
  } else if (progressValue < 25) {
    statusText.value = '🔍 Analyzing PDF structure...'
  } else if (progressValue < 40) {
    statusText.value = '📋 Detecting tables and data...'
  } else if (progressValue < 60) {
    statusText.value = '📝 Extracting text content...'
  } else if (progressValue < 80) {
    statusText.value = '💾 Processing table data...'
  } else if (progressValue < 95) {
    statusText.value = '📊 Formatting Excel spreadsheet...'
  } else {
    statusText.value = '🎯 Finalizing and downloading...'
  }
}

const clearFile = () => {
  file.value = null
  fileSize.value = ''
  processingTime.value = ''
  const input = document.querySelector('input[type="file"]')
  if (input) input.value = ''
}
</script>

<template>
  <div class="converter">
    <h2>PDF to Excel Converter</h2>
    <p class="subtitle">Extract tables and data from PDFs to editable Excel spreadsheets</p>

    <!-- File Upload -->
    <label class="upload-box">
      <input
        type="file" name="file"
        accept=".pdf"
        @change="selectFile"
        hidden
      />
      <div class="upload-content">
        <p style="margin: 0;"><strong>Click to upload</strong> a PDF file</p>
        <div class="file-details">
          <small class="file-info">{{ file ? file.name : 'No file selected' }}</small>
          <small v-if="fileSize" class="file-size">Size: {{ fileSize }}</small>
          <small v-if="file && !processingTime" class="time-estimate">
            ⏱️ Estimated: {{ estimateTime(parseFloat(fileSize)) }}
          </small>
        </div>
        <small>Extract tables, lists, and structured data</small>
      </div>
    </label>

    <!-- Action Buttons -->
    <div class="action-buttons">
      <button v-if="file" @click="clearFile" class="secondary-btn" :disabled="loading">
        ✕ Clear File
      </button>
      <button 
        class="convert-btn" 
        @click="convertPdfToExcel" 
        :disabled="loading || !file"
        :class="{ loading: loading }"
      >
        <template v-if="loading">
          <span class="spinner">⟳</span>
          Converting... {{ progress.toFixed(0) }}%
        </template>
        <template v-else>
          Convert to Excel
        </template>
      </button>
    </div>
  </div>
</template>

<style scoped>
.converter {
  text-align: center;
  max-width: 800px;
  margin: 0 auto;
  padding: 15px 10px;
}

h2 {
  font-size: 24px;
  font-weight: 500;
  color: #333;
  background: linear-gradient(135deg, #217346, #2e8b57);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
}

.subtitle {
  font-size: 16px;
  color: #666;
  line-height: 1.5;
  margin: 0;
}

.upload-box {
  display: block;
  border: 3px dashed #aaa;
  border-radius: 16px;
  padding: 10px 5px;
  cursor: pointer;
  background: #f9f9f9;
  transition: all 0.3s ease;
}

.upload-box:hover {
  border-color: #217346;
  background: #f0f9f4;
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(33, 115, 70, 0.1);
}

.upload-content .icon {
  font-size: 48px;
  display: block;
  margin-bottom: 15px;
}

.file-details {
  margin: 15px 0;
}

.file-info {
  display: block;
  font-weight: 600;
  color: #217346 !important;
  font-size: 15px;
}

.file-size, .time-estimate {
  display: block;
  font-size: 13px;
  color: #666;
  margin: 3px 0;
}

.file-info-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e9ecef;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin: 10px 0;
}

.convert-btn {
  flex: 1;
  max-width: 350px;
  padding: 10px 15px;
  background: linear-gradient(135deg, #217346, #2e8b57);
  color: white;
  border: none;
  border-radius: 14px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 8px 25px rgba(33, 115, 70, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 40px;
}

.convert-btn:hover:not(:disabled) {
  box-shadow: 0 12px 30px rgba(33, 115, 70, 0.4);
  background: linear-gradient(135deg, #2e8b57, #217346);
}

.convert-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.convert-btn.loading {
  background: linear-gradient(135deg, #6b7280, #4b5563);
}

.secondary-btn {
  padding: 5px 10px;
  background: white;
  border: 2px solid #d1d5db;
  border-radius: 14px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 16px;
}

.secondary-btn:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
  color: #374151;
}

.secondary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  display: inline-block;
  animation: spin 1s linear infinite;
  font-size: 20px;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Progress Section */
.progress-section {
  margin: 40px 0;
  padding: 30px;
  background: white;
  border-radius: 16px;
  border: 1px solid #e9ecef;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.progress-header .status {
  font-weight: 600;
  color: #374151;
  font-size: 17px;
}

.progress-header .percentage {
  font-weight: 700;
  color: #217346;
  font-size: 18px;
  background: #f0f9f4;
  padding: 6px 15px;
  border-radius: 20px;
}

.progress-container {
  margin-bottom: 30px;
}

.progress-bar {
  height: 14px;
  background: #f3f4f6;
  border-radius: 7px;
  overflow: hidden;
  margin-bottom: 10px;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #217346, #2e8b57, #34d399);
  border-radius: 7px;
  transition: width 0.5s ease;
  position: relative;
  overflow: hidden;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: shimmer 2s infinite;
}

.progress-text {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: white;
  font-size: 11px;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.progress-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #9ca3af;
  padding: 0 5px;
  margin-top: 5px;
}

.progress-stages {
  display: flex;
  justify-content: space-between;
  position: relative;
  margin-top: 40px;
}

.progress-stages::before {
  content: '';
  position: absolute;
  top: 10px;
  left: 0;
  right: 0;
  height: 3px;
  background: #f3f4f6;
  z-index: 1;
}

.stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 2;
}

.stage-dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #f3f4f6;
  border: 3px solid #f3f4f6;
  margin-bottom: 8px;
  transition: all 0.3s;
}

.stage.active .stage-dot {
  background: white;
  border-color: #217346;
  box-shadow: 0 0 0 3px rgba(33, 115, 70, 0.2);
}

.stage-label {
  font-size: 13px;
  color: #9ca3af;
  font-weight: 500;
  text-align: center;
}

.stage.active .stage-label {
  color: #374151;
  font-weight: 600;
}

@keyframes shimmer {
  100% { left: 100%; }
}

/* Tips Box */
.tips-box {
  background: linear-gradient(135deg, #f0f9f4, #e8f5e9);
  border: 1px solid #c8e6c9;
  border-radius: 16px;
  padding: 25px;
  margin-top: 30px;
}

.tips-box h4 {
  margin: 0 0 15px 0;
  color: #217346;
  font-size: 18px;
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

.tips-box ul {
  margin: 0;
  padding-left: 20px;
  list-style: none;
}

.tips-box li {
  margin-bottom: 10px;
  color: #2e7d32;
  font-size: 14px;
  line-height: 1.5;
  position: relative;
  padding-left: 25px;
}

.tips-box li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: #217346;
  font-weight: bold;
}

.tips-box li:last-child {
  margin-bottom: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .converter {
    padding: 20px 15px;
  }
  
  .upload-box {
    padding: 30px 20px;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .convert-btn,
  .secondary-btn {
    width: 100%;
    max-width: none;
  }
  
  .progress-section {
    padding: 20px;
  }
  
  .progress-stages {
    flex-wrap: wrap;
    gap: 20px;
    justify-content: space-around;
  }
  
  .stage {
    min-width: 80px;
  }
}

@media (max-width: 480px) {
  .file-info-card {
    padding: 15px;
  }
  
  .info-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
  
  .progress-labels {
    font-size: 10px;
  }
}
</style>