<script setup>
import { ref, computed } from 'vue'

const file = ref(null)
const loading = ref(false)
const progress = ref(0)
const statusText = ref('')

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

// Sample extracted data for preview
const sampleData = ref([
  ['Invoice No.', 'Date', 'Customer', 'Amount', 'Status'],
  ['INV-2024-001', '2024-01-15', 'Acme Corporation', '$1,250.00', 'Paid'],
  ['INV-2024-002', '2024-01-16', 'Tech Solutions Inc.', '$3,450.00', 'Pending'],
  ['INV-2024-003', '2024-01-17', 'Global Industries', '$890.00', 'Paid'],
  ['INV-2024-004', '2024-01-18', 'Innovation Labs', '$2,150.00', 'Overdue'],
  ['INV-2024-005', '2024-01-19', 'Digital Creations', '$1,780.00', 'Paid'],
  ['TOTAL', '', '', '$9,520.00', '']
])

// Output formats
const outputFormats = ref([
  { id: 'xlsx', name: 'Excel (.xlsx)', icon: '📊', desc: 'Modern Excel format with multiple sheets' },
  { id: 'xls', name: 'Excel 97-2003 (.xls)', icon: '📊', desc: 'Compatible with older Excel versions' },
  { id: 'csv', name: 'CSV (.csv)', icon: '📄', desc: 'Simple comma-separated values' },
  { id: 'ods', name: 'OpenDocument (.ods)', icon: '📄', desc: 'OpenOffice/LibreOffice format' }
])

// Extraction modes
const extractionModes = ref([
  { id: 'automatic', name: 'Automatic Detection', icon: '🤖', desc: 'Automatically detect tables and data' },
  { id: 'tables', name: 'Tables Only', icon: '📊', desc: 'Extract only table structures' },
  { id: 'text', name: 'All Text', icon: '📝', desc: 'Extract all text content' },
  { id: 'all', name: 'Everything', icon: '🔍', desc: 'Extract tables, text, and metadata' }
])

// Data type detection options
const dataTypeOptions = ref([
  { id: 'automatic', name: 'Automatic Detection', desc: 'Detect data types automatically' },
  { id: 'text', name: 'Treat as Text', desc: 'Keep all data as text format' },
  { id: 'numbers', name: 'Detect Numbers', desc: 'Convert numbers to numeric format' },
  { id: 'dates', name: 'Detect Dates', desc: 'Convert date strings to date format' }
])

