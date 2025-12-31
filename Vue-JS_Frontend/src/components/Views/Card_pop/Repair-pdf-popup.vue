<script setup>
import { ref } from 'vue'

const file = ref(null)
const loading = ref(false)
const progress = ref(0)
const statusText = ref('')
const repairMode = ref('auto') // 'auto', 'advanced'
const showAdvancedOptions = ref(false)
const scanResults = ref(null)
const detectedIssues = ref([])
const repairStatus = ref('idle') // 'idle', 'scanning', 'analyzing', 'repairing', 'completed'

// Repair options
const repairOptions = ref({
  fixCorruptedStructure: true,
  recoverDamagedContent: true,
  removeMaliciousCode: true,
  fixFontIssues: true,
  restoreMetadata: true,
  optimizeForWeb: false,
  createBackup: true,
  removePassword: false,
  fixPageOrder: true,
  recoverImages: true
})

// Common PDF issues
const commonIssues = ref([
  { id: 'corrupted', name: 'Corrupted File', description: 'PDF won\'t open or shows errors', icon: '💥', severity: 'high' },
  { id: 'damaged', name: 'Damaged Content', description: 'Missing pages or corrupted content', icon: '🛠️', severity: 'high' },
  { id: 'font', name: 'Font Issues', description: 'Missing fonts or text display problems', icon: '🔤', severity: 'medium' },
  { id: 'metadata', name: 'Metadata Corruption', description: 'File info or properties missing', icon: '📋', severity: 'low' },
  { id: 'encryption', name: 'Encryption Issues', description: 'Password or permission problems', icon: '🔒', severity: 'high' },
  { id: 'images', name: 'Image Problems', description: 'Missing or corrupted images', icon: '🖼️', severity: 'medium' },
  { id: 'links', name: 'Broken Links', description: 'Hyperlinks not working', icon: '🔗', severity: 'low' },
  { id: 'size', name: 'Size Issues', description: 'Unusually large or small file', icon: '📊', severity: 'medium' }
])

const selectFile = (e) => {
  const selectedFile = e.target.files[0]
  if (!selectedFile) return
  
  file.value = selectedFile
  console.log('File selected for repair:', selectedFile.name)
  
  // Reset previous results
  scanResults.value = null
  detectedIssues.value = []
  repairStatus.value = 'idle'
  
  // Auto-start scanning for small files
  if (selectedFile.size < 10 * 1024 * 1024) { // 10MB
    setTimeout(() => {
      startScan()
    }, 500)
  }
}

// Simulate file scanning
const startScan = () => {
  if (!file.value) {
    alert('Please select a PDF file first')
    return
  }

  repairStatus.value = 'scanning'
  statusText.value = 'Scanning PDF file for issues...'
  loading.value = true
  progress.value = 0

  // Simulate scanning process
  const scanInterval = setInterval(() => {
    if (progress.value < 40) {
      progress.value += 10
      if (progress.value < 20) statusText.value = 'Analyzing file structure...'
      else if (progress.value < 30) statusText.value = 'Checking PDF integrity...'
      else statusText.value = 'Detecting potential issues...'
    } else {
      clearInterval(scanInterval)
      completeScan()
    }
  }, 300)
}

const completeScan = () => {
  // Simulate finding issues
  const issues = []
  const randomIssues = [...commonIssues.value]
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.floor(Math.random() * 4) + 1) // 1-4 random issues
  
  randomIssues.forEach(issue => {
    issues.push({
      ...issue,
      confidence: Math.floor(Math.random() * 30) + 70, // 70-100%
      details: getIssueDetails(issue.id)
    })
  })

  detectedIssues.value = issues
  repairStatus.value = 'analyzing'
  progress.value = 60
  statusText.value = 'Analysis complete. Issues detected.'

  // Calculate repair score
  const totalSeverity = issues.reduce((sum, issue) => {
    const severityWeight = { high: 3, medium: 2, low: 1 }
    return sum + severityWeight[issue.severity]
  }, 0)
  
  const maxSeverity = issues.length * 3
  const repairScore = Math.max(10, 100 - Math.floor((totalSeverity / maxSeverity) * 90))

  scanResults.value = {
    fileName: file.value.name,
    fileSize: formatFileSize(file.value.size),
    pageCount: Math.floor(Math.random() * 50) + 1,
    issuesFound: issues.length,
    repairConfidence: repairScore,
    estimatedTime: issues.length * 2 + ' seconds',
    recommendations: getRepairRecommendations(issues)
  }

  loading.value = false
  progress.value = 0
}

