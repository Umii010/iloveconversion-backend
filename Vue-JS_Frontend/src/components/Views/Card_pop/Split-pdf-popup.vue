<script setup>
import { ref } from 'vue'

const file = ref(null)
const loading = ref(false)
const progress = ref(0)
const statusText = ref('')
const totalPages = ref(0)
const splitMethod = ref('ranges') // 'ranges', 'single', 'custom'
const pageRanges = ref([''])
const splitEvery = ref(1)
const selectedPages = ref('')
const outputFormat = ref('multiple') // 'multiple', 'zip'

// Page preview for selection
const pagePreview = ref([
  { number: 1, selected: true },
  { number: 2, selected: true },
  { number: 3, selected: true },
  { number: 4, selected: true },
  { number: 5, selected: true }
])

const selectFile = async (e) => {
  const selectedFile = e.target.files[0]
  if (!selectedFile) return
  
  file.value = selectedFile
  
  // Simulate getting page count (in real app, use PDF.js)
  // For demo, we'll use a random number or parse filename
  const pageMatch = selectedFile.name.match(/(\d+)\s*pages?/i)
  if (pageMatch) {
    totalPages.value = parseInt(pageMatch[1])
  } else {
    // Default page count for demo
    totalPages.value = Math.floor(Math.random() * 50) + 5
  }
  
  // Initialize page preview
  initializePagePreview()
  
  console.log('File selected for splitting:', selectedFile.name, 'Pages:', totalPages.value)
}

const initializePagePreview = () => {
  pagePreview.value = []
  const pagesToShow = Math.min(totalPages.value, 10) // Show max 10 pages in preview
  
  for (let i = 1; i <= pagesToShow; i++) {
    pagePreview.value.push({
      number: i,
      selected: true
    })
  }
  
  // Initialize page ranges
  pageRanges.value = [`1-${totalPages.value}`]
  selectedPages.value = Array.from({length: totalPages.value}, (_, i) => i + 1).join(',')
}

const addRange = () => {
  pageRanges.value.push('')
}

const removeRange = (index) => {
  if (pageRanges.value.length > 1) {
    pageRanges.value.splice(index, 1)
  }
}

const validatePageRange = (range, index) => {
  if (!range.trim()) return true
  
  const parts = range.split('-')
  if (parts.length !== 2) return false
  
  const start = parseInt(parts[0])
  const end = parseInt(parts[1])
  
  if (isNaN(start) || isNaN(end) || start < 1 || end > totalPages.value || start > end) {
    return false
  }
  
  return true
}

const togglePageSelection = (pageNumber) => {
  const page = pagePreview.value.find(p => p.number === pageNumber)
  if (page) {
    page.selected = !page.selected
    
    // Update selected pages string
    const selected = pagePreview.value.filter(p => p.selected).map(p => p.number)
    selectedPages.value = selected.join(',')
  }
}

const selectAllPages = () => {
  pagePreview.value.forEach(page => {
    page.selected = true
  })
  selectedPages.value = Array.from({length: totalPages.value}, (_, i) => i + 1).join(',')
}

const clearSelection = () => {
  pagePreview.value.forEach(page => {
    page.selected = false
  })
  selectedPages.value = ''
}

const selectEvenPages = () => {
  pagePreview.value.forEach(page => {
    page.selected = page.number % 2 === 0
  })
  updateSelectedPagesFromPreview()
}

const selectOddPages = () => {
  pagePreview.value.forEach(page => {
    page.selected = page.number % 2 === 1
  })
  updateSelectedPagesFromPreview()
}

const updateSelectedPagesFromPreview = () => {
  const selected = pagePreview.value.filter(p => p.selected).map(p => p.number)
  selectedPages.value = selected.join(',')
}

