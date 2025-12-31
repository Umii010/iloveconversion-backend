<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

const file = ref(null)
const loading = ref(false)
const progress = ref(0)
const statusText = ref('')
const showPreview = ref(false)
const previewCanvas = ref(null)
const selectionCanvas = ref(null)
const pdfDoc = ref(null)
const currentPage = ref(1)
const totalPages = ref(0)
const scale = ref(1)
const isRendering = ref(false)

// Cropping state
const isSelecting = ref(false)
const cropArea = ref({
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  left: 0,
  right: 0,
  top: 0,
  bottom: 0
})
const startPos = ref({ x: 0, y: 0 })
const pageDimensions = ref({ width: 0, height: 0 })

// PDF.js v2 - Stable version
const loadPdfJs = () => {
  return new Promise((resolve) => {
    // Check if already loaded
    if (window.pdfjsLib && window.pdfjsLib.getDocument) {
      console.log('PDF.js already loaded')
      resolve()
      return
    }

    // Load PDF.js v2 from CDN
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js'
    script.onload = () => {
      console.log('PDF.js v2 loaded successfully')
      // Set worker source
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js'
      resolve()
    }
    script.onerror = (error) => {
      console.error('Failed to load PDF.js:', error)
      alert('Failed to load PDF viewer. Please refresh the page.')
      resolve()
    }
    document.head.appendChild(script)
  })
}

const selectFile = async (e) => {
  const selectedFile = e.target.files[0]
  if (!selectedFile) return
  
  file.value = selectedFile
  
  // Load PDF.js if not already loaded
  await loadPdfJs()
  
  if (!window.pdfjsLib) {
    alert('PDF viewer failed to load. Please refresh the page.')
    return
  }
  
  showPreview.value = true
  currentPage.value = 1
  
  await loadAndRenderPdf(selectedFile)
}

const loadAndRenderPdf = async (pdfFile) => {
  if (!window.pdfjsLib || !window.pdfjsLib.getDocument) {
    console.error('PDF.js not available')
    alert('PDF.js library not loaded. Please refresh the page.')
    return
  }
  
  isRendering.value = true
  
  try {
    // Read file as ArrayBuffer
    const arrayBuffer = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target.result)
      reader.onerror = (e) => reject(new Error('Failed to read file'))
      reader.readAsArrayBuffer(pdfFile)
    })
    
    console.log('Loading PDF, size:', arrayBuffer.byteLength, 'bytes')
    
    // Load PDF document with v2 syntax
    const loadingTask = window.pdfjsLib.getDocument({ 
      data: arrayBuffer
    })
    
    pdfDoc.value = await loadingTask.promise
    totalPages.value = pdfDoc.value.numPages
    
    console.log('PDF loaded successfully, pages:', totalPages.value)
    
    await renderPage(currentPage.value)
    await nextTick()
    initSelectionCanvas()
    
  } catch (error) {
    console.error('Error loading PDF:', error)
    alert('Error loading PDF. ' + error.message)
  } finally {
    isRendering.value = false
  }
}

const renderPage = async (pageNumber) => {
  if (!pdfDoc.value || !previewCanvas.value) return

  isRendering.value = true

  try {
    const page = await pdfDoc.value.getPage(pageNumber)

    const canvas = previewCanvas.value
    const context = canvas.getContext('2d')

    // 🔴 VERY IMPORTANT: reset transform
    context.setTransform(1, 0, 0, 1, 0, 0)
    context.clearRect(0, 0, canvas.width, canvas.height)

const viewport = page.getViewport(scale.value)
const unscaledViewport = page.getViewport(1)
    pageDimensions.value = {
      width: unscaledViewport.width,
      height: unscaledViewport.height
    }

    canvas.width = viewport.width
    canvas.height = viewport.height
    canvas.style.width = `${viewport.width}px`
    canvas.style.height = `${viewport.height}px`

    const renderTask = page.render({
      canvasContext: context,
      viewport
    })

    await renderTask.promise   // ✅ MUST await .promise

    // Sync selection canvas
    if (selectionCanvas.value) {
      selectionCanvas.value.width = canvas.width
      selectionCanvas.value.height = canvas.height
      selectionCanvas.value.style.width = canvas.style.width
      selectionCanvas.value.style.height = canvas.style.height
      drawCropArea()
    }

    console.log('Page rendered successfully')
  } catch (error) {
    console.error('PDF render failed:', error)
    alert('Error rendering PDF page')
  } finally {
    isRendering.value = false
  }
}