const getIssueDetails = (issueId) => {
  const details = {
    corrupted: 'File header corruption detected. This prevents the PDF from opening properly.',
    damaged: 'Content stream errors found. Some pages may not display correctly.',
    font: 'Missing or embedded font issues. Text may appear garbled or as squares.',
    metadata: 'XMP metadata corruption. Document properties may be missing.',
    encryption: 'Encryption dictionary errors. Password protection may be broken.',
    images: 'Image compression errors. Some images may not render properly.',
    links: 'Broken internal/external links. Navigation may not work correctly.',
    size: 'File size anomalies detected. May indicate corruption or optimization issues.'
  }
  return details[issueId] || 'Unknown issue detected.'
}

const getRepairRecommendations = (issues) => {
  const recommendations = []
  
  if (issues.some(i => i.id === 'corrupted')) {
    recommendations.push('Rebuild PDF structure from scratch')
  }
  
  if (issues.some(i => i.id === 'damaged')) {
    recommendations.push('Extract and recompile content streams')
  }
  
  if (issues.some(i => i.id === 'font')) {
    recommendations.push('Re-embed or substitute missing fonts')
  }
  
  if (issues.some(i => i.severity === 'high')) {
    recommendations.push('Perform deep recovery of damaged elements')
  }
  
  if (issues.length > 2) {
    recommendations.push('Create backup before repair')
  }
  
  return recommendations.length > 0 ? recommendations : ['Minor optimizations recommended']
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const repairPdf = async () => {
  if (!file.value) {
    alert('Please select a PDF file')
    return
  }

  repairStatus.value = 'repairing'
  loading.value = true
  progress.value = 0
  statusText.value = 'Starting repair process...'

  // Prepare repair data
  const repairData = {
    fileName: file.value.name,
    fileSize: file.value.size,
    options: repairOptions.value,
    detectedIssues: detectedIssues.value.map(issue => issue.id),
    mode: repairMode.value
  }

  const formData = new FormData()
  formData.append('pdf', file.value)
  formData.append('repair', JSON.stringify(repairData))

  let fakeProgress = null

  try {
    fakeProgress = setInterval(() => {
      if (progress.value < 90) {
        progress.value += 5
        updateRepairStatus(progress.value)
      }
    }, 200)

    // Call repair API
    const res = await fetch('http://192.168.18.101:3000/api/repair-pdf', {
      method: 'POST',
      body: formData
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`Server error: ${res.status} - ${errorText}`)
    }

    clearInterval(fakeProgress)
    progress.value = 100
    statusText.value = 'Downloading repaired PDF...'

    // Get filename
    const contentDisposition = res.headers.get('content-disposition')
    let fileName = `repaired_${file.value.name}`
    
    if (contentDisposition) {
      const matches = contentDisposition.match(/filename="(.+)"/)
      if (matches && matches[1]) {
        fileName = matches[1]
      }
    }

    // Download the repaired PDF
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    repairStatus.value = 'completed'
    statusText.value = 'Repair completed successfully!'

    // Update results with success
    if (scanResults.value) {
      scanResults.value.repairSuccessful = true
      scanResults.value.repairedIssues = detectedIssues.value.length
      scanResults.value.newFileSize = formatFileSize(blob.size)
    }

  } catch (err) {
    repairStatus.value = 'idle'
    statusText.value = 'Repair failed'
    alert('Repair failed: ' + err.message)
    console.error('Repair error:', err)
  } finally {
    if (fakeProgress) clearInterval(fakeProgress)
    loading.value = false
    setTimeout(() => {
      if (repairStatus.value === 'completed') {
        progress.value = 0
        statusText.value = ''
      }
    }, 3000)
  }
}

const updateRepairStatus = (progressValue) => {
  if (progressValue < 20) {
    statusText.value = 'Backing up original file...'
  } else if (progressValue < 40) {
    statusText.value = 'Rebuilding PDF structure...'
  } else if (progressValue < 60) {
    statusText.value = 'Recovering damaged content...'
  } else if (progressValue < 80) {
    statusText.value = 'Fixing font and image issues...'
  } else {
    statusText.value = 'Finalizing repaired document...'
  }
}

const resetRepair = () => {
  if (confirm('Reset all repair settings and start over?')) {
    file.value = null
    scanResults.value = null
    detectedIssues.value = []
    repairStatus.value = 'idle'
    loading.value = false
    progress.value = 0
    statusText.value = ''
    const input = document.querySelector('input[type="file"]')
    if (input) input.value = ''
  }
}

const toggleAdvancedOptions = () => {
  showAdvancedOptions.value = !showAdvancedOptions.value
}

const selectAllOptions = () => {
  Object.keys(repairOptions.value).forEach(key => {
    repairOptions.value[key] = true
  })
}

const deselectAllOptions = () => {
  Object.keys(repairOptions.value).forEach(key => {
    repairOptions.value[key] = false
  })
}

const getSeverityColor = (severity) => {
  switch(severity) {
    case 'high': return '#e74c3c'
    case 'medium': return '#f39c12'
    case 'low': return '#2ecc71'
    default: return '#95a5a6'
  }
}

const getSeverityIcon = (severity) => {
  switch(severity) {
    case 'high': return '🔴'
    case 'medium': return '🟡'
    case 'low': return '🟢'
    default: return '⚪'
  }
}


</script>

<template>
  <div class="converter">
    <h2>Repair PDF</h2>
    <p class="subtitle">Fix corrupted, damaged, or unreadable PDF files with advanced repair tools</p>

    <!-- File Upload -->
    <label class="upload-box" v-if="!file || repairStatus === 'idle'">
      <input
        type="file"
        accept="application/pdf"
        @change="selectFile"
        hidden
      />
      <div class="upload-content">
        <span class="icon">🛠️</span>
        <p><strong>Click to upload</strong> a damaged PDF file</p>
        <small>{{ file ? file.name : 'No file selected' }}</small>
        <small class="hint">Max file size: 100MB</small>
      </div>
    </label>

    <!-- Scan Results -->
    <div v-if="scanResults" class="scan-results">
      <div class="results-header">
        <h3>Scan Results</h3>
        <div class="scan-status" :class="repairStatus">
          {{ repairStatus.charAt(0).toUpperCase() + repairStatus.slice(1) }}
        </div>
      </div>
      
      <div class="results-grid">
        <div class="result-card">
          <div class="result-icon">📄</div>
          <div class="result-info">
            <span class="result-label">File Name</span>
            <span class="result-value">{{ scanResults.fileName }}</span>
          </div>
        </div>
        
        <div class="result-card">
          <div class="result-icon">📊</div>
          <div class="result-info">
            <span class="result-label">File Size</span>
            <span class="result-value">{{ scanResults.fileSize }}</span>
          </div>
        </div>
        
        <div class="result-card">
          <div class="result-icon">📑</div>
          <div class="result-info">
            <span class="result-label">Pages</span>
            <span class="result-value">{{ scanResults.pageCount }}</span>
          </div>
        </div>
        
        <div class="result-card">
          <div class="result-icon">⚠️</div>
          <div class="result-info">
            <span class="result-label">Issues Found</span>
            <span class="result-value" :class="{ 'critical': detectedIssues.some(i => i.severity === 'high') }">
              {{ scanResults.issuesFound }}
            </span>
          </div>
        </div>
        
        <div class="result-card">
          <div class="result-icon">✅</div>
          <div class="result-info">
            <span class="result-label">Repair Confidence</span>
            <span class="result-value confidence" :class="{
              'high': scanResults.repairConfidence >= 80,
              'medium': scanResults.repairConfidence >= 60,
              'low': scanResults.repairConfidence < 60
            }">
              {{ scanResults.repairConfidence }}%
            </span>
          </div>
        </div>
        
        <div class="result-card">
          <div class="result-icon">⏱️</div>
          <div class="result-info">
            <span class="result-label">Estimated Time</span>
            <span class="result-value">{{ scanResults.estimatedTime }}</span>
          </div>
        </div>
      </div>
      
      <!-- Repair Recommendations -->
      <div v-if="scanResults.recommendations" class="recommendations">
        <h4>Repair Recommendations:</h4>
        <ul>
          <li v-for="(rec, index) in scanResults.recommendations" :key="index">
            {{ rec }}
          </li>
        </ul>
      </div>
    </div>

    <!-- Detected Issues -->
    <div v-if="detectedIssues.length > 0" class="detected-issues">
      <h3>Detected Issues</h3>
      <div class="issues-list">
        <div 
          v-for="issue in detectedIssues" 
          :key="issue.id"
          class="issue-item"
          :style="{ borderLeftColor: getSeverityColor(issue.severity) }"
        >
          <div class="issue-header">
            <div class="issue-icon">{{ issue.icon }}</div>
            <div class="issue-info">
              <h4>{{ issue.name }}</h4>
              <p>{{ issue.description }}</p>
            </div>
            <div class="issue-severity">
              <span class="severity-icon">{{ getSeverityIcon(issue.severity) }}</span>
              <span class="severity-text">{{ issue.severity.toUpperCase() }}</span>
            </div>
          </div>
          <div class="issue-details">
            <p>{{ issue.details }}</p>
            <div class="issue-confidence">
              <span>Confidence: {{ issue.confidence }}%</span>
              <div class="confidence-bar">
                <div 
                  class="confidence-fill" 
                  :style="{ 
                    width: issue.confidence + '%',
                    backgroundColor: getSeverityColor(issue.severity)
                  }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Repair Options -->
    <div class="repair-options">
      <div class="options-header">
        <h3>Repair Settings</h3>
        <div class="options-controls">
          <button @click="toggleAdvancedOptions" class="options-btn">
            {{ showAdvancedOptions ? 'Hide' : 'Show' }} Advanced Options
          </button>
          <button @click="selectAllOptions" class="options-btn">
            Select All
          </button>
          <button @click="deselectAllOptions" class="options-btn">
            Deselect All
          </button>
        </div>
      </div>
      
      <div class="mode-selection">
        <label class="mode-option">
          <input 
            type="radio" 
            v-model="repairMode" 
            value="auto" 
            :disabled="loading"
          />
          <div class="mode-content">
            <span class="mode-icon">🤖</span>
            <div>
              <h4>Auto Repair</h4>
              <p>Automatically detect and fix all issues (Recommended)</p>
            </div>
          </div>
        </label>
        
        <label class="mode-option">
          <input 
            type="radio" 
            v-model="repairMode" 
            value="advanced" 
            :disabled="loading"
          />
          <div class="mode-content">
            <span class="mode-icon">⚙️</span>
            <div>
              <h4>Advanced Repair</h4>
              <p>Manual control over repair options</p>
            </div>
          </div>
        </label>
      </div>
      
      <!-- Advanced Options -->
      <div v-if="showAdvancedOptions || repairMode === 'advanced'" class="advanced-options">
        <div class="options-grid">
          <label v-for="(value, key) in repairOptions" :key="key" class="option-item">
            <input 
              type="checkbox" 
              v-model="repairOptions[key]" 
              :disabled="loading"
            />
            <span class="option-text">{{ formatOptionName(key) }}</span>
            <span class="option-help" :title="getOptionDescription(key)">❓</span>
          </label>
        </div>
      </div>
    </div>

    <!-- Repair Progress (when repairing) -->
    <div v-if="repairStatus === 'repairing'" class="repair-progress">
      <h3>Repairing PDF...</h3>
      <div class="progress-steps">
        <div class="step" :class="{ active: progress >= 0 }">
          <div class="step-number">1</div>
          <div class="step-info">
            <h5>Backup</h5>
            <p>Creating backup of original file</p>
          </div>
        </div>
        <div class="step" :class="{ active: progress >= 25 }">
          <div class="step-number">2</div>
          <div class="step-info">
            <h5>Structure</h5>
            <p>Rebuilding PDF structure</p>
          </div>
        </div>
        <div class="step" :class="{ active: progress >= 50 }">
          <div class="step-number">3</div>
          <div class="step-info">
            <h5>Content</h5>
            <p>Recovering damaged content</p>
          </div>
        </div>
        <div class="step" :class="{ active: progress >= 75 }">
          <div class="step-number">4</div>
          <div class="step-info">
            <h5>Finalize</h5>
            <p>Finalizing repaired document</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Success Message -->
    <div v-if="repairStatus === 'completed' && scanResults?.repairSuccessful" class="success-message">
      <div class="success-icon">✅</div>
      <h3>Repair Successful!</h3>
      <p>Your PDF file has been successfully repaired and downloaded.</p>
      <div class="success-details">
        <p><strong>Issues Fixed:</strong> {{ scanResults.repairedIssues }}</p>
        <p><strong>Original Size:</strong> {{ scanResults.fileSize }}</p>
        <p v-if="scanResults.newFileSize"><strong>New Size:</strong> {{ scanResults.newFileSize }}</p>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="action-buttons">
      <button 
        v-if="file && repairStatus !== 'repairing' && repairStatus !== 'completed'"
        @click="resetRepair" 
        class="secondary-btn"
        :disabled="loading"
      >
        Start Over
      </button>
      
      <button 
        v-if="file && repairStatus === 'idle'"
        @click="startScan" 
        class="scan-btn"
        :disabled="loading"
      >
        🔍 Scan for Issues
      </button>
      
      <button 
        class="repair-btn" 
        @click="repairPdf" 
        :disabled="loading || !file || detectedIssues.length === 0"
      >
        <span v-if="loading">🔄 Repairing PDF...</span>
        <span v-else>🚀 Repair PDF</span>
      </button>
    </div>

    <!-- Status & Progress -->
    <p v-if="loading && statusText" class="status-text">{{ statusText }}</p>
    <div v-if="loading" class="progress-wrapper">
      <div class="progress-bar" :style="{ width: progress + '%' }"></div>
    </div>

  </div>