const getSplitSummary = () => {
  if (!totalPages.value) return ''
  
  let splitCount = 0
  let description = ''
  
  switch(splitMethod.value) {
    case 'ranges':
      const validRanges = pageRanges.value.filter(range => validatePageRange(range, 0))
      splitCount = validRanges.length
      description = `${splitCount} range${splitCount !== 1 ? 's' : ''} specified`
      break
      
    case 'single':
      splitCount = totalPages.value
      description = `${splitCount} individual page${splitCount !== 1 ? 's' : ''}`
      break
      
    case 'custom':
      if (selectedPages.value.trim()) {
        const pages = selectedPages.value.split(',').map(p => parseInt(p.trim())).filter(p => !isNaN(p))
        splitCount = pages.length
        description = `${splitCount} selected page${splitCount !== 1 ? 's' : ''}`
      } else {
        description = 'No pages selected'
      }
      break
      
    case 'interval':
      splitCount = Math.ceil(totalPages.value / splitEvery.value)
      description = `Split every ${splitEvery.value} page${splitEvery.value !== 1 ? 's' : ''} (${splitCount} files)`
      break
  }
  
  return description
}

const splitPdf = async () => {
  if (!file.value) {
    alert('Please select a PDF file')
    return
  }

  // Validate inputs based on method
  let validationError = ''
  
  switch(splitMethod.value) {
    case 'ranges':
      pageRanges.value.forEach((range, index) => {
        if (range.trim() && !validatePageRange(range, index)) {
          validationError = `Invalid page range: "${range}". Format: "start-end" (e.g., "1-5")`
        }
      })
      break
      
    case 'custom':
      if (!selectedPages.value.trim()) {
        validationError = 'Please select at least one page'
      } else {
        const pages = selectedPages.value.split(',').map(p => parseInt(p.trim()))
        const invalidPages = pages.filter(p => isNaN(p) || p < 1 || p > totalPages.value)
        if (invalidPages.length > 0) {
          validationError = `Invalid page numbers: ${invalidPages.join(', ')}`
        }
      }
      break
      
    case 'interval':
      if (splitEvery.value < 1 || splitEvery.value > totalPages.value) {
        validationError = `Split interval must be between 1 and ${totalPages.value}`
      }
      break
  }
  
  if (validationError) {
    alert(validationError)
    return
  }

  loading.value = true
  progress.value = 0
  statusText.value = 'Preparing to split PDF...'

  const formData = new FormData()
  formData.append('file', file.value)
  formData.append('method', splitMethod.value)
  formData.append('outputFormat', outputFormat.value)
  
  // Add method-specific data
  switch(splitMethod.value) {
    case 'ranges':
      formData.append('ranges', JSON.stringify(pageRanges.value.filter(r => r.trim())))
      break
    case 'single':
      formData.append('single', 'true')
      break
    case 'custom':
      formData.append('pages', selectedPages.value)
      break
    case 'interval':
      formData.append('interval', splitEvery.value.toString())
      break
  }

  let fakeProgress = null

  try {
    fakeProgress = setInterval(() => {
      if (progress.value < 90) {
        progress.value += Math.random() * 10
        updateStatusText(progress.value)
      }
    }, 500)

    // Call split API
    const res = await fetch('http://192.168.0.171:3000/api/split-pdf', {
      method: 'POST',
      body: formData
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`Server error: ${res.status} - ${errorText}`)
    }

    clearInterval(fakeProgress)
    progress.value = 100
    statusText.value = 'Splitting completed! Downloading...'

    // Handle response
    const contentType = res.headers.get('content-type')
    const contentDisposition = res.headers.get('content-disposition')
    
    let fileName = 'split_result'
    
    if (contentDisposition) {
      const matches = contentDisposition.match(/filename="(.+)"/)
      if (matches && matches[1]) {
        fileName = matches[1]
      }
    }
    
    if (contentType.includes('application/zip') || outputFormat.value === 'zip') {
      fileName = fileName.endsWith('.zip') ? fileName : `${fileName}.zip`
    } else if (contentType.includes('application/pdf')) {
      fileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`
    }
    
    const blob = await res.blob()
    downloadBlob(blob, fileName)

    statusText.value = 'PDF split successfully!'

  } catch (err) {
    statusText.value = 'Splitting failed'
    alert('Splitting failed: ' + err.message)
    console.error('Split error:', err)
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
    statusText.value = 'Analyzing document...'
  } else if (progressValue < 60) {
    statusText.value = 'Splitting pages...'
  } else if (progressValue < 80) {
    statusText.value = 'Creating output files...'
  } else {
    statusText.value = 'Finalizing...'
  }
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

const clearFile = () => {
  file.value = null
  totalPages.value = 0
  pageRanges.value = ['']
  selectedPages.value = ''
  pagePreview.value = []
  
  const input = document.querySelector('input[type="file"]')
  if (input) input.value = ''
}

// Quick split options
const quickSplit = (option) => {
  switch(option) {
    case 'halves':
      if (totalPages.value >= 2) {
        const mid = Math.ceil(totalPages.value / 2)
        pageRanges.value = [`1-${mid}`, `${mid + 1}-${totalPages.value}`]
        splitMethod.value = 'ranges'
      }
      break
      
    case 'quarters':
      if (totalPages.value >= 4) {
        const quarter = Math.ceil(totalPages.value / 4)
        pageRanges.value = [
          `1-${quarter}`,
          `${quarter + 1}-${quarter * 2}`,
          `${quarter * 2 + 1}-${quarter * 3}`,
          `${quarter * 3 + 1}-${totalPages.value}`
        ]
        splitMethod.value = 'ranges'
      }
      break
      
    case 'remove-first-last':
      if (totalPages.value > 2) {
        selectedPages.value = Array.from({length: totalPages.value - 2}, (_, i) => i + 2).join(',')
        splitMethod.value = 'custom'
        initializePagePreview()
        pagePreview.value.forEach(page => {
          page.selected = page.number !== 1 && page.number !== totalPages.value
        })
      }
      break
      
    case 'even-only':
      selectEvenPages()
      splitMethod.value = 'custom'
      break
      
    case 'odd-only':
      selectOddPages()
      splitMethod.value = 'custom'
      break
  }
}
</script>

<template>
  <div class="converter">
    <h2>Split PDF</h2>
    <p class="subtitle">Split PDF into multiple files by page ranges, intervals, or extract specific pages</p>

    <!-- File Upload -->
    <label class="upload-box">
      <input
        type="file"
        accept=".pdf"
        @change="selectFile"
        hidden
      />
      <div class="upload-content">
        <span class="icon">✂️</span>
        <p><strong>Click to upload</strong> a PDF file</p>
        <small>{{ file ? file.name : 'No file selected' }}</small>
        <small v-if="totalPages > 0" class="page-count">📄 {{ totalPages }} pages detected</small>
      </div>
    </label>

    <!-- Main Interface (shown when file is selected) -->
    <div v-if="file" class="split-interface">
      <!-- Quick Split Options -->
      <div class="quick-options">
        <h3>Quick Split Options</h3>
        <div class="quick-buttons">
          <button @click="quickSplit('halves')" :disabled="totalPages < 2" class="quick-btn">
            Split in Half
          </button>
          <button @click="quickSplit('quarters')" :disabled="totalPages < 4" class="quick-btn">
            Split in Quarters
          </button>
          <button @click="quickSplit('remove-first-last')" :disabled="totalPages <= 2" class="quick-btn">
            Remove First & Last Page
          </button>
          <button @click="quickSplit('even-only')" :disabled="totalPages < 2" class="quick-btn">
            Even Pages Only
          </button>
          <button @click="quickSplit('odd-only')" :disabled="totalPages < 2" class="quick-btn">
            Odd Pages Only
          </button>
        </div>
      </div>

      <!-- Split Method Selection -->
      <div class="method-selection">
        <h3>Split Method</h3>
        <div class="method-options">
          <label class="method-option">
            <input type="radio" v-model="splitMethod" value="ranges" />
            <div class="option-content">
              <span class="option-title">Page Ranges</span>
              <span class="option-desc">Split by specific page ranges (e.g., 1-5, 6-10)</span>
            </div>
          </label>
          
          <label class="method-option">
            <input type="radio" v-model="splitMethod" value="single" />
            <div class="option-content">
              <span class="option-title">Single Pages</span>
              <span class="option-desc">Extract each page as individual PDF</span>
            </div>
          </label>
          
          <label class="method-option">
            <input type="radio" v-model="splitMethod" value="custom" />
            <div class="option-content">
              <span class="option-title">Custom Selection</span>
              <span class="option-desc">Select specific pages to extract</span>
            </div>
          </label>
          
          <label class="method-option">
            <input type="radio" v-model="splitMethod" value="interval" />
            <div class="option-content">
              <span class="option-title">Split Every N Pages</span>
              <span class="option-desc">Split after every specified number of pages</span>
            </div>
          </label>
        </div>
      </div>

      <!-- Method-specific Configuration -->
      <div class="method-configuration">
        <!-- Page Ranges Method -->
        <div v-if="splitMethod === 'ranges'" class="config-section">
          <h4>Specify Page Ranges</h4>
          <p class="config-help">Enter page ranges in format "start-end" (e.g., "1-5", "6-10")</p>
          
          <div v-for="(range, index) in pageRanges" :key="index" class="range-input-group">
            <input
              type="text"
              v-model="pageRanges[index]"
              placeholder="e.g., 1-5"
              :class="['range-input', { 'invalid': range.trim() && !validatePageRange(range, index) }]"
            />
            <button @click="removeRange(index)" :disabled="pageRanges.length <= 1" class="remove-btn">
              ×
            </button>
          </div>
          
          <button @click="addRange" class="add-range-btn">
            + Add Another Range
          </button>
        </div>

        <!-- Single Pages Method -->
        <div v-if="splitMethod === 'single'" class="config-section">
          <h4>Extract All Pages Individually</h4>
          <p class="config-help">Each page will be saved as a separate PDF file</p>
          <div class="info-box">
            <p>📁 Will create {{ totalPages }} individual PDF files</p>
            <p>📦 Files will be packaged in a ZIP archive</p>
          </div>
        </div>

        <!-- Custom Selection Method -->
        <div v-if="splitMethod === 'custom'" class="config-section">
          <h4>Select Pages to Extract</h4>
          <p class="config-help">Click pages to select/deselect, or enter page numbers manually</p>
          
          <!-- Page Preview Grid -->
          <div class="page-preview">
            <div class="preview-controls">
              <button @click="selectAllPages" class="preview-control-btn">
                Select All
              </button>
              <button @click="clearSelection" class="preview-control-btn">
                Clear All
              </button>
              <button @click="selectEvenPages" class="preview-control-btn">
                Even Pages
              </button>
              <button @click="selectOddPages" class="preview-control-btn">
                Odd Pages
              </button>
            </div>
            
            <div class="page-grid">
              <div
                v-for="page in pagePreview"
                :key="page.number"
                @click="togglePageSelection(page.number)"
                :class="['page-tile', { 'selected': page.selected }]"
              >
                <span class="page-number">{{ page.number }}</span>
                <span v-if="page.selected" class="checkmark">✓</span>
              </div>
              <div v-if="totalPages > pagePreview.length" class="more-pages">
                +{{ totalPages - pagePreview.length }} more pages
              </div>
            </div>
            
            <div class="manual-input">
              <label>Or enter page numbers manually:</label>
              <input
                type="text"
                v-model="selectedPages"
                placeholder="e.g., 1,3,5-7,10"
                class="pages-input"
              />
              <small>Separate with commas, use hyphens for ranges</small>
            </div>
          </div>
        </div>

        <!-- Interval Method -->
        <div v-if="splitMethod === 'interval'" class="config-section">
          <h4>Split Every N Pages</h4>
          <div class="interval-control">
            <label>Split after every</label>
            <div class="interval-input-group">
              <input
                type="number"
                v-model.number="splitEvery"
                min="1"
                :max="totalPages"
                class="interval-input"
              />
              <span>page(s)</span>
            </div>
            <p class="config-help">Will create {{ Math.ceil(totalPages / splitEvery) }} PDF files</p>
          </div>
          
          <div class="interval-preview">
            <p><strong>Preview:</strong></p>
            <div class="interval-list">
              <div v-for="i in Math.ceil(totalPages / splitEvery)" :key="i" class="interval-item">
                File {{ i }}: Pages {{ (i-1)*splitEvery + 1 }} - {{ Math.min(i*splitEvery, totalPages) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Output Format -->
        <div class="output-format">
          <h4>Output Format</h4>
          <div class="format-options">
            <label class="format-option">
              <input type="radio" v-model="outputFormat" value="multiple" />
              <span>Multiple PDF files (ZIP)</span>
            </label>
            <label class="format-option">
              <input type="radio" v-model="outputFormat" value="zip" />
              <span>Single ZIP archive</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Split Summary -->
      <div class="split-summary">
        <h4>Split Summary</h4>
        <div class="summary-content">
          <div class="summary-item">
            <span class="summary-label">Original File:</span>
            <span class="summary-value">{{ file.name }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Total Pages:</span>
            <span class="summary-value">{{ totalPages }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Split Method:</span>
            <span class="summary-value">{{ 
              splitMethod === 'ranges' ? 'Page Ranges' :
              splitMethod === 'single' ? 'Single Pages' :
              splitMethod === 'custom' ? 'Custom Selection' : 'Split Every N Pages'
            }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Result:</span>
            <span class="summary-value highlight">{{ getSplitSummary() }}</span>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <button @click="clearFile" class="secondary-btn">
          Clear File
        </button>
        <button 
          class="split-btn" 
          @click="splitPdf" 
          :disabled="loading"
        >
          <span v-if="loading">🔄 Splitting PDF...</span>
          <span v-else>✂️ Split PDF Now</span>
        </button>
      </div>
    </div>

    <!-- Status & Progress -->
    <p v-if="loading" class="status-text">{{ statusText }}</p>
    <div v-if="loading" class="progress-wrapper">
      <div class="progress-bar" :style="{ width: progress + '%' }"></div>
    </div>

    <!-- Split Tips -->
    <div class="split-tips">
      <h4>💡 Tips for Splitting PDFs:</h4>
      <ul>
        <li>Use page ranges for splitting chapters or sections</li>
        <li>Select "Single Pages" to extract all pages individually</li>
        <li>Use custom selection for extracting specific pages only</li>
        <li>Large PDFs may take longer to process</li>
        <li>Resulting files will be packaged in a ZIP archive</li>
      </ul>
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
  border-color: #6a5acd;
  background: #f5f3ff;
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

.page-count {
  margin-top: 10px !important;
  font-weight: 500;
  color: #6a5acd !important;
  background: #f0eeff;
  padding: 4px 12px;
  border-radius: 20px;
  display: inline-block !important;
}

/* Split Interface */
.split-interface {
  margin-top: 20px;
}

/* Quick Options */
.quick-options {
  background: #f0eeff;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 25px;
  border: 1px solid #d9d6ff;
}

.quick-options h3 {
  font-size: 16px;
  color: #6a5acd;
  margin-bottom: 15px;
  text-align: center;
}

.quick-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

.quick-btn {
  padding: 10px 20px;
  background: white;
  border: 1px solid #d9d6ff;
  border-radius: 8px;
  color: #6a5acd;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
  min-width: 150px;
  max-width: 200px;
}

.quick-btn:hover:not(:disabled) {
  background: #6a5acd;
  color: white;
  border-color: #6a5acd;
}

.quick-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Method Selection */
.method-selection {
  background: #f8f9fa;
  padding: 25px;
  border-radius: 12px;
  margin-bottom: 25px;
  border: 1px solid #e9ecef;
}

.method-selection h3 {
  font-size: 18px;
  color: #333;
  margin-bottom: 20px;
  text-align: center;
}

.method-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.method-option {
  display: flex;
  align-items: flex-start;
  padding: 15px;
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.method-option:hover {
  border-color: #6a5acd;
  background: #f5f3ff;
}

.method-option input[type="radio"] {
  margin-right: 12px;
  margin-top: 3px;
  accent-color: #6a5acd;
}

.option-content {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.option-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.option-desc {
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

/* Method Configuration */
.method-configuration {
  background: white;
  padding: 25px;
  border-radius: 12px;
  margin-bottom: 25px;
  border: 1px solid #e9ecef;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.config-section {
  margin-bottom: 25px;
  padding-bottom: 25px;
  border-bottom: 1px solid #e9ecef;
}

.config-section:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.config-section h4 {
  font-size: 16px;
  color: #333;
  margin-bottom: 10px;
  text-align: left;
}

.config-help {
  font-size: 13px;
  color: #666;
  margin-bottom: 15px;
  text-align: left;
}

/* Range Inputs */
.range-input-group {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  align-items: center;
}

.range-input {
  flex: 1;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;
}

.range-input:focus {
  outline: none;
  border-color: #6a5acd;
  box-shadow: 0 0 0 2px rgba(106, 90, 205, 0.1);
}

.range-input.invalid {
  border-color: #ff6b6b;
  background: #fff5f5;
}

.remove-btn {
  width: 40px;
  height: 40px;
  background: #ff6b6b;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.remove-btn:hover:not(:disabled) {
  background: #ff5252;
}

.remove-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #ccc;
}

.add-range-btn {
  padding: 12px 20px;
  background: #f0eeff;
  border: 1px dashed #6a5acd;
  border-radius: 8px;
  color: #6a5acd;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  margin-top: 10px;
}

.add-range-btn:hover {
  background: #6a5acd;
  color: white;
}

/* Info Box */
.info-box {
  background: #f0f4fa;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #d1dce9;
  text-align: left;
}

.info-box p {
  margin: 8px 0;
  color: #555;
  font-size: 14px;
}

/* Page Preview */
.page-preview {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 10px;
}

.preview-controls {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.preview-control-btn {
  padding: 8px 16px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  color: #666;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.preview-control-btn:hover {
  background: #6a5acd;
  color: white;
  border-color: #6a5acd;
}

.page-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
  justify-content: center;
}

.page-tile {
  width: 50px;
  height: 50px;
  background: white;
  border: 2px solid #ddd;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.page-tile:hover {
  border-color: #6a5acd;
  transform: translateY(-2px);
}

.page-tile.selected {
  background: #6a5acd;
  border-color: #6a5acd;
  color: white;
}

.page-number {
  font-size: 14px;
  font-weight: 600;
}

.checkmark {
  position: absolute;
  top: 2px;
  right: 2px;
  font-size: 12px;
}

.more-pages {
  width: 150px;
  height: 50px;
  background: #f0f0f0;
  border: 2px dashed #ccc;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 13px;
}

.manual-input {
  margin-top: 20px;
  text-align: left;
}

.manual-input label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.pages-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 8px;
}

.pages-input:focus {
  outline: none;
  border-color: #6a5acd;
  box-shadow: 0 0 0 2px rgba(106, 90, 205, 0.1);
}

/* Interval Controls */
.interval-control {
  text-align: left;
}

.interval-input-group {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 15px 0;
}

.interval-input {
  width: 80px;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  text-align: center;
}

.interval-input:focus {
  outline: none;
  border-color: #6a5acd;
}

.interval-preview {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-top: 20px;
  text-align: left;
}

.interval-list {
  margin-top: 10px;
}

.interval-item {
  padding: 8px 12px;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  margin-bottom: 8px;
  font-size: 13px;
  color: #555;
}

/* Output Format */
.output-format {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 10px;
  margin-top: 20px;
}

.output-format h4 {
  text-align: left;
  margin-bottom: 15px;
}

.format-options {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.format-option {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.format-option input[type="radio"] {
  accent-color: #6a5acd;
}

/* Split Summary */
.split-summary {
  background: #f0eeff;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 25px;
  border: 1px solid #d9d6ff;
}

.split-summary h4 {
  font-size: 16px;
  color: #6a5acd;
  margin-bottom: 15px;
  text-align: center;
}

.summary-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.summary-item:last-child {
  border-bottom: none;
}

.summary-label {
  font-weight: 500;
  color: #666;
}

.summary-value {
  font-weight: 600;
  color: #333;
}

.summary-value.highlight {
  color: #6a5acd;
  font-weight: 700;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin: 30px 0;
}

.split-btn {
  flex: 1;
  max-width: 300px;
  padding: 18px 30px;
  font-size: 16px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  background: linear-gradient(135deg, #6a5acd, #5a4abd);
  color: white;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(106, 90, 205, 0.2);
}

.split-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(106, 90, 205, 0.3);
  background: linear-gradient(135deg, #5a4abd, #4a3aad);
}

.split-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.secondary-btn {
  padding: 18px 25px;
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
  color: #6a5acd;
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
  background: linear-gradient(90deg, #6a5acd, #8a7add);
  transition: width 0.3s ease;
}

/* Split Tips */
.split-tips {
  background: #fff8e1;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #ffecb3;
  margin-top: 25px;
  text-align: left;
}

.split-tips h4 {
  font-size: 16px;
  color: #333;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.split-tips ul {
  margin: 0;
  padding-left: 20px;
  color: #666;
}

.split-tips li {
  margin-bottom: 8px;
  line-height: 1.5;
  font-size: 13px;
}
</style>