const initSelectionCanvas = () => {
  if (!selectionCanvas.value || !previewCanvas.value) return
  
  const canvas = selectionCanvas.value
  const preview = previewCanvas.value
  
  // Remove existing listeners
  canvas.removeEventListener('mousedown', startSelection)
  canvas.removeEventListener('mousemove', updateSelection)
  canvas.removeEventListener('mouseup', endSelection)
  canvas.removeEventListener('touchstart', handleTouchStart)
  canvas.removeEventListener('touchmove', handleTouchMove)
  canvas.removeEventListener('touchend', handleTouchEnd)
  
  // Add new listeners
  canvas.addEventListener('mousedown', startSelection)
  document.addEventListener('mousemove', updateSelection)
  document.addEventListener('mouseup', endSelection)
  
  // Touch events
  canvas.addEventListener('touchstart', handleTouchStart)
  document.addEventListener('touchmove', handleTouchMove)
  document.addEventListener('touchend', handleTouchEnd)
}

const startSelection = (e) => {
  e.preventDefault()
  e.stopPropagation()
  
  if (!selectionCanvas.value) return
  
  const canvas = selectionCanvas.value
  const rect = canvas.getBoundingClientRect()
  
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  
  isSelecting.value = true
  startPos.value = { x, y }
  
  cropArea.value = {
    x,
    y,
    width: 0,
    height: 0,
    left: 0,
    right: 0,
    top: 0,
    bottom: 0
  }
  
  drawCropArea()
}

const updateSelection = (e) => {
  if (!isSelecting.value || !selectionCanvas.value) return
  
  e.preventDefault()
  e.stopPropagation()
  
  const canvas = selectionCanvas.value
  const rect = canvas.getBoundingClientRect()
  
  const currentX = e.clientX - rect.left
  const currentY = e.clientY - rect.top
  
  // Constrain to canvas bounds
  const constrainedX = Math.max(0, Math.min(currentX, canvas.width))
  const constrainedY = Math.max(0, Math.min(currentY, canvas.height))
  
  // Calculate width and height
  cropArea.value.width = Math.abs(constrainedX - startPos.value.x)
  cropArea.value.height = Math.abs(constrainedY - startPos.value.y)
  
  // Calculate x and y (ensure positive dimensions)
  cropArea.value.x = Math.min(startPos.value.x, constrainedX)
  cropArea.value.y = Math.min(startPos.value.y, constrainedY)
  
  drawCropArea()
}

const endSelection = (e) => {
  if (!isSelecting.value) return
  
  e.preventDefault()
  e.stopPropagation()
  
  isSelecting.value = false
  convertToPdfPoints()
}

const handleTouchStart = (e) => {
  if (!selectionCanvas.value) return
  
  e.preventDefault()
  const touch = e.touches[0]
  const canvas = selectionCanvas.value
  const rect = canvas.getBoundingClientRect()
  
  const x = touch.clientX - rect.left
  const y = touch.clientY - rect.top
  
  isSelecting.value = true
  startPos.value = { x, y }
  
  cropArea.value = {
    x,
    y,
    width: 0,
    height: 0,
    left: 0,
    right: 0,
    top: 0,
    bottom: 0
  }
  
  drawCropArea()
}

const handleTouchMove = (e) => {
  if (!isSelecting.value || !selectionCanvas.value) return
  
  e.preventDefault()
  const touch = e.touches[0]
  const canvas = selectionCanvas.value
  const rect = canvas.getBoundingClientRect()
  
  const currentX = touch.clientX - rect.left
  const currentY = touch.clientY - rect.top
  
  // Constrain to canvas bounds
  const constrainedX = Math.max(0, Math.min(currentX, canvas.width))
  const constrainedY = Math.max(0, Math.min(currentY, canvas.height))
  
  cropArea.value.width = Math.abs(constrainedX - startPos.value.x)
  cropArea.value.height = Math.abs(constrainedY - startPos.value.y)
  
  cropArea.value.x = Math.min(startPos.value.x, constrainedX)
  cropArea.value.y = Math.min(startPos.value.y, constrainedY)
  
  drawCropArea()
}

const handleTouchEnd = (e) => {
  if (!isSelecting.value) return
  
  e.preventDefault()
  e.stopPropagation()
  
  isSelecting.value = false
  convertToPdfPoints()
}