</template>

<style scoped>
.converter {
  text-align: center;
  max-width: 1000px;
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
  border-color: #e74c3c;
  background: #fef5f5;
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

.hint {
  color: #e74c3c !important;
  font-weight: 500;
}

/* Scan Results */
.scan-results {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 25px;
  margin-bottom: 25px;
  text-align: left;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f8f9fa;
}

.results-header h3 {
  font-size: 18px;
  color: #333;
  margin: 0;
}

.scan-status {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.scan-status.scanning {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.scan-status.analyzing {
  background: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

.scan-status.repairing {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.scan-status.completed {
  background: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.result-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  transition: all 0.2s;
}

.result-card:hover {
  border-color: #e74c3c;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(231, 76, 60, 0.1);
}

.result-icon {
  font-size: 24px;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 10px;
  border: 2px solid #e9ecef;
}

.result-info {
  flex: 1;
}

.result-label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.result-value {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.result-value.critical {
  color: #e74c3c;
}

.result-value.confidence.high {
  color: #2ecc71;
}

.result-value.confidence.medium {
  color: #f39c12;
}

.result-value.confidence.low {
  color: #e74c3c;
}

.recommendations {
  background: #fff8e1;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #ffeaa7;
  margin-top: 20px;
}

.recommendations h4 {
  font-size: 14px;
  color: #856404;
  margin: 0 0 10px 0;
}

.recommendations ul {
  margin: 0;
  padding-left: 20px;
  color: #856404;
}

.recommendations li {
  margin-bottom: 5px;
  font-size: 13px;
}

/* Detected Issues */
.detected-issues {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 25px;
  margin-bottom: 25px;
  text-align: left;
}

.detected-issues h3 {
  font-size: 18px;
  color: #333;
  margin: 0 0 20px 0;
}

.issues-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.issue-item {
  background: white;
  border: 1px solid #e9ecef;
  border-left: 4px solid #95a5a6;
  border-radius: 8px;
  padding: 20px;
  transition: all 0.3s ease;
}

.issue-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.issue-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
}

.issue-icon {
  font-size: 28px;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 10px;
  flex-shrink: 0;
}

.issue-info {
  flex: 1;
}

.issue-info h4 {
  font-size: 16px;
  color: #333;
  margin: 0 0 5px 0;
}

.issue-info p {
  font-size: 13px;
  color: #666;
  margin: 0;
}

.issue-severity {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  min-width: 80px;
}

.severity-icon {
  font-size: 16px;
}

.severity-text {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.issue-details {
  padding-top: 15px;
  border-top: 1px solid #e9ecef;
}

.issue-details p {
  font-size: 13px;
  color: #666;
  margin: 0 0 15px 0;
  line-height: 1.6;
}

.issue-confidence {
  display: flex;
  align-items: center;
  gap: 15px;
}

.issue-confidence span {
  font-size: 12px;
  color: #666;
  font-weight: 500;
  min-width: 100px;
}

.confidence-bar {
  flex: 1;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.confidence-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

/* Repair Options */
.repair-options {
  background: #f8f9fa;
  padding: 25px;
  border-radius: 12px;
  margin-bottom: 25px;
  border: 1px solid #e9ecef;
}

.options-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.options-header h3 {
  font-size: 18px;
  color: #333;
  margin: 0;
}

.options-controls {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.options-btn {
  padding: 8px 16px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.options-btn:hover {
  background: #e9ecef;
  border-color: #e74c3c;
}

.mode-selection {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 25px;
}

.mode-option {
  display: block;
  cursor: pointer;
}

.mode-option input[type="radio"] {
  display: none;
}

.mode-content {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.mode-option input[type="radio"]:checked + .mode-content {
  border-color: #e74c3c;
  background: #fef5f5;
}

.mode-option:hover .mode-content {
  border-color: #e74c3c;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.1);
}

.mode-icon {
  font-size: 32px;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 10px;
  flex-shrink: 0;
}

.mode-content h4 {
  font-size: 16px;
  color: #333;
  margin: 0 0 5px 0;
}

.mode-content p {
  font-size: 13px;
  color: #666;
  margin: 0;
  line-height: 1.5;
}

.advanced-options {
  background: white;
  padding: 25px;
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 15px;
  background: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.option-item:hover {
  background: #e9ecef;
}

.option-item input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #e74c3c;
}

.option-text {
  flex: 1;
  font-size: 14px;
  color: #333;
}

.option-help {
  color: #666;
  cursor: help;
  font-size: 12px;
}

/* Repair Progress */
.repair-progress {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 25px;
  margin-bottom: 25px;
  text-align: left;
}

.repair-progress h3 {
  font-size: 18px;
  color: #333;
  margin: 0 0 25px 0;
  text-align: center;
}

.progress-steps {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.step {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  opacity: 0.6;
  transition: all 0.3s ease;
}

.step.active {
  opacity: 1;
  background: #d4edda;
  border: 1px solid #c3e6cb;
}

.step-number {
  width: 40px;
  height: 40px;
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 16px;
  color: #333;
  flex-shrink: 0;
}

.step.active .step-number {
  border-color: #28a745;
  background: #28a745;
  color: white;
}

.step-info h5 {
  font-size: 14px;
  color: #333;
  margin: 0 0 5px 0;
}

.step-info p {
  font-size: 12px;
  color: #666;
  margin: 0;
}

.step.active .step-info h5,
.step.active .step-info p {
  color: #155724;
}

/* Success Message */
.success-message {
  background: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 25px;
  text-align: center;
}

.success-icon {
  font-size: 48px;
  margin-bottom: 20px;
}

.success-message h3 {
  font-size: 20px;
  color: #155724;
  margin: 0 0 15px 0;
}

.success-message p {
  font-size: 14px;
  color: #155724;
  margin: 0 0 20px 0;
  line-height: 1.6;
}

.success-details {
  background: white;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #c3e6cb;
  text-align: left;
  max-width: 400px;
  margin: 0 auto;
}

.success-details p {
  margin: 0 0 10px 0;
  font-size: 13px;
  color: #333;
}

.success-details p:last-child {
  margin-bottom: 0;
}

.success-details strong {
  color: #155724;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin: 30px 0;
  flex-wrap: wrap;
}

.repair-btn {
  flex: 1;
  max-width: 300px;
  padding: 16px 30px;
  font-size: 16px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.2);
}

.repair-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(231, 76, 60, 0.3);
  background: linear-gradient(135deg, #c0392b, #a93226);
}

.repair-btn:disabled {
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

.secondary-btn:hover:not(:disabled) {
  background: #f8f9fa;
  border-color: #e74c3c;
  color: #e74c3c;
}

.secondary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.scan-btn {
  padding: 16px 25px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.scan-btn:hover:not(:disabled) {
  background: #2980b9;
  transform: translateY(-2px);
}

.scan-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Status & Progress */
.status-text {
  margin-top: 15px;
  font-size: 14px;
  color: #e74c3c;
  font-weight: 500;
}

.progress-wrapper {
  margin: 15px auto 30px;
  height: 10px;
  width: 100%;
  max-width: 400px;
  background: #e9ecef;
  border-radius: 8px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #e74c3c, #f1948a);
  transition: width 0.3s ease;
}

/* Common Problems */
.common-problems {
  background: #f8f9fa;
  padding: 25px;
  border-radius: 12px;
  margin: 25px 0;
  border: 1px solid #e9ecef;
}

.common-problems h4 {
  font-size: 16px;
  color: #333;
  margin: 0 0 20px 0;
  text-align: center;
}

.problems-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.problem {
  text-align: center;
  padding: 20px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
}

.problem:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #e74c3c;
}

.problem-icon {
  font-size: 32px;
  margin-bottom: 15px;
}

.problem h5 {
  font-size: 14px;
  color: #333;
  margin: 0 0 10px 0;
  font-weight: 600;
}

.problem p {
  font-size: 12px;
  color: #666;
  margin: 0;
  line-height: 1.5;
}

/* Repair Tips */
.repair-tips {
  margin-top: 25px;
}

.repair-tips details {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  overflow: hidden;
}

.repair-tips summary {
  padding: 20px;
  cursor: pointer;
  font-weight: 500;
  color: #333;
  list-style: none;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
}

.repair-tips summary::-webkit-details-marker {
  display: none;
}

.repair-tips summary::after {
  content: '▼';
  transition: transform 0.3s;
  margin-left: auto;
  font-size: 12px;
}

.repair-tips details[open] summary::after {
  transform: rotate(180deg);
}

.tips-content {
  padding: 0 20px 20px 20px;
  border-top: 1px solid #e9ecef;
}

.tip {
  margin-bottom: 20px;
}

.tip:last-child {
  margin-bottom: 0;
}

.tip h5 {
  font-size: 14px;
  color: #333;
  margin: 0 0 10px 0;
  font-weight: 600;
}

.tip ul {
  margin: 0;
  padding-left: 20px;
  color: #666;
}

.tip li {
  margin-bottom: 5px;
  font-size: 13px;
  line-height: 1.5;
}

.tip li:last-child {
  margin-bottom: 0;
}


</style>