// Supported PDF types
const supportedPdfTypes = ref([
  { type: 'scanned', name: 'Scanned PDFs', icon: '📷', supported: 'Limited' },
  { type: 'digital', name: 'Digital PDFs', icon: '💻', supported: 'Full' },
  { type: 'forms', name: 'PDF Forms', icon: '📋', supported: 'Good' },
  { type: 'reports', name: 'Reports', icon: '📈', supported: 'Excellent' }
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
  console.log('PDF file selected for Excel conversion:', selectedFile.name)
  
  // Reset preview data
  sampleData.value = [
    ['File selected:', selectedFile.name, '', '', ''],
    ['Size:', (selectedFile.size / 1024 / 1024).toFixed(2) + ' MB', '', '', ''],
    ['Ready for conversion', '', '', '', '']
  ]
}

const convertPdfToExcel = async () => {
  if (!file.value) {
    alert('Please select a PDF file')
    return
  }

  loading.value = true
  progress.value = 0
  statusText.value = 'Starting PDF analysis...'

  const formData = new FormData()
  formData.append('pdf', file.value)
  formData.append('settings', JSON.stringify({
    conversion: conversionSettings.value,
    tables: tableDetection.value
  }))

  let fakeProgress = null

  try {
    // Fake progress for better UX
    fakeProgress = setInterval(() => {
      if (progress.value < 90) {
        progress.value += Math.random() * 8
        updateStatusText(progress.value)
      }
    }, 500)

    // Call conversion API
    const res = await fetch('http://192.168.18.101:3000/api/pdf-to-excel', {
      method: 'POST',
      body: formData
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`Server error: ${res.status} - ${errorText}`)
    }

    clearInterval(fakeProgress)
    progress.value = 100
    statusText.value = 'Downloading Excel file...'

    // Get filename
    const contentDisposition = res.headers.get('content-disposition')
    let fileName = `${file.value.name.replace('.pdf', '')}.${conversionSettings.value.format}`
    
    if (contentDisposition) {
      const matches = contentDisposition.match(/filename="(.+)"/)
      if (matches && matches[1]) {
        fileName = matches[1]
      }
    }

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

    statusText.value = 'Conversion completed!'

  } catch (err) {
    statusText.value = 'Conversion failed'
    alert('Conversion failed: ' + err.message)
    console.error('PDF to Excel error:', err)
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
  if (progressValue < 15) {
    statusText.value = 'Analyzing PDF structure...'
  } else if (progressValue < 30) {
    statusText.value = 'Detecting tables and data...'
  } else if (progressValue < 50) {
    statusText.value = 'Extracting text content...'
  } else if (progressValue < 70) {
    statusText.value = 'Processing table data...'
  } else if (progressValue < 85) {
    statusText.value = 'Formatting Excel sheet...'
  } else {
    statusText.value = 'Finalizing spreadsheet...'
  }
}

const clearFile = () => {
  file.value = null
  const input = document.querySelector('input[type="file"]')
  if (input) input.value = ''
  
  // Reset sample data
  sampleData.value = [
    ['No file selected', '', '', '', ''],
    ['Upload a PDF to see preview', '', '', '', ''],
    ['Supported: Tables, lists, forms', '', '', '', '']
  ]
}

// Generate sample preview data
const generateSamplePreview = () => {
  sampleData.value = [
    ['ID', 'Product', 'Category', 'Price', 'Stock', 'Last Updated'],
    ['P-001', 'Laptop Pro', 'Electronics', '$1,299.99', '45', '2024-01-15'],
    ['P-002', 'Wireless Mouse', 'Accessories', '$29.99', '120', '2024-01-14'],
    ['P-003', 'USB-C Cable', 'Accessories', '$19.99', '200', '2024-01-16'],
    ['P-004', 'Monitor 27"', 'Electronics', '$349.99', '25', '2024-01-13'],
    ['P-005', 'Keyboard', 'Accessories', '$79.99', '85', '2024-01-12'],
    ['P-006', 'Webcam HD', 'Electronics', '$89.99', '60', '2024-01-15'],
    ['TOTAL', '', '', '$1,869.94', '', '']
  ]
}

// Preview columns for sample data
const previewColumns = computed(() => {
  if (sampleData.value.length === 0) return []
  return sampleData.value[0].map((_, index) => `Column ${index + 1}`)
})
</script>

<template>
  <div class="converter">
    <h2>PDF to Excel Converter</h2>
    <p class="subtitle">Extract tables, data, and content from PDFs to editable Excel spreadsheets</p>

    <!-- File Upload -->
    <label class="upload-box">
      <input
        type="file"
        accept=".pdf"
        @change="selectFile"
        hidden
      />
      <div class="upload-content">
        <span class="icon">📊</span>
        <p><strong>Click to upload</strong> a PDF file</p>
        <small class="file-info">{{ file ? file.name : 'No file selected' }}</small>
        <small>Extract tables, lists, and data to Excel</small>
      </div>
    </label>


    <!-- Conversion Settings -->
    <div v-if="file" class="conversion-settings">
      <h3>Conversion Settings</h3>
      
      <!-- Output Format -->
      <div class="setting-group">
        <h4><span class="setting-icon">📤</span> Output Format</h4>
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
              <span class="option-icon">{{ format.icon }}</span>
              <div class="option-info">
                <span class="option-name">{{ format.name }}</span>
                <span class="option-desc">{{ format.desc }}</span>
              </div>
            </div>
          </label>
        </div>
      </div>

      <!-- Extraction Mode -->
      <div class="setting-group">
        <h4><span class="setting-icon">🔍</span> Extraction Mode</h4>
        <div class="mode-options">
          <label 
            v-for="mode in extractionModes" 
            :key="mode.id"
            :class="['mode-option', { selected: conversionSettings.extractionMode === mode.id }]"
          >
            <input 
              type="radio" 
              v-model="conversionSettings.extractionMode" 
              :value="mode.id" 
              hidden
            />
            <div class="mode-content">
              <span class="mode-icon">{{ mode.icon }}</span>
              <div class="mode-info">
                <span class="mode-name">{{ mode.name }}</span>
                <span class="mode-desc">{{ mode.desc }}</span>
              </div>
            </div>
          </label>
        </div>
      </div>

      <!-- Table Detection Settings -->
      <div class="setting-group" v-if="conversionSettings.extractionMode !== 'text'">
        <h4><span class="setting-icon">📊</span> Table Detection</h4>
        <div class="table-settings">
          <div class="table-grid">
            <label class="table-option">
              <input type="checkbox" v-model="tableDetection.detectTables" />
              <span class="table-text">Detect Tables</span>
              <span class="table-hint">Automatically find table structures</span>
            </label>
            <label class="table-option">
              <input type="checkbox" v-model="tableDetection.detectBorders" />
              <span class="table-text">Detect Borders</span>
              <span class="table-hint">Use border lines to identify tables</span>
            </label>
            <label class="table-option">
              <input type="checkbox" v-model="tableDetection.mergeCells" />
              <span class="table-text">Merge Cells</span>
              <span class="table-hint">Merge cells for better formatting</span>
            </label>
            <label class="table-option">
              <input type="checkbox" v-model="tableDetection.detectMergedCells" />
              <span class="table-text">Detect Merged Cells</span>
              <span class="table-hint">Identify merged cells in tables</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Data Processing -->
      <div class="setting-group">
        <h4><span class="setting-icon">⚙️</span> Data Processing</h4>
        <div class="data-settings">
          <div class="data-grid">
            <label class="data-option">
              <input type="checkbox" v-model="conversionSettings.includeHeaders" />
              <span class="data-text">Include Headers</span>
              <span class="data-hint">Include table headers in output</span>
            </label>
            <label class="data-option">
              <input type="checkbox" v-model="conversionSettings.preserveFormatting" />
              <span class="data-text">Preserve Formatting</span>
              <span class="data-hint">Keep original formatting where possible</span>
            </label>
            <label class="data-option">
              <input type="checkbox" v-model="conversionSettings.multipleSheets" />
              <span class="data-text">Multiple Sheets</span>
              <span class="data-hint">Create separate sheets for different tables</span>
            </label>
            <label class="data-option">
              <input type="checkbox" v-model="conversionSettings.extractImages" />
              <span class="data-text">Extract Images</span>
              <span class="data-hint">Include images in Excel (if any)</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Data Type Detection -->
      <div class="setting-group">
        <h4><span class="setting-icon">🔢</span> Data Type Detection</h4>
        <div class="data-type-options">
          <select v-model="conversionSettings.dataTypeDetection" class="data-type-select">
            <option v-for="option in dataTypeOptions" :key="option.id" :value="option.id">
              {{ option.name }} - {{ option.desc }}
            </option>
          </select>
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
        @click="convertPdfToExcel" 
        :disabled="loading || !file"
      >
        <span v-if="loading">🔄 Converting PDF to Excel...</span>
        <span v-else>🚀 Convert to Excel</span>
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
  max-width: 1200px;
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
  border-color: #217346;
  background: #f0f9f4;
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
  color: #217346 !important;
}

/* Supported PDF Types */
.supported-types {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 25px;
  border: 1px solid #e9ecef;
}

.supported-types h4 {
  font-size: 16px;
  color: #333;
  margin: 0 0 20px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

.types-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.type-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.type-icon {
  font-size: 24px;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f9f4;
  border-radius: 10px;
}

.type-info {
  text-align: left;
  flex: 1;
}

.type-name {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.type-support {
  display: block;
  font-size: 12px;
  color: #666;
  background: #f8f9fa;
  padding: 3px 8px;
  border-radius: 12px;
  display: inline-block;
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
  margin-bottom: 30px;
}

.setting-group h4 {
  font-size: 16px;
  color: #333;
  margin: 0 0 15px 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.setting-icon {
  font-size: 20px;
}

/* Format Options */
.format-options, .mode-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 12px;
}

.format-option, .mode-option {
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.format-option:hover, .mode-option:hover {
  border-color: #217346;
}

.format-option.selected, .mode-option.selected {
  border-color: #217346;
  background: #f0f9f4;
}

.format-content, .mode-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.option-icon, .mode-icon {
  font-size: 24px;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 8px;
  flex-shrink: 0;
}

.option-info, .mode-info {
  flex: 1;
  text-align: left;
}

.option-name, .mode-name {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.option-desc, .mode-desc {
  display: block;
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

/* Table Settings */
.table-settings, .data-settings {
  background: white;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.table-grid, .data-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.table-option, .data-option {
  display: flex;
  flex-direction: column;
  gap: 5px;
  cursor: pointer;
}

.table-text, .data-text {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}

.table-text::before, .data-text::before {
  content: '';
  width: 18px;
  height: 18px;
  border: 2px solid #ddd;
  border-radius: 4px;
  display: inline-block;
  vertical-align: middle;
}

.table-option input[type="checkbox"]:checked + .table-text::before,
.data-option input[type="checkbox"]:checked + .data-text::before {
  background: #217346;
  border-color: #217346;
  content: '✓';
  color: white;
  font-size: 12px;
  text-align: center;
  line-height: 14px;
}

.table-hint, .data-hint {
  font-size: 12px;
  color: #666;
  margin-left: 26px;
  line-height: 1.4;
}

.table-option input[type="checkbox"],
.data-option input[type="checkbox"] {
  display: none;
}

/* Data Type Options */
.data-type-options {
  background: white;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.data-type-select {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  cursor: pointer;
}

.data-type-select:focus {
  outline: none;
  border-color: #217346;
}

/* Data Preview */
.data-preview {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 25px;
  margin-bottom: 25px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.preview-header h3 {
  font-size: 18px;
  color: #333;
  margin: 0;
}

.preview-btn {
  padding: 8px 16px;
  background: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.preview-btn:hover:not(:disabled) {
  background: #217346;
  color: white;
  border-color: #217346;
}

.preview-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.preview-table {
  background: #f8f9fa;
  border-radius: 8px;
  overflow: hidden;
}

.table-container {
  overflow-x: auto;
  max-height: 300px;
  border: 1px solid #e9ecef;
}

.table-wrapper {
  min-width: 600px;
}

table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

th {
  background: #217346;
  color: white;
  padding: 12px 15px;
  text-align: left;
  font-weight: 600;
  font-size: 13px;
  position: sticky;
  top: 0;
  z-index: 10;
}

td {
  padding: 10px 15px;
  border-bottom: 1px solid #e9ecef;
  font-size: 13px;
  color: #333;
}

tr:nth-child(even) {
  background: #f8f9fa;}
  </style>