const drawCropArea = () => {
  if (!selectionCanvas.value) return
  
  const canvas = selectionCanvas.value
  const ctx = canvas.getContext('2d')
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  // Only draw if we have a selection
  if (cropArea.value.width > 0 && cropArea.value.height > 0) {
    // Draw semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Clear the selected area (showing the PDF underneath)
    ctx.clearRect(
      cropArea.value.x,
      cropArea.value.y,
      cropArea.value.width,
      cropArea.value.height
    )
    
    // Draw selection border
    ctx.strokeStyle = '#107667'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    ctx.strokeRect(
      cropArea.value.x,
      cropArea.value.y,
      cropArea.value.width,
      cropArea.value.height
    )
    
    // Draw corner handles
    const handleSize = 8
    ctx.fillStyle = '#107667'
    ctx.setLineDash([])
    
    // Top-left
    ctx.fillRect(
      cropArea.value.x - handleSize/2,
      cropArea.value.y - handleSize/2,
      handleSize,
      handleSize
    )
    
    // Top-right
    ctx.fillRect(
      cropArea.value.x + cropArea.value.width - handleSize/2,
      cropArea.value.y - handleSize/2,
      handleSize,
      handleSize
    )
    
    // Bottom-left
    ctx.fillRect(
      cropArea.value.x - handleSize/2,
      cropArea.value.y + cropArea.value.height - handleSize/2,
      handleSize,
      handleSize
    )
    
    // Bottom-right
    ctx.fillRect(
      cropArea.value.x + cropArea.value.width - handleSize/2,
      cropArea.value.y + cropArea.value.height - handleSize/2,
      handleSize,
      handleSize
    )
    
    // Draw dimensions text
    ctx.fillStyle = '#107667'
    ctx.font = '12px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(
      `${Math.round(cropArea.value.width)} × ${Math.round(cropArea.value.height)}`,
      cropArea.value.x + cropArea.value.width / 2,
      cropArea.value.y + cropArea.value.height + 20
    )
  }
}

// Convert pixel coordinates to PDF points (1/72 inch)
const convertToPdfPoints = () => {
  if (!previewCanvas.value || !pageDimensions.value.width || pageDimensions.value.width === 0) {
    console.warn('Cannot convert to PDF points: missing page dimensions')
    return
  }
  
  const canvas = previewCanvas.value
  
  // Calculate scale factors
  const scaleFactorX = pageDimensions.value.width / canvas.width
  const scaleFactorY = pageDimensions.value.height / canvas.height
  
  console.log('Scale factors:', scaleFactorX, scaleFactorY)
  console.log('Crop area pixels:', cropArea.value.x, cropArea.value.y, cropArea.value.width, cropArea.value.height)
  
  // Convert to PDF points
  const left = cropArea.value.x * scaleFactorX
  const right = (canvas.width - (cropArea.value.x + cropArea.value.width)) * scaleFactorX
  const top = cropArea.value.y * scaleFactorY
  const bottom = (canvas.height - (cropArea.value.y + cropArea.value.height)) * scaleFactorY
  
  // Round to nearest point and ensure non-negative
  cropArea.value.left = Math.max(0, Math.round(left))
  cropArea.value.right = Math.max(0, Math.round(right))
  cropArea.value.top = Math.max(0, Math.round(top))
  cropArea.value.bottom = Math.max(0, Math.round(bottom))
  
  console.log('Converted to PDF points:', cropArea.value)
}

const zoomIn = () => {
  if (scale.value < 3) {
    scale.value += 0.25
    if (pdfDoc.value) renderPage(currentPage.value)
  }
}

const zoomOut = () => {
  if (scale.value > 0.25) {
    scale.value -= 0.25
    if (pdfDoc.value) renderPage(currentPage.value)
  }
}

const resetCrop = () => {
  cropArea.value = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    left: 0,
    right: 0,
    top: 0,
    bottom: 0
  }
  drawCropArea()
}

const cropPdf = async () => {
  if (!file.value) {
    alert('Please select a PDF file')
    return
  }

  // Validate crop area
  if (cropArea.value.width === 0 || cropArea.value.height === 0) {
    alert('Please select a crop area by dragging on the PDF preview')
    return
  }

  loading.value = true
  progress.value = 0
  statusText.value = 'Preparing crop...'

  const formData = new FormData()
  formData.append('pdf', file.value)
  formData.append('crop', JSON.stringify({
    left: cropArea.value.left,
    right: cropArea.value.right,
    top: cropArea.value.top,
    bottom: cropArea.value.bottom
  }))

  let fakeProgress = null

  try {
    fakeProgress = setInterval(() => {
      if (progress.value < 90) progress.value += 5
    }, 120)

    const res = await fetch('http://192.168.0.171:3000/api/crop-pdf', {
      method: 'POST',
      body: formData
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`Server error: ${res.status} - ${errorText}`)
    }

    // Extract filename from response
    const contentDisposition = res.headers.get('Content-Disposition')
    let fileName = `${file.value.name.replace('.pdf', '')}_cropped.pdf`
    
    if (contentDisposition) {
      const matches = contentDisposition.match(/filename="(.+)"/)
      if (matches && matches[1]) {
        fileName = matches[1]
      }
    }

    clearInterval(fakeProgress)
    progress.value = 100
    statusText.value = `Downloading ${fileName}`

    const blob = await res.blob()
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    statusText.value = 'Cropping completed'

    // Reset
    resetState()

  } catch (err) {
    statusText.value = 'Cropping failed'
    alert('Cropping failed: ' + err.message)
    console.error(err)
  } finally {
    if (fakeProgress) clearInterval(fakeProgress)
    loading.value = false
    setTimeout(() => {
      progress.value = 0
      statusText.value = ''
    }, 1500)
  }
}

