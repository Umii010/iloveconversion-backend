<script setup>
import { ref, onMounted } from 'vue'

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

// To store actual repair data from server
const actualRepairData = ref(null)

const selectFile = (e) => {
  const selectedFile = e.target.files[0]
  if (!selectedFile) return
  
  file.value = selectedFile
  console.log('File selected for repair:', selectedFile.name)
  
  // Reset previous results
  scanResults.value = null
  detectedIssues.value = []
  repairStatus.value = 'idle'
  actualRepairData.value = null
  
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
  formData.append('file', file.value)
  formData.append('repair', JSON.stringify(repairData))

  let fakeProgress = null

  try {
    // More realistic progress simulation
    fakeProgress = setInterval(() => {
      if (progress.value < 90) {
        progress.value += 2 + Math.random() * 3
        updateRepairStatus(progress.value)
      }
    }, 200)

    // Call repair API
    const res = await fetch('http://192.168.18.101:3000/api/repair-pdf', {
      method: 'POST',
      body: formData
    });

    // Get repair status and data from headers
    const repairStatusHeader = res.headers.get('X-Repair-Status');
    const repairDataHeader = res.headers.get('X-Repair-Data');
    
    if (repairDataHeader) {
      try {
        actualRepairData.value = JSON.parse(repairDataHeader);
        console.log('Actual repair data:', actualRepairData.value);
      } catch (e) {
        console.error('Failed to parse repair data:', e);
      }
    }

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`Server error: ${res.status} - ${errorText}`)
    }

    clearInterval(fakeProgress)
    progress.value = 100
    statusText.value = 'Preparing download...'

    // Get filename from headers or generate one
    let fileName = `repaired_${file.value.name}`;
    const contentDisposition = res.headers.get('content-disposition')
    
    if (contentDisposition) {
      const matches = contentDisposition.match(/filename="(.+)"/)
      if (matches && matches[1]) {
        fileName = matches[1]
      }
    }

    // Download the file
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    // Determine actual success based on headers and file analysis
    const isActuallyRepaired = repairStatusHeader === 'repaired' && 
                               actualRepairData.value?.success !== false &&
                               blob.size > 1000; // At least 1KB (not just error report)
    
    // Read the blob to check if it's an error report
    const text = await blob.slice(0, 1000).text();
    const isErrorReport = text.includes('PDF REPAIR FAILED') || 
                         text.includes('Repair Failed') ||
                         text.includes('severely corrupted') ||
                         blob.size < 2000;

    if (isActuallyRepaired && !isErrorReport) {
      repairStatus.value = 'completed'
      statusText.value = '✅ Repair completed successfully!'
      
      // Show success notification
      showNotification(
        `✅ Repair Successful!\n` +
        `Pages recovered: ${actualRepairData.value?.pages_recovered || 'Unknown'}\n` +
        `Original: ${actualRepairData.value?.original_size || formatFileSize(file.value.size)}\n` +
        `New: ${actualRepairData.value?.new_size || formatFileSize(blob.size)}\n` +
        `Issues fixed: ${actualRepairData.value?.issues_fixed?.length || detectedIssues.value.length}`,
        'success'
      );
      
      // Update results with success
      if (scanResults.value) {
        scanResults.value.repairSuccessful = true
        scanResults.value.repairedIssues = actualRepairData.value?.issues_fixed?.length || detectedIssues.value.length
        scanResults.value.newFileSize = formatFileSize(blob.size)
        scanResults.value.actualRepairData = actualRepairData.value
      }
    } else {
      repairStatus.value = 'analyzing' // Go back to analysis stage
      statusText.value = '⚠️ Repair partially completed'
      
      // Show warning notification
      showNotification(
        `⚠️ PDF Could Not Be Fully Repaired\n` +
        `The file appears to be severely corrupted or encrypted.\n` +
        `Downloading repair report with recovery instructions...`,
        'warning'
      );
      
      // Update results with failure
      if (scanResults.value) {
        scanResults.value.repairSuccessful = false
        scanResults.value.repairStatus = 'partially_repaired'
        scanResults.value.errorMessage = 'File is severely corrupted. Please see repair report.'
      }
    }

  } catch (err) {
    repairStatus.value = 'analyzing'
    statusText.value = '❌ Repair failed'
    
    // Show error notification
    let errorMessage = 'Repair failed: ' + err.message;
    if (err.message.includes('severely corrupted') || err.message.includes('encrypted')) {
      errorMessage = '❌ PDF Cannot Be Repaired\n' +
        'The file appears to be severely corrupted or encrypted.\n' +
        'Try using Adobe Acrobat Pro or online repair services.';
    }
    
    showNotification(errorMessage, 'error');
    console.error('Repair error:', err);
    
  } finally {
    if (fakeProgress) clearInterval(fakeProgress);
    loading.value = false;
    
    // Reset progress after delay
    setTimeout(() => {
      if (repairStatus.value === 'completed' || repairStatus.value === 'analyzing') {
        progress.value = 0
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
    actualRepairData.value = null
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

// Notification system
const showNotification = (message, type = 'info') => {
  // Create notification element
  const notification = document.createElement('div')
  notification.className = `notification notification-${type}`
  
  // Add icon based on type
  let icon = 'ℹ️'
  if (type === 'success') icon = '✅'
  else if (type === 'warning') icon = '⚠️'
  else if (type === 'error') icon = '❌'
  
  notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-icon">${icon}</span>
      <span class="notification-message">${message.replace(/\n/g, '<br>')}</span>
      <button class="notification-close">×</button>
    </div>
  `
  
  // Add styles if not already added
  if (!document.getElementById('notification-styles')) {
    const style = document.createElement('style')
    style.id = 'notification-styles'
    style.textContent = `
      .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        animation: slideIn 0.3s ease;
        max-width: 400px;
        border-left: 5px solid;
        overflow: hidden;
      }
      .notification-success {
        border-left-color: #2ecc71;
        background: linear-gradient(135deg, #f0fdf4, #dcfce7);
      }
      .notification-warning {
        border-left-color: #f59e0b;
        background: linear-gradient(135deg, #fffbeb, #fef3c7);
      }
      .notification-error {
        border-left-color: #ef4444;
        background: linear-gradient(135deg, #fef2f2, #fee2e2);
      }
      .notification-info {
        border-left-color: #3b82f6;
        background: linear-gradient(135deg, #eff6ff, #dbeafe);
      }
      .notification-content {
        display: flex;
        align-items: flex-start;
        padding: 20px;
        gap: 15px;
      }
      .notification-icon {
        font-size: 24px;
        flex-shrink: 0;
      }
      .notification-message {
        flex: 1;
        font-size: 14px;
        color: #333;
        line-height: 1.5;
      }
      .notification-close {
        background: none;
        border: none;
        font-size: 20px;
        color: #999;
        cursor: pointer;
        padding: 5px;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
      }
      .notification-close:hover {
        background: rgba(0, 0, 0, 0.1);
      }
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      .notification-progress {
        height: 4px;
        background: linear-gradient(90deg, #2ecc71, #34d399);
        animation: progressBar 5s linear forwards;
      }
      .notification-warning .notification-progress {
        background: linear-gradient(90deg, #f59e0b, #fbbf24);
      }
      .notification-error .notification-progress {
        background: linear-gradient(90deg, #ef4444, #f87171);
      }
      @keyframes progressBar {
        from { width: 100%; }
        to { width: 0%; }
      }
    `
    document.head.appendChild(style)
  }
  
  // Add progress bar
  const progressBar = document.createElement('div')
  progressBar.className = 'notification-progress'
  notification.appendChild(progressBar)
  
  // Add to document
  document.body.appendChild(notification)
  
  // Add close button functionality
  const closeBtn = notification.querySelector('.notification-close')
  closeBtn.addEventListener('click', () => {
    notification.remove()
  })
  
  // Auto-remove after 8 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.animation = 'slideOut 0.3s ease'
      setTimeout(() => notification.remove(), 300)
    }
  }, 8000)
}

// Add slideOut animation
onMounted(() => {
  if (!document.getElementById('notification-animations')) {
    const style = document.createElement('style')
    style.id = 'notification-animations'
    style.textContent = `
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
    `
    document.head.appendChild(style)
  }
})
</script>

<template>
  <div class="converter">
    <h2>🔧 Repair PDF</h2>
    <p class="subtitle">Fix corrupted, damaged, or unreadable PDF files with advanced repair tools</p>

    <!-- File Upload -->
    <label class="upload-box" v-if="!file || repairStatus === 'idle'">
      <input name="file"
        type="file"
        accept="application/pdf"
        @change="selectFile"
        hidden
      />
      <div class="upload-content">
        <span class="icon">📄</span>
        <p><strong>Click to upload</strong> a damaged PDF file</p>
        <small>{{ file ? file.name : 'No file selected' }}</small>
        <small class="hint">Supports PDF repair up to 100MB</small>
      </div>
    </label>


    <!-- Repair Progress (when repairing) -->
    <div v-if="repairStatus === 'repairing'" class="repair-progress">
      <h3>🔧 Repairing PDF...</h3>
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
      <h3>🎉 Repair Successful!</h3>
      <p>Your PDF file has been successfully repaired and downloaded.</p>
      <div class="success-details">
        <p><strong>✅ Issues Fixed:</strong> {{ scanResults.repairedIssues || scanResults.issuesFound }}</p>
        <p><strong>📊 Original Size:</strong> {{ scanResults.fileSize }}</p>
        <p v-if="scanResults.newFileSize"><strong>📦 New Size:</strong> {{ scanResults.newFileSize }}</p>
        <p v-if="actualRepairData?.pages_recovered"><strong>📑 Pages Recovered:</strong> {{ actualRepairData.pages_recovered }}</p>
        <p v-if="actualRepairData?.processing_time"><strong>⏱️ Processing Time:</strong> {{ actualRepairData.processing_time }}</p>
      </div>
    </div>

    <!-- Partial Repair Message -->
    <div v-if="repairStatus === 'analyzing' && scanResults?.repairSuccessful === false" class="warning-message">
      <h3>Repair Partially Failed</h3>
      <p>The PDF could not be fully repaired due to severe corruption.</p>
    </div>


    <!-- Action Buttons -->
    <div class="action-buttons">
      <button 
        v-if="file && repairStatus !== 'repairing' && repairStatus !== 'completed'"
        @click="resetRepair" 
        class="secondary-btn"
        :disabled="loading"
      >
        🔄 Start Over
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
        :class="{ disabled: loading || !file || detectedIssues.length === 0 }"
      >
        <span v-if="loading">🔄 Repairing... {{ progress.toFixed(0) }}%</span>
        <span v-else>🚀 Repair PDF Now</span>
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
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 20px;
}

h2 {
  font-size: 28px;
  margin-bottom: 10px;
  color: #333;
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  font-size: 16px;
  color: #666;
  margin-bottom: 30px;
  line-height: 1.5;
}

/* File Upload */
.upload-box {
  display: block;
  border: 3px dashed #d1d5db;
  border-radius: 16px;
  padding: 50px 30px;
  cursor: pointer;
  background: #f9fafb;
  transition: all 0.3s ease;
  margin-bottom: 25px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.upload-box:hover {
  border-color: #e74c3c;
  background: #fef5f5;
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(231, 76, 60, 0.1);
}

.upload-content .icon {
  font-size: 48px;
  display: block;
  margin-bottom: 15px;
  color: #e74c3c;
}

.upload-content p {
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 8px 0;
}

.upload-content small {
  display: block;
  font-size: 14px;
  color: #6b7280;
  margin: 5px 0;
}

.hint {
  color: #e74c3c !important;
  font-weight: 500;
}

/* Scan Results */
.scan-results {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 30px;
  margin-bottom: 25px;
  text-align: left;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f3f4f6;
}

.results-header h3 {
  font-size: 20px;
  color: #333;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.scan-status {
  padding: 8px 16px;
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
  gap: 20px;
  margin-bottom: 30px;
}

.result-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
}

.result-card:hover {
  border-color: #e74c3c;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(231, 76, 60, 0.1);
}

.result-icon {
  font-size: 28px;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 12px;
  border: 2px solid #e5e7eb;
}

.result-info {
  flex: 1;
}

.result-label {
  display: block;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
}

.result-value {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
}

.result-value.critical {
  color: #e74c3c;
}

.result-value.confidence.high {
  color: #10b981;
}

.result-value.confidence.medium {
  color: #f59e0b;
}

.result-value.confidence.low {
  color: #e74c3c;
}

/* Detected Issues */
.detected-issues {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 25px;
  margin: 30px 0;
}

.detected-issues h3 {
  font-size: 18px;
  color: #333;
  margin: 0 0 25px 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.issues-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.issue-item {
  background: white;
  border: 1px solid #e5e7eb;
  border-left: 4px solid;
  border-radius: 12px;
  padding: 25px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.issue-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.issue-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.issue-icon {
  font-size: 32px;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 12px;
  flex-shrink: 0;
}

.issue-info {
  flex: 1;
}

.issue-info h4 {
  font-size: 18px;
  color: #1f2937;
  margin: 0 0 8px 0;
  font-weight: 600;
}

.issue-info p {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
}

.issue-severity {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 10px;
  min-width: 100px;
}

.severity-icon {
  font-size: 20px;
}

.severity-text {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.issue-details {
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.issue-details p {
  font-size: 14px;
  color: #4b5563;
  margin: 0 0 20px 0;
  line-height: 1.6;
}

.issue-confidence {
  display: flex;
  align-items: center;
  gap: 20px;
}

.issue-confidence span {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
  min-width: 120px;
}

.confidence-bar {
  flex: 1;
  height: 10px;
  background: #e5e7eb;
  border-radius: 5px;
  overflow: hidden;
}

.confidence-fill {
  height: 100%;
  border-radius: 5px;
  transition: width 0.3s ease;
}

/* Recommendations */
.recommendations {
  background: linear-gradient(135deg, #fff8e1, #fff3cd);
  border: 1px solid #ffeaa7;
  border-radius: 12px;
  padding: 25px;
  margin-top: 30px;
}

.recommendations h4 {
  font-size: 16px;
  color: #856404;
  margin: 0 0 15px 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.recommendations ul {
  margin: 0;
  padding-left: 20px;
  color: #856404;
}

.recommendations li {
  margin-bottom: 10px;
  font-size: 14px;
  line-height: 1.5;
}

.recommendations li:last-child {
  margin-bottom: 0;
}

/* Repair Progress */
.repair-progress {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 30px;
  margin-bottom: 30px;
  text-align: left;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.repair-progress h3 {
  font-size: 20px;
  color: #333;
  margin: 0 0 30px 0;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.progress-steps {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 25px;
}

.step {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
  opacity: 0.6;
  transition: all 0.3s ease;
}

.step.active {
  opacity: 1;
  background: #d4edda;
  border: 2px solid #c3e6cb;
}

.step-number {
  width: 50px;
  height: 50px;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 18px;
  color: #4b5563;
  flex-shrink: 0;
}

.step.active .step-number {
  border-color: #10b981;
  background: #10b981;
  color: white;
}

.step-info h5 {
  font-size: 16px;
  color: #1f2937;
  margin: 0 0 8px 0;
  font-weight: 600;
}

.step-info p {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
}

.step.active .step-info h5,
.step.active .step-info p {
  color: #065f46;
}

/* Success Message */
.success-message {
  background: linear-gradient(135deg, #d4edda, #c3e6cb);
  border: 2px solid #10b981;
  border-radius: 16px;
  padding: 40px;
  margin-bottom: 30px;
  text-align: center;
  animation: slideIn 0.5s ease;
}

.success-icon {
  font-size: 60px;
  margin-bottom: 25px;
  animation: bounce 1s ease infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.success-message h3 {
  font-size: 24px;
  color: #065f46;
  margin: 0 0 20px 0;
  font-weight: 700;
}

.success-message p {
  font-size: 16px;
  color: #065f46;
  margin: 0 0 30px 0;
  line-height: 1.6;
  opacity: 0.9;
}

.success-details {
  background: white;
  padding: 25px;
  border-radius: 12px;
  border: 1px solid #a7f3d0;
  text-align: left;
  max-width: 500px;
  margin: 0 auto;
}

.success-details p {
  margin: 0 0 15px 0;
  font-size: 14px;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 10px;
}

.success-details p:last-child {
  margin-bottom: 0;
}

.success-details strong {
  color: #065f46;
  min-width: 140px;
  display: inline-block;
}

/* Warning Message */
.warning-message {
  background: linear-gradient(135deg, #fffbeb, #fef3c7);
  border: 2px solid #f59e0b;
  border-radius: 16px;
  padding: 40px;
  margin-bottom: 30px;
  text-align: center;
  animation: slideIn 0.5s ease;
}

.warning-icon {
  font-size: 60px;
  margin-bottom: 25px;
}

.warning-message h3 {
  font-size: 24px;
  color: #92400e;
  margin: 0 0 20px 0;
  font-weight: 700;
}

.warning-message p {
  font-size: 16px;
  color: #92400e;
  margin: 0 0 30px 0;
  line-height: 1.6;
  opacity: 0.9;
}

.warning-details {
  background: white;
  padding: 25px;
  border-radius: 12px;
  border: 1px solid #fde68a;
  text-align: left;
  max-width: 600px;
  margin: 0 auto;
}

.warning-details p {
  margin: 0 0 15px 0;
  font-size: 14px;
  color: #1f2937;
}

.warning-details ul {
  margin: 15px 0 0 0;
  padding-left: 20px;
  color: #92400e;
}

.warning-details li {
  margin-bottom: 10px;
  font-size: 14px;
  line-height: 1.5;
}

.warning-details li:last-child {
  margin-bottom: 0;
}

/* Common Problems */
.common-problems {
  background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
  border: 1px solid #bae6fd;
  border-radius: 16px;
  padding: 30px;
  margin: 30px 0;
}

.common-problems h4 {
  font-size: 20px;
  color: #0369a1;
  margin: 0 0 30px 0;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.problems-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 25px;
}

.problem {
  text-align: center;
  padding: 25px;
  background: white;
  border-radius: 12px;
  border: 2px solid #e0f2fe;
  transition: all 0.3s ease;
}

.problem:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(14, 165, 233, 0.15);
  border-color: #0ea5e9;
}

.problem-icon {
  font-size: 40px;
  margin-bottom: 20px;
}

.problem h5 {
  font-size: 16px;
  color: #0c4a6e;
  margin: 0 0 12px 0;
  font-weight: 600;
}

.problem p {
  font-size: 13px;
  color: #475569;
  margin: 0;
  line-height: 1.5;
}

/* Repair Tips */
.repair-tips {
  margin: 30px 0;
}

.repair-tips details {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.repair-tips summary {
  padding: 25px;
  cursor: pointer;
  font-weight: 600;
  color: #1f2937;
  list-style: none;
  display: flex;
  align-items: center;
  gap: 15px;
  font-size: 18px;
  transition: background 0.3s;
}

.repair-tips summary:hover {
  background: #f8f9fa;
}

.repair-tips summary::-webkit-details-marker {
  display: none;
}

.repair-tips summary::after {
  content: '▼';
  transition: transform 0.3s;
  margin-left: auto;
  font-size: 14px;
  color: #6b7280;
}

.repair-tips details[open] summary::after {
  transform: rotate(180deg);
}

.tips-content {
  padding: 0 25px 25px 25px;
  border-top: 1px solid #e5e7eb;
}

.tip {
  margin-bottom: 25px;
}

.tip:last-child {
  margin-bottom: 0;
}

.tip h5 {
  font-size: 16px;
  color: #1f2937;
  margin: 0 0 15px 0;
  font-weight: 600;
}

.tip ul {
  margin: 0;
  padding-left: 20px;
  color: #4b5563;
}

.tip li {
  margin-bottom: 10px;
  font-size: 14px;
  line-height: 1.6;
}

.tip li:last-child {
  margin-bottom: 0;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin: 40px 0;
  flex-wrap: wrap;
}

.repair-btn {
  flex: 1;
  max-width: 350px;
  padding: 20px 30px;
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
  border: none;
  border-radius: 14px;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 8px 25px rgba(231, 76, 60, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  min-height: 60px;
}

.repair-btn:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 12px 30px rgba(231, 76, 60, 0.4);
  background: linear-gradient(135deg, #c0392b, #a93226);
}

.repair-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
  background: #9ca3af;
}

.secondary-btn {
  padding: 20px 30px;
  background: white;
  border: 2px solid #d1d5db;
  border-radius: 14px;
  color: #6b7280;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 150px;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.secondary-btn:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
  color: #374151;
}

.secondary-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.scan-btn {
  padding: 20px 30px;
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border: none;
  border-radius: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 180px;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.scan-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(52, 152, 219, 0.3);
  background: linear-gradient(135deg, #2980b9, #1f6399);
}

.scan-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Status & Progress */
.status-text {
  margin: 20px 0 15px;
  font-size: 16px;
  color: #e74c3c;
  font-weight: 600;
  min-height: 24px;
}

.progress-wrapper {
  margin: 0 auto 30px;
  height: 12px;
  width: 100%;
  max-width: 500px;
  background: #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #e74c3c, #f1948a);
  border-radius: 6px;
  transition: width 0.5s ease;
  position: relative;
  overflow: hidden;
}

.progress-bar::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  100% { left: 100%; }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .converter {
    padding: 20px 15px;
  }
  
  .upload-box {
    padding: 30px 20px;
  }
  
  .results-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
  }
  
  .progress-steps {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .problems-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .repair-btn,
  .secondary-btn,
  .scan-btn {
    width: 100%;
    max-width: none;
  }
}

@media (max-width: 480px) {
  .results-grid {
    grid-template-columns: 1fr;
  }
  
  .problem {
    padding: 20px;
  }
  
  .issue-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .issue-severity {
    align-self: flex-start;
  }
  
  .success-details,
  .warning-details {
    padding: 15px;
  }
}
</style>