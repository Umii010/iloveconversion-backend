<script setup>
import { ref } from 'vue'

const file = ref(null)
const loading = ref(false)
const progress = ref(0)
const statusText = ref('')
const showStats = ref(false)
const compressionStats = ref({
  originalSize: 0,
  compressedSize: 0,
  reductionPercent: 0
})

const selectFile = (e) => {
  file.value = e.target.files[0]
}

// Format bytes to human readable format
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const compressPdf = async () => {
  if (!file.value) {
    alert('Please select a PDF file')
    return
  }

  loading.value = true
  progress.value = 0
  statusText.value = 'Starting compression...'
  showStats.value = false

  const formData = new FormData()
  formData.append('pdf', file.value)

  let fakeProgress = null

  try {
    // Simulate progress with better timing
    fakeProgress = setInterval(() => {
      if (progress.value < 85) {
        progress.value += Math.random() * 5 + 2 // 2-7% increments
        if (progress.value < 30) {
          statusText.value = 'Uploading file...'
        } else if (progress.value < 60) {
          statusText.value = 'Processing PDF...'
        } else {
          statusText.value = 'Compressing images and fonts...'
        }
      }
    }, 300)

    const res = await fetch('http://192.168.18.101:3000/api/compress-pdf', {
      method: 'POST',
      body: formData
    })

    if (!res.ok) {
      throw new Error('Server error: ' + res.status)
    }

    clearInterval(fakeProgress)
    progress.value = 100
    statusText.value = 'Finalizing compression...'

    // CRITICAL: Read headers BEFORE consuming the response body
    const apiFileName = res.headers.get('X-Original-Filename')
    const fileName = apiFileName || file.value.name
    
    let originalSize = Number(res.headers.get('X-Original-Size'))
    let compressedSize = Number(res.headers.get('X-Compressed-Size'))
    let reductionPercent = res.headers.get('X-Compression-Percent')

    console.log('Headers received:', {
      originalSize,
      compressedSize,
      reductionPercent,
      allHeaders: Array.from(res.headers.entries())
    })

    // If headers are 0 or NaN, try to get from the file
    if ((!originalSize || originalSize === 0) && file.value) {
      originalSize = file.value.size
    }

    // Calculate percentage if not provided
    if (!reductionPercent && originalSize > 0 && compressedSize > 0) {
      reductionPercent = ((1 - compressedSize / originalSize) * 100).toFixed(2)
    } else if (reductionPercent) {
      reductionPercent = parseFloat(reductionPercent).toFixed(2)
    } else {
      reductionPercent = 'N/A'
    }

    // Store stats for popup
    compressionStats.value = {
      originalSize: originalSize || 0,
      compressedSize: compressedSize || 0,
      reductionPercent: reductionPercent
    }

    console.log('Stats to display:', compressionStats.value)

    // Now get the blob
    const blob = await res.blob()
    
    // Check blob size if compressedSize is not available
    if (!compressedSize || compressedSize === 0) {
      compressedSize = blob.size
      compressionStats.value.compressedSize = blob.size
      
      // Recalculate percentage
      if (originalSize > 0 && compressedSize > 0) {
        reductionPercent = ((1 - compressedSize / originalSize) * 100).toFixed(2)
        compressionStats.value.reductionPercent = reductionPercent
      }
    }

    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `compressed_${fileName}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    statusText.value = 'Compression completed!'
    
    // Show stats popup after a brief delay
    setTimeout(() => {
      showStats.value = true
    }, 500)

    // Reset input after download
    file.value = null
    const input = document.querySelector('input[type="file"]')
    if (input) input.value = ''

  } catch (err) {
    statusText.value = 'Compression failed'
    alert('Compression failed. Please try again.')
    console.error('Error:', err)
  } finally {
    clearInterval(fakeProgress)
    setTimeout(() => {
      loading.value = false
      progress.value = 0
      statusText.value = ''
    }, 2000)
  }
}

const closeStats = () => {
  showStats.value = false
}
</script>

<template>
  <div class="converter">
    <h2>Compress PDF</h2>
    <p class="subtitle">Reduce PDF file size without losing quality</p>

    <label class="upload-box">
      <input
        type="file"
        accept="application/pdf"
        @change="selectFile"
        hidden
      />
      <div class="upload-content">
        <span class="icon">🗜️</span>
        <p><strong>Click to upload</strong> a PDF file</p>
        <small>{{ file ? file.name : 'No file selected' }}</small>
        <small v-if="file" style="display: block; margin-top: 5px; color: #666;">
          Size: {{ formatBytes(file.size) }}
        </small>
      </div>
    </label>

    <button class="merge-btn" @click="compressPdf" :disabled="loading">
      {{ loading ? 'Compressing PDF...' : 'Compress PDF' }}
    </button>

    <div v-if="loading" class="progress-container">
      <p class="status-text">{{ statusText }}</p>
      <div class="progress-wrapper">
        <div class="progress-bar" :style="{ width: progress + '%' }"></div>
      </div>
      <small class="progress-percent">{{ Math.round(progress) }}%</small>
      <small class="progress-estimate" v-if="progress < 90">
        {{ progress < 50 ? 'Approx. 15-30 seconds remaining' : 'Almost done...' }}
      </small>
    </div>

    <!-- Stats Popup -->
    <div v-if="showStats" class="stats-overlay" @click="closeStats">
      <div class="stats-popup" @click.stop>
        <button class="close-btn" @click="closeStats">×</button>
        <h3>🎉 Compression Successful!</h3>
        
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-label">Original Size</div>
            <div class="stat-value">{{ formatBytes(compressionStats.originalSize) }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Compressed Size</div>
            <div class="stat-value">{{ formatBytes(compressionStats.compressedSize) }}</div>
          </div>
          <div class="stat-item highlight" v-if="compressionStats.reductionPercent !== 'N/A'">
            <div class="stat-label">Reduction</div>
            <div class="stat-value">{{ compressionStats.reductionPercent }}%</div>
          </div>
          <div class="stat-item highlight" v-else>
            <div class="stat-label">Reduction</div>
            <div class="stat-value">Calculating...</div>
          </div>
        </div>

        <div class="size-comparison" v-if="compressionStats.reductionPercent !== 'N/A'">
          <div class="size-bar original" 
               :style="{ width: '100%' }">
            <span>Original</span>
          </div>
          <div class="size-bar compressed" 
               :style="{ width: Math.max(10, (100 - parseFloat(compressionStats.reductionPercent || 0))) + '%' }">
            <span>Compressed</span>
          </div>
        </div>
        <div v-else class="size-comparison-placeholder">
          <p>Size comparison not available</p>
        </div>

        <p class="stats-tip">
          File has been downloaded automatically !!!<br> Thanks for using our service.
        </p>
        
        <button class="ok-btn" @click="closeStats">OK</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Add this new style */
.size-comparison-placeholder {
  margin: 25px 0;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  color: #666;
  font-size: 14px;
}

/* Rest of the styles remain the same */
.converter {
  text-align: center;
  position: relative;
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
  background: #f9f9f9;
  transition: all 0.3s ease;
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
  color: #fff;
  font-weight: 600;
  transition: all 0.3s ease;
}

.merge-btn:hover:not(:disabled) {
  background: rgb(220, 95, 65);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(238, 108, 77, 0.3);
}

.merge-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.progress-container {
  margin-top: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 10px;
}

.status-text {
  margin-bottom: 10px;
  font-size: 14px;
  color: #444;
  font-weight: 500;
}

.progress-wrapper {
  height: 10px;
  width: 100%;
  background: #e9ecef;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, rgb(238, 108, 77), rgb(255, 140, 100));
  transition: width 0.3s ease;
  border-radius: 8px;
}

.progress-percent {
  display: block;
  margin-top: 8px;
  font-size: 12px;
  color: #666;
}

.progress-estimate {
  display: block;
  margin-top: 5px;
  font-size: 11px;
  color: #888;
  font-style: italic;
}

/* Stats Popup Styles */
.stats-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.stats-popup {
  background: white;
  border-radius: 16px;
  padding: 30px;
  width: 90%;
  max-width: 400px;
  position: relative;
  animation: slideUp 0.3s ease;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.close-btn {
  position: absolute;
  top: 15px;
  right: 20px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #888;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: #f5f5f5;
  color: #333;
}

.stats-popup h3 {
  margin-top: 0;
  margin-bottom: 25px;
  color: #333;
  font-size: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-bottom: 25px;
}

.stat-item {
  background: #f8f9fa;
  padding: 15px 10px;
  border-radius: 10px;
  text-align: center;
}

.stat-item.highlight {
  background: linear-gradient(135deg, #eef7f5, #d4f1eb);
  border: 2px solid #107667;
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
  font-weight: 500;
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  color: #333;
}

.size-comparison {
  margin: 25px 0;
  position: relative;
  height: 40px;
}

.size-bar {
  height: 30px;
  border-radius: 6px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 12px;
  transition: width 0.8s ease;
}

.size-bar.original {
  background: linear-gradient(90deg, #6c757d, #495057);
}

.size-bar.compressed {
  background: linear-gradient(90deg, rgb(238, 108, 77), rgb(255, 140, 100));
  position: absolute;
  top: 0;
  left: 0;
}

.stats-tip {
  font-size: 13px;
  color: #28a745;
  background: #e8f5e9;
  padding: 10px;
  border-radius: 8px;
  margin: 20px 0;
}

.ok-btn {
  width: 100%;
  padding: 12px;
  background: rgb(238, 108, 77);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.ok-btn:hover {
  background: rgb(220, 95, 65);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(238, 108, 77, 0.3);
}
</style>