const resetState = () => {
  file.value = null
  const input = document.querySelector('input[type="file"]')
  if (input) input.value = ''
  
  showPreview.value = false
  if (pdfDoc.value) {
    pdfDoc.value.destroy()
    pdfDoc.value = null
  }
  resetCrop()
}

// Navigation
const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    renderPage(currentPage.value)
  }
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    renderPage(currentPage.value)
  }
}

onUnmounted(() => {
  if (pdfDoc.value) {
    pdfDoc.value.destroy()
  }
})
</script>

<template>
  <div class="converter">
    <h2>Crop PDF</h2>
    <p class="subtitle">Select area to crop from your PDF document</p>

    <label class="upload-box">
      <input
        type="file"
        accept="application/pdf"
        @change="selectFile"
        hidden
      />
      <div class="upload-content">
        <span class="icon">✂️</span>
        <p><strong>Click to upload</strong> a PDF file</p>
        <small>{{ file ? file.name : 'No file selected' }}</small>
      </div>
    </label>

    <!-- Preview & Cropping Section -->
    <div v-if="showPreview" class="preview-section">
      <div class="preview-header">
        <div>
          <h3>Select Crop Area</h3>
          <p class="instruction">Click and drag on the document to select area to keep</p>
        </div>
        <div class="crop-coordinates" v-if="cropArea.width > 0">
          <div class="coord">
            <span>Left:</span>
            <strong>{{ cropArea.left }}pt</strong>
          </div>
          <div class="coord">
            <span>Right:</span>
            <strong>{{ cropArea.right }}pt</strong>
          </div>
          <div class="coord">
            <span>Top:</span>
            <strong>{{ cropArea.top }}pt</strong>
          </div>
          <div class="coord">
            <span>Bottom:</span>
            <strong>{{ cropArea.bottom }}pt</strong>
          </div>
        </div>
      </div>

      <div class="preview-controls">
        <div class="page-controls">
          <button @click="prevPage" :disabled="currentPage <= 1" class="nav-btn">
            ← Previous
          </button>
          <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
          <button @click="nextPage" :disabled="currentPage >= totalPages" class="nav-btn">
            Next →
          </button>
        </div>
        
        <div class="zoom-controls">
          <button @click="zoomOut" class="zoom-btn" title="Zoom Out">-</button>
          <span class="zoom-level">{{ Math.round(scale * 100) }}%</span>
          <button @click="zoomIn" class="zoom-btn" title="Zoom In">+</button>
          <button @click="resetCrop" class="reset-btn">
            Reset Crop
          </button>
        </div>
      </div>

      <div class="preview-container">
        <div v-if="isRendering" class="rendering-overlay">
          <div class="spinner"></div>
          <p>Loading PDF...</p>
        </div>
        
        <div class="canvas-wrapper">
          <canvas ref="previewCanvas" class="preview-canvas"></canvas>
          <canvas ref="selectionCanvas" class="selection-canvas"></canvas>
        </div>
        
        <div v-if="!pdfDoc && !isRendering" class="fallback-preview">
          <div class="fallback-icon">📄</div>
          <p>Upload a PDF to start cropping</p>
        </div>
      </div>
      
      <div class="debug-info" v-if="pdfDoc">
        <p>Page: {{ currentPage }} of {{ totalPages }} | Size: {{ pageDimensions.width.toFixed(0) }} × {{ pageDimensions.height.toFixed(0) }} points | Scale: {{ scale.toFixed(2) }}</p>
      </div>
      
      <div class="crop-instructions">
        <div class="instruction-item">
          <div class="instruction-icon">🎯</div>
          <p><strong>Drag to select</strong> the area you want to keep</p>
        </div>
        <div class="instruction-item">
          <div class="instruction-icon">↔️</div>
          <p><strong>Adjust corners</strong> by dragging the handles</p>
        </div>
        <div class="instruction-item">
          <div class="instruction-icon">📐</div>
          <p>Measurements shown in <strong>PDF points (1/72 inch)</strong></p>
        </div>
      </div>
    </div>

    <div class="crop-actions">
      <button class="crop-btn" @click="cropPdf" :disabled="loading || !file || cropArea.width === 0">
        {{ loading ? 'Cropping PDF...' : 'Crop PDF' }}
      </button>
      
      <div v-if="cropArea.width > 0" class="selected-area-info">
        <p>Selected area: {{ Math.round(cropArea.width) }} × {{ Math.round(cropArea.height) }} pixels</p>
        <p class="dimensions">({{ cropArea.left }}pt left, {{ cropArea.right }}pt right, {{ cropArea.top }}pt top, {{ cropArea.bottom }}pt bottom)</p>
      </div>
    </div>

    <p v-if="loading" class="status-text">{{ statusText }}</p>

    <div v-if="loading" class="progress-wrapper">
      <div class="progress-bar" :style="{ width: progress + '%' }"></div>
    </div>
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
  background: #f9f9f9;
  transition: all 0.3s ease;
  margin-bottom: 20px;
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

/* Preview Section */
.preview-section {
  margin: 25px 0;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.preview-header h3 {
  font-size: 18px;
  color: #333;
  margin: 0 0 5px 0;
}

.instruction {
  font-size: 13px;
  color: #666;
  margin: 0;
}

.crop-coordinates {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  background: white;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  min-width: 200px;
}

.coord {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.coord span {
  font-size: 11px;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.coord strong {
  font-size: 14px;
  color: #107667;
  margin-top: 2px;
}

.preview-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding: 15px 0;
  border-bottom: 1px solid #dee2e6;
  flex-wrap: wrap;
  gap: 15px;
}

.page-controls {
  display: flex;
  align-items: center;
  gap: 15px;
}

.page-info {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.nav-btn {
  padding: 8px 15px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;
}

.nav-btn:hover:not(:disabled) {
  background: #107667;
  color: white;
  border-color: #107667;
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.zoom-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.zoom-btn:hover {
  background: #f0f0f0;
}

.zoom-level {
  font-size: 14px;
  min-width: 50px;
  text-align: center;
  font-weight: 500;
}

.reset-btn {
  padding: 8px 15px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  margin-left: 10px;
}

.reset-btn:hover {
  background: #5a6268;
}

.preview-container {
  position: relative;
  width: 100%;
  min-height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f2f5;
  border-radius: 8px;
  overflow: auto;
  padding: 20px;
  margin-bottom: 20px;
}

.canvas-wrapper {
  position: relative;
  display: inline-block;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.preview-canvas {
  display: block;
  max-width: 100%;
  max-height: 500px;
}

.selection-canvas {
  position: absolute;
  top: 0;
  left: 0;
  cursor: crosshair;
  z-index: 2;
}

.rendering-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: 8px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #107667;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.fallback-preview {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.fallback-icon {
  font-size: 48px;
  margin-bottom: 15px;
  opacity: 0.7;
}

.debug-info {
  background: #f8f9fa;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 11px;
  color: #666;
  text-align: center;
  margin-bottom: 15px;
  border: 1px dashed #dee2e6;
  font-family: monospace;
}

.debug-info p {
  margin: 0;
}

.crop-instructions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  margin-top: 25px;
  padding-top: 20px;
  border-top: 1px solid #dee2e6;
}

.instruction-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  text-align: left;
}

.instruction-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.instruction-item p {
  margin: 0;
  font-size: 13px;
  line-height: 1.4;
}

.instruction-item strong {
  color: #107667;
}

.crop-actions {
  margin: 25px 0;
}

.crop-btn {
  width: 100%;
  padding: 14px;
  font-size: 16px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  background: #107667;
  color: #fff;
  transition: all 0.3s ease;
  font-weight: 600;
}

.crop-btn:hover:not(:disabled) {
  background: #0d5d4f;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 118, 103, 0.2);
}

.crop-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.selected-area-info {
  margin-top: 15px;
  padding: 15px;
  background: #e8f7f4;
  border-radius: 8px;
  border: 1px solid #b8e1d8;
}

.selected-area-info p {
  margin: 5px 0;
  font-size: 13px;
  color: #107667;
}

.dimensions {
  font-size: 12px !important;
  color: #0d5d4f !important;
  font-family: monospace;
}

.status-text {
  margin-top: 10px;
  font-size: 13px;
  color: #444;
}

.progress-wrapper {
  margin-top: 15px;
  height: 10px;
  width: 100%;
  background: #eee;
  border-radius: 8px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: #107667;
  transition: width 0.2s ease;
}
</style>