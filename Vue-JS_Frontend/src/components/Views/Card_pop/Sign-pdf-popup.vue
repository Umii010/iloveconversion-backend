<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const file = ref(null)
const loading = ref(false)
const progress = ref(0)
const statusText = ref('')

const signatureMode = ref('draw') // 'draw', 'type', 'upload', 'stamp'
const signatureType = ref('signature') // 'signature', 'initial', 'date', 'company'

// Canvas drawing
const canvasRef = ref(null)
const isDrawing = ref(false)
const lastX = ref(0)
const lastY = ref(0)
const ctx = ref(null)
const signatureData = ref(null)

// Typed signature
const typedName = ref('John Doe')
const signatureFont = ref('Dancing Script')
const signatureColor = ref('#000000')
const fontSize = ref(24)

// Upload signature
const uploadedSignature = ref(null)
const signatureScale = ref(100)

// Stamp options
const stampType = ref('approved')
const stampColor = ref('#e74c3c')

// Position and appearance
const signaturePosition = ref({ x: 50, y: 50 })
const signatureSize = ref({ width: 200, height: 80 })
const pageNumber = ref(1)
const opacity = ref(100)
const rotation = ref(0)

// Signature history
const signatureHistory = ref([])
const currentSignatureIndex = ref(-1)

// Available fonts for typed signatures
const signatureFonts = ref([
  'Dancing Script',
  'Great Vibes',
  'Allura',
  'Parisienne',
  'Mr Dafoe',
  'Sacramento',
  'Tangerine',
  'Petit Formal Script',
  'Rouge Script',
  'Alex Brush',
  'Brush Script MT',
  'Lucida Handwriting'
])

// Stamp types
const stampTypes = ref([
  { id: 'approved', name: 'Approved', icon: '✅', color: '#2ecc71' },
  { id: 'rejected', name: 'Rejected', icon: '❌', color: '#e74c3c' },
  { id: 'confidential', name: 'Confidential', icon: '🔒', color: '#3498db' },
  { id: 'draft', name: 'Draft', icon: '📝', color: '#f39c12' },
  { id: 'urgent', name: 'Urgent', icon: '⚠️', color: '#e74c3c' },
  { id: 'verified', name: 'Verified', icon: '✓', color: '#2ecc71' },
  { id: 'received', name: 'Received', icon: '📨', color: '#9b59b6' },
  { id: 'paid', name: 'Paid', icon: '💵', color: '#2ecc71' }
])

// Initialize canvas
onMounted(() => {
  if (canvasRef.value) {
    ctx.value = canvasRef.value.getContext('2d')
    setupCanvas()
  }
  
  // Load saved signatures from localStorage
  loadSavedSignatures()
})

const setupCanvas = () => {
  if (!ctx.value || !canvasRef.value) return
  
  const canvas = canvasRef.value
  canvas.width = 400
  canvas.height = 150
  
  // Set canvas background
  ctx.value.fillStyle = '#ffffff'
  ctx.value.fillRect(0, 0, canvas.width, canvas.height)
  
  // Set drawing style
  ctx.value.lineWidth = 2
  ctx.value.lineCap = 'round'
  ctx.value.lineJoin = 'round'
  ctx.value.strokeStyle = '#000000'
}

const startDrawing = (e) => {
  isDrawing.value = true
  const rect = canvasRef.value.getBoundingClientRect()
  lastX.value = e.clientX - rect.left
  lastY.value = e.clientY - rect.top
}

const draw = (e) => {
  if (!isDrawing.value || !ctx.value) return
  
  e.preventDefault()
  const rect = canvasRef.value.getBoundingClientRect()
  const currentX = e.clientX - rect.left
  const currentY = e.clientY - rect.top
  
  ctx.value.beginPath()
  ctx.value.moveTo(lastX.value, lastY.value)
  ctx.value.lineTo(currentX, currentY)
  ctx.value.stroke()
  
  lastX.value = currentX
  lastY.value = currentY
  
  // Save to history
  saveToHistory()
}

const stopDrawing = () => {
  isDrawing.value = false
}

const clearCanvas = () => {
  if (!ctx.value || !canvasRef.value) return
  
  ctx.value.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
  ctx.value.fillStyle = '#ffffff'
  ctx.value.fillRect(0, 0, canvasRef.value.width, canvasRef.value.height)
  
  signatureData.value = null
  saveToHistory()
}

const saveToHistory = () => {
  if (!canvasRef.value) return
  
  const dataUrl = canvasRef.value.toDataURL('image/png')
  signatureHistory.value.push(dataUrl)
  currentSignatureIndex.value = signatureHistory.value.length - 1
  signatureData.value = dataUrl
}

const undoSignature = () => {
  if (currentSignatureIndex.value > 0) {
    currentSignatureIndex.value--
    const prevSignature = signatureHistory.value[currentSignatureIndex.value]
    loadSignatureFromDataUrl(prevSignature)
  } else {
    clearCanvas()
  }
}

const redoSignature = () => {
  if (currentSignatureIndex.value < signatureHistory.value.length - 1) {
    currentSignatureIndex.value++
    const nextSignature = signatureHistory.value[currentSignatureIndex.value]
    loadSignatureFromDataUrl(nextSignature)
  }
}

const loadSignatureFromDataUrl = (dataUrl) => {
  if (!ctx.value || !canvasRef.value) return
  
  const img = new Image()
  img.onload = () => {
    ctx.value.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
    ctx.value.drawImage(img, 0, 0)
  }
  img.src = dataUrl
  signatureData.value = dataUrl
}

const uploadSignature = (e) => {
  const file = e.target.files[0]
  if (!file) return
  
  if (!file.type.match('image.*')) {
    alert('Please select an image file (PNG, JPG, GIF)')
    return
  }
  
  const reader = new FileReader()
  reader.onload = (e) => {
    uploadedSignature.value = e.target.result
    signatureMode.value = 'upload'
  }
  reader.readAsDataURL(file)
}

const saveSignature = () => {
  if (signatureMode.value === 'draw' && !signatureData.value) {
    alert('Please draw a signature first')
    return
  }
  
  if (signatureMode.value === 'type' && !typedName.value.trim()) {
    alert('Please enter your name')
    return
  }
  
  if (signatureMode.value === 'upload' && !uploadedSignature.value) {
    alert('Please upload a signature image')
    return
  }
  
  // Save to localStorage
  const signature = {
    id: Date.now(),
    mode: signatureMode.value,
    data: signatureMode.value === 'draw' ? signatureData.value : 
          signatureMode.value === 'type' ? typedName.value :
          uploadedSignature.value,
    font: signatureMode.value === 'type' ? signatureFont.value : null,
    color: signatureMode.value === 'type' ? signatureColor.value : null,
    timestamp: new Date().toISOString(),
    type: signatureType.value
  }
  
  let savedSignatures = JSON.parse(localStorage.getItem('pdfSignatures') || '[]')
  savedSignatures.push(signature)
  localStorage.setItem('pdfSignatures', JSON.stringify(savedSignatures))
  
  alert('Signature saved successfully!')
  loadSavedSignatures()
}

const loadSavedSignatures = () => {
  const saved = JSON.parse(localStorage.getItem('pdfSignatures') || '[]')
  // Sort by most recent
  savedSignatures.value = saved.reverse().slice(0, 10) // Keep last 10
}

const savedSignatures = ref([])

const useSavedSignature = (signature) => {
  if (signature.mode === 'draw' || signature.mode === 'upload') {
    signatureData.value = signature.data
    signatureMode.value = signature.mode
    if (signature.mode === 'draw' && canvasRef.value) {
      loadSignatureFromDataUrl(signature.data)
    } else if (signature.mode === 'upload') {
      uploadedSignature.value = signature.data
    }
  } else if (signature.mode === 'type') {
    typedName.value = signature.data
    signatureFont.value = signature.font
    signatureColor.value = signature.color
    signatureMode.value = 'type'
  }
  
  signatureType.value = signature.type
}

const deleteSavedSignature = (id, e) => {
  e.stopPropagation()
  
  if (confirm('Delete this saved signature?')) {
    let savedSignatures = JSON.parse(localStorage.getItem('pdfSignatures') || '[]')
    savedSignatures = savedSignatures.filter(sig => sig.id !== id)
    localStorage.setItem('pdfSignatures', JSON.stringify(savedSignatures))
    loadSavedSignatures()
  }
}

const selectFile = (e) => {
  const selectedFile = e.target.files[0]
  if (!selectedFile) return
  
  file.value = selectedFile
  console.log('File selected for signing:', selectedFile.name)
}

const signPdf = async () => {
  if (!file.value) {
    alert('Please select a PDF file')
    return
  }

  // Validate signature
  if (signatureMode.value === 'draw' && !signatureData.value) {
    alert('Please draw your signature first')
    return
  }
  
  if (signatureMode.value === 'type' && !typedName.value.trim()) {
    alert('Please enter your name for the signature')
    return
  }
  
  if (signatureMode.value === 'upload' && !uploadedSignature.value) {
    alert('Please upload a signature image')
    return
  }

  loading.value = true
  progress.value = 0
  statusText.value = 'Preparing signature...'

  // Prepare signature data
  const signatureInfo = {
    mode: signatureMode.value,
    type: signatureType.value,
    position: signaturePosition.value,
    size: signatureSize.value,
    page: pageNumber.value,
    opacity: opacity.value,
    rotation: rotation.value,
    timestamp: new Date().toISOString(),
    signer: typedName.value || 'Anonymous'
  }

  // Add signature data based on mode
  if (signatureMode.value === 'draw') {
    signatureInfo.data = signatureData.value
  } else if (signatureMode.value === 'type') {
    signatureInfo.data = typedName.value
    signatureInfo.font = signatureFont.value
    signatureInfo.color = signatureColor.value
    signatureInfo.fontSize = fontSize.value
  } else if (signatureMode.value === 'upload') {
    signatureInfo.data = uploadedSignature.value
    signatureInfo.scale = signatureScale.value
  } else if (signatureMode.value === 'stamp') {
    signatureInfo.stampType = stampType.value
    signatureInfo.stampColor = stampColor.value
  }

  const formData = new FormData()
  formData.append('pdf', file.value)
  formData.append('signature', JSON.stringify(signatureInfo))

  let fakeProgress = null

  try {
    fakeProgress = setInterval(() => {
      if (progress.value < 90) {
        progress.value += 10
        updateStatusText(progress.value)
      }
    }, 300)

    // Call sign PDF API
    const res = await fetch('http://192.168.18.101:3000/api/sign-pdf', {
      method: 'POST',
      body: formData
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`Server error: ${res.status} - ${errorText}`)
    }

    clearInterval(fakeProgress)
    progress.value = 100
    statusText.value = 'Downloading signed PDF...'

    // Get filename
    const contentDisposition = res.headers.get('content-disposition')
    let fileName = `signed_${file.value.name}`
    
    if (contentDisposition) {
      const matches = contentDisposition.match(/filename="(.+)"/)
      if (matches && matches[1]) {
        fileName = matches[1]
      }
    }

    // Download the signed PDF
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    statusText.value = 'PDF signed successfully!'

    // Save signature to history if not already saved
    if (!savedSignatures.value.some(sig => 
      sig.mode === signatureMode.value && 
      sig.data === signatureInfo.data
    )) {
      saveSignature()
    }

  } catch (err) {
    statusText.value = 'Signing failed'
    alert('Signing failed: ' + err.message)
    console.error('Signing error:', err)
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
    statusText.value = 'Processing PDF...'
  } else if (progressValue < 40) {
    statusText.value = 'Adding signature...'
  } else if (progressValue < 60) {
    statusText.value = 'Applying security features...'
  } else if (progressValue < 80) {
    statusText.value = 'Finalizing document...'
  } else {
    statusText.value = 'Creating download...'
  }
}

const resetSignature = () => {
  if (confirm('Clear current signature and start over?')) {
    signatureMode.value = 'draw'
    typedName.value = 'John Doe'
    uploadedSignature.value = null
    signatureData.value = null
    clearCanvas()
    signaturePosition.value = { x: 50, y: 50 }
    signatureSize.value = { width: 200, height: 80 }
    pageNumber.value = 1
    opacity.value = 100
    rotation.value = 0
  }
}

const downloadSignature = () => {
  if (signatureMode.value === 'draw' && signatureData.value) {
    const a = document.createElement('a')
    a.href = signatureData.value
    a.download = 'signature.png'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  } else if (signatureMode.value === 'type') {
    // Create canvas for typed signature
    const canvas = document.createElement('canvas')
    canvas.width = 400
    canvas.height = 150
    const ctx = canvas.getContext('2d')
    
    // Set background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Draw text
    ctx.font = `${fontSize.value}px "${signatureFont.value}"`
    ctx.fillStyle = signatureColor.value
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(typedName.value, canvas.width / 2, canvas.height / 2)
    
    // Download
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = 'signature.png'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }
}

// Touch events for mobile drawing
const handleTouchStart = (e) => {
  e.preventDefault()
  const touch = e.touches[0]
  const mouseEvent = new MouseEvent('mousedown', {
    clientX: touch.clientX,
    clientY: touch.clientY
  })
  canvasRef.value.dispatchEvent(mouseEvent)
}

const handleTouchMove = (e) => {
  e.preventDefault()
  const touch = e.touches[0]
  const mouseEvent = new MouseEvent('mousemove', {
    clientX: touch.clientX,
    clientY: touch.clientY
  })
  canvasRef.value.dispatchEvent(mouseEvent)
}

const handleTouchEnd = (e) => {
  e.preventDefault()
  const mouseEvent = new MouseEvent('mouseup', {})
  canvasRef.value.dispatchEvent(mouseEvent)
}

// Add touch event listeners
onMounted(() => {
  if (canvasRef.value) {
    canvasRef.value.addEventListener('touchstart', handleTouchStart, { passive: false })
    canvasRef.value.addEventListener('touchmove', handleTouchMove, { passive: false })
    canvasRef.value.addEventListener('touchend', handleTouchEnd, { passive: false })
  }
})

onUnmounted(() => {
  if (canvasRef.value) {
    canvasRef.value.removeEventListener('touchstart', handleTouchStart)
    canvasRef.value.removeEventListener('touchmove', handleTouchMove)
    canvasRef.value.removeEventListener('touchend', handleTouchEnd)
  }
})
</script>

<template>
  <div class="converter">
    <h2>Sign PDF</h2>
    <p class="subtitle">Add digital signatures, stamps, or initials to your PDF documents</p>

    <!-- File Upload -->
    <label class="upload-box" v-if="!file">
      <input
        type="file"
        accept="application/pdf"
        @change="selectFile"
        hidden
      />
      <div class="upload-content">
        <span class="icon">✍️</span>
        <p><strong>Click to upload</strong> a PDF file to sign</p>
        <small>{{ file ? file.name : 'No file selected' }}</small>
      </div>
    </label>

    <!-- Main Interface -->
    <div v-if="file" class="sign-interface">
      <!-- Signature Creation Area -->
      <div class="signature-creation">
        <div class="creation-header">
          <h3>Create Signature</h3>
          <div class="signature-type">
            <label class="type-option">
              <input 
                type="radio" 
                v-model="signatureType" 
                value="signature"
                :disabled="loading"
              />
              <span>Full Signature</span>
            </label>
            <label class="type-option">
              <input 
                type="radio" 
                v-model="signatureType" 
                value="initial"
                :disabled="loading"
              />
              <span>Initials</span>
            </label>
            <label class="type-option">
              <input 
                type="radio" 
                v-model="signatureType" 
                value="date"
                :disabled="loading"
              />
              <span>Date Stamp</span>
            </label>
            <label class="type-option">
              <input 
                type="radio" 
                v-model="signatureType" 
                value="company"
                :disabled="loading"
              />
              <span>Company Seal</span>
            </label>
          </div>
        </div>

        <!-- Signature Mode Tabs -->
        <div class="mode-tabs">
          <button 
            v-for="mode in ['draw', 'type', 'upload', 'stamp']" 
            :key="mode"
            @click="signatureMode = mode"
            :class="['mode-tab', { active: signatureMode === mode }]"
            :disabled="loading"
          >
            <span class="tab-icon">
              {{ mode === 'draw' ? '✍️' : 
                 mode === 'type' ? '🔤' : 
                 mode === 'upload' ? '📤' : '🏷️' }}
            </span>
            <span class="tab-text">
              {{ mode === 'draw' ? 'Draw' : 
                 mode === 'type' ? 'Type' : 
                 mode === 'upload' ? 'Upload' : 'Stamp' }}
            </span>
          </button>
        </div>

        <!-- Drawing Canvas -->
        <div v-if="signatureMode === 'draw'" class="drawing-area">
          <div class="canvas-container">
            <canvas
              ref="canvasRef"
              @mousedown="startDrawing"
              @mousemove="draw"
              @mouseup="stopDrawing"
              @mouseleave="stopDrawing"
              class="signature-canvas"
            ></canvas>
            <div class="canvas-overlay">
              <p>Draw your signature in the box above</p>
              <p class="hint">Use mouse, touchpad, or touch screen</p>
            </div>
          </div>
          <div class="drawing-controls">
            <button @click="clearCanvas" class="control-btn" :disabled="loading">
              🗑️ Clear
            </button>
            <button @click="undoSignature" class="control-btn" :disabled="loading || currentSignatureIndex <= 0">
              ↩️ Undo
            </button>
            <button @click="redoSignature" class="control-btn" :disabled="loading || currentSignatureIndex >= signatureHistory.length - 1">
              ↪️ Redo
            </button>
            <button @click="downloadSignature" class="control-btn" :disabled="loading || !signatureData">
              ⬇️ Save Image
            </button>
          </div>
        </div>

        <!-- Type Signature -->
        <div v-if="signatureMode === 'type'" class="type-signature">
          <div class="type-inputs">
            <input 
              type="text" 
              v-model="typedName" 
              class="name-input"
              placeholder="Enter your name"
              :disabled="loading"
            />
            <div class="type-options">
              <div class="option-group">
                <label>Font Style</label>
                <select v-model="signatureFont" class="font-select" :disabled="loading">
                  <option v-for="font in signatureFonts" :key="font" :value="font">
                    {{ font }}
                  </option>
                </select>
              </div>
              <div class="option-group">
                <label>Font Size</label>
                <input 
                  type="range" 
                  v-model="fontSize" 
                  min="16" 
                  max="48" 
                  class="size-slider"
                  :disabled="loading"
                />
                <span class="size-value">{{ fontSize }}px</span>
              </div>
              <div class="option-group">
                <label>Color</label>
                <input 
                  type="color" 
                  v-model="signatureColor" 
                  class="color-picker"
                  :disabled="loading"
                />
              </div>
            </div>
          </div>
          <div class="type-preview">
            <div 
              class="preview-box"
              :style="{
                fontFamily: signatureFont,
                fontSize: fontSize + 'px',
                color: signatureColor
              }"
            >
              {{ typedName || 'Your Name' }}
            </div>
          </div>
        </div>

        <!-- Upload Signature -->
        <div v-if="signatureMode === 'upload'" class="upload-signature">
          <div class="upload-area">
            <label class="upload-label">
              <input
                type="file"
                accept="image/*"
                @change="uploadSignature"
                hidden
                :disabled="loading"
              />
              <div class="upload-placeholder">
                <span class="upload-icon">📤</span>
                <p><strong>Click to upload</strong> signature image</p>
                <p class="hint">PNG, JPG, or GIF - Transparent background recommended</p>
              </div>
            </label>
            <div v-if="uploadedSignature" class="uploaded-preview">
              <img :src="uploadedSignature" alt="Uploaded Signature" class="signature-image" />
              <div class="upload-controls">
                <label class="scale-control">
                  <span>Scale: {{ signatureScale }}%</span>
                  <input 
                    type="range" 
                    v-model="signatureScale" 
                    min="50" 
                    max="200" 
                    class="scale-slider"
                    :disabled="loading"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Stamp -->
        <div v-if="signatureMode === 'stamp'" class="stamp-signature">
          <div class="stamp-grid">
            <button 
              v-for="stamp in stampTypes" 
              :key="stamp.id"
              @click="stampType = stamp.id; stampColor = stamp.color"
              :class="['stamp-btn', { active: stampType === stamp.id }]"
              :style="{ '--stamp-color': stamp.color }"
              :disabled="loading"
            >
              <span class="stamp-icon">{{ stamp.icon }}</span>
              <span class="stamp-name">{{ stamp.name }}</span>
            </button>
          </div>
          <div class="stamp-preview">
            <div 
              class="preview-stamp"
              :style="{
                backgroundColor: stampColor + '20',
                borderColor: stampColor,
                color: stampColor
              }"
            >
              <span class="stamp-icon-large">
                {{ stampTypes.find(s => s.id === stampType)?.icon }}
              </span>
              <span class="stamp-text">
                {{ stampTypes.find(s => s.id === stampType)?.name?.toUpperCase() }}
              </span>
              <span class="stamp-date">{{ new Date().toLocaleDateString() }}</span>
            </div>
          </div>
        </div>

        <!-- Save Signature -->
        <div class="save-signature">
          <button @click="saveSignature" class="save-btn" :disabled="loading">
            💾 Save Signature
          </button>
          <p class="save-hint">Save for future use (stored locally in your browser)</p>
        </div>
      </div>

      <!-- Saved Signatures -->
      <div v-if="savedSignatures.length > 0" class="saved-signatures">
        <h3>Saved Signatures</h3>
        <div class="signatures-grid">
          <div 
            v-for="sig in savedSignatures" 
            :key="sig.id"
            class="saved-signature"
            @click="useSavedSignature(sig)"
            :title="`Click to use • ${new Date(sig.timestamp).toLocaleDateString()}`"
          >
            <div class="signature-preview">
              <div v-if="sig.mode === 'draw' || sig.mode === 'upload'" class="image-preview">
                <img :src="sig.data" :alt="sig.type" />
              </div>
              <div v-else-if="sig.mode === 'type'" class="text-preview" :style="{ fontFamily: sig.font, color: sig.color }">
                {{ sig.data }}
              </div>
            </div>
            <div class="signature-info">
              <span class="sig-type">{{ sig.type }}</span>
              <span class="sig-mode">{{ sig.mode }}</span>
              <button @click="deleteSavedSignature(sig.id, $event)" class="delete-btn" title="Delete">
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Signature Placement -->
      <div class="placement-options">
        <h3>Placement Options</h3>
        <div class="placement-grid">
          <div class="placement-group">
            <label>Page Number</label>
            <input 
              type="number" 
              v-model.number="pageNumber" 
              min="1" 
              class="page-input"
              :disabled="loading"
            />
          </div>
          <div class="placement-group">
            <label>Position X</label>
            <input 
              type="range" 
              v-model.number="signaturePosition.x" 
              min="0" 
              max="100" 
              class="position-slider"
              :disabled="loading"
            />
            <span class="position-value">{{ signaturePosition.x }}%</span>
          </div>
          <div class="placement-group">
            <label>Position Y</label>
            <input 
              type="range" 
              v-model.number="signaturePosition.y" 
              min="0" 
              max="100" 
              class="position-slider"
              :disabled="loading"
            />
            <span class="position-value">{{ signaturePosition.y }}%</span>
          </div>
          <div class="placement-group">
            <label>Size</label>
            <select v-model="signatureSize.width" class="size-select" :disabled="loading">
              <option value="150">Small (150px)</option>
              <option value="200">Medium (200px)</option>
              <option value="250">Large (250px)</option>
              <option value="300">Extra Large (300px)</option>
            </select>
          </div>
          <div class="placement-group">
            <label>Opacity</label>
            <input 
              type="range" 
              v-model.number="opacity" 
              min="0" 
              max="100" 
              class="opacity-slider"
              :disabled="loading"
            />
            <span class="opacity-value">{{ opacity }}%</span>
          </div>
          <div class="placement-group">
            <label>Rotation</label>
            <input 
              type="range" 
              v-model.number="rotation" 
              min="-45" 
              max="45" 
              class="rotation-slider"
              :disabled="loading"
            />
            <span class="rotation-value">{{ rotation }}°</span>
          </div>
        </div>
        <div class="placement-preview">
          <div class="preview-box-large">
            <div class="page-outline">
              <div 
                class="signature-preview-placement"
                :style="{
                  left: signaturePosition.x + '%',
                  top: signaturePosition.y + '%',
                  width: signatureSize.width + 'px',
                  height: signatureSize.height + 'px',
                  opacity: opacity / 100,
                  transform: `rotate(${rotation}deg)`
                }"
              >
                <div class="preview-content">
                  <span v-if="signatureMode === 'type'">{{ typedName }}</span>
                  <span v-else-if="signatureMode === 'stamp'">STAMP</span>
                  <span v-else>SIGNATURE</span>
                </div>
              </div>
            </div>
            <div class="preview-info">
              <p>Preview: Page {{ pageNumber }}, Position ({{ signaturePosition.x }}%, {{ signaturePosition.y }}%), Size: {{ signatureSize.width }}px</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <button 
          @click="signPdf" 
          class="sign-btn primary"
          :disabled="loading"
        >
          <span v-if="!loading">✍️ Sign PDF</span>
          <span v-else>Processing...</span>
        </button>
        
        <button 
          @click="resetSignature" 
          class="sign-btn secondary"
          :disabled="loading"
        >
          🔄 Reset
        </button>
        
        <button 
          @click="file = null" 
          class="sign-btn tertiary"
          :disabled="loading"
        >
          📄 Change PDF
        </button>
      </div>

      <!-- Progress Bar -->
      <div v-if="loading" class="progress-section">
        <div class="progress-header">
          <span class="progress-text">{{ statusText }}</span>
          <span class="progress-percent">{{ progress }}%</span>
        </div>
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: progress + '%' }"
          ></div>
        </div>
      </div>

      <!-- File Info -->
      <div class="file-info">
        <div class="info-card">
          <div class="info-header">
            <span class="info-icon">📄</span>
            <h4>Selected PDF</h4>
          </div>
          <div class="info-content">
            <p class="filename">{{ file.name }}</p>
            <p class="filesize">{{ (file.size / 1024).toFixed(2) }} KB</p>
          </div>
        </div>
        
        <div class="info-card">
          <div class="info-header">
            <span class="info-icon">✍️</span>
            <h4>Signature Details</h4>
          </div>
          <div class="info-content">
            <p><strong>Type:</strong> {{ signatureType }}</p>
            <p><strong>Mode:</strong> {{ signatureMode }}</p>
            <p><strong>Page:</strong> {{ pageNumber }}</p>
            <p><strong>Position:</strong> ({{ signaturePosition.x }}%, {{ signaturePosition.y }}%)</p>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.converter {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

h2 {
  color: #2c3e50;
  text-align: center;
  margin-bottom: 10px;
}

.subtitle {
  color: #7f8c8d;
  text-align: center;
  margin-bottom: 40px;
}

/* Upload Box */
.upload-box {
  display: block;
  border: 3px dashed #3498db;
  border-radius: 12px;
  padding: 60px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  margin-bottom: 40px;
}

.upload-box:hover {
  border-color: #2980b9;
  background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
  transform: translateY(-2px);
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.upload-content .icon {
  font-size: 48px;
}

.upload-content strong {
  color: #2c3e50;
  font-size: 18px;
}

.upload-content small {
  color: #7f8c8d;
}

/* Main Interface */
.sign-interface {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.signature-creation {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.creation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.signature-type {
  display: flex;
  gap: 15px;
}

.type-option {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.type-option:hover {
  background-color: #f8f9fa;
}

.type-option input {
  margin: 0;
}

/* Mode Tabs */
.mode-tabs {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 25px;
}

.mode-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 15px 10px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.mode-tab:hover {
  border-color: #3498db;
  transform: translateY(-2px);
}

.mode-tab.active {
  border-color: #3498db;
  background: #ebf5fb;
}

.tab-icon {
  font-size: 24px;
}

.tab-text {
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
}

/* Drawing Area */
.drawing-area {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.canvas-container {
  position: relative;
  border: 2px solid #bdc3c7;
  border-radius: 8px;
  overflow: hidden;
}

.signature-canvas {
  display: block;
  width: 100%;
  height: 150px;
  background: white;
  cursor: crosshair;
}

.canvas-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  pointer-events: none;
  color: #95a5a6;
  text-align: center;
}

.hint {
  font-size: 12px;
  color: #bdc3c7;
  margin-top: 5px;
}

.drawing-controls {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.control-btn {
  padding: 10px 20px;
  border: 1px solid #bdc3c7;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-btn:hover:not(:disabled) {
  background: #f8f9fa;
  border-color: #3498db;
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Type Signature */
.type-signature {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.type-inputs {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.name-input {
  padding: 15px;
  border: 2px solid #bdc3c7;
  border-radius: 8px;
  font-size: 18px;
  transition: border-color 0.3s;
}

.name-input:focus {
  outline: none;
  border-color: #3498db;
}

.type-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.option-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-group label {
  font-size: 14px;
  color: #7f8c8d;
  font-weight: 600;
}

.font-select,
.color-picker,
.size-select {
  padding: 10px;
  border: 2px solid #bdc3c7;
  border-radius: 6px;
  cursor: pointer;
}

.size-slider,
.scale-slider,
.position-slider,
.opacity-slider,
.rotation-slider {
  width: 100%;
}

.size-value,
.position-value,
.opacity-value,
.rotation-value {
  font-size: 14px;
  color: #7f8c8d;
  text-align: center;
  display: block;
}

.type-preview {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.preview-box {
  padding: 30px 50px;
  border: 2px dashed #bdc3c7;
  border-radius: 8px;
  background: white;
  min-width: 300px;
  text-align: center;
  white-space: nowrap;
}

/* Upload Signature */
.upload-signature {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.upload-area {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.upload-label {
  cursor: pointer;
}

.upload-placeholder {
  border: 3px dashed #3498db;
  border-radius: 10px;
  padding: 40px 20px;
  text-align: center;
  background: #ebf5fb;
  transition: all 0.3s;
}

.upload-placeholder:hover {
  background: #d6eaf8;
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 15px;
  display: block;
}

.uploaded-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.signature-image {
  max-width: 300px;
  max-height: 150px;
  border: 2px solid #bdc3c7;
  border-radius: 8px;
  padding: 10px;
  background: white;
}

.upload-controls {
  width: 100%;
  max-width: 300px;
}

.scale-control {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Stamp Signature */
.stamp-signature {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.stamp-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
}

.stamp-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 15px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  background: white;
  cursor: pointer;
  transition: all 0.3s;
}

.stamp-btn:hover:not(:disabled) {
  border-color: var(--stamp-color);
  transform: translateY(-2px);
}

.stamp-btn.active {
  border-color: var(--stamp-color);
  background: color-mix(in srgb, var(--stamp-color) 10%, white);
}

.stamp-icon {
  font-size: 24px;
}

.stamp-name {
  font-size: 12px;
  font-weight: 600;
  color: #2c3e50;
}

.stamp-preview {
  display: flex;
  justify-content: center;
}

.preview-stamp {
  padding: 20px 30px;
  border: 3px solid;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  font-weight: bold;
  background: white;
}

.stamp-icon-large {
  font-size: 36px;
}

.stamp-text {
  font-size: 18px;
  letter-spacing: 2px;
}

.stamp-date {
  font-size: 12px;
  opacity: 0.8;
}

/* Save Signature */
.save-signature {
  margin-top: 25px;
  padding-top: 25px;
  border-top: 1px solid #ecf0f1;
  text-align: center;
}

.save-btn {
  padding: 15px 40px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
}

.save-btn:hover:not(:disabled) {
  background: #2980b9;
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.save-hint {
  font-size: 12px;
  color: #7f8c8d;
  margin-top: 8px;
}

/* Saved Signatures */
.saved-signatures {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.signatures-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.saved-signature {
  border: 2px solid #ecf0f1;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
}

.saved-signature:hover {
  border-color: #3498db;
  transform: translateY(-2px);
}

.signature-preview {
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  padding: 10px;
}

.image-preview img {
  max-width: 100%;
  max-height: 100%;
}

.text-preview {
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.signature-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #f8f9fa;
  font-size: 12px;
}

.sig-type {
  background: #3498db;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
}

.sig-mode {
  color: #7f8c8d;
}

.delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  opacity: 0.6;
}

.delete-btn:hover {
  opacity: 1;
}

/* Placement Options */
.placement-options {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.placement-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin: 20px 0;
}

.placement-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.placement-group label {
  font-size: 14px;
  color: #7f8c8d;
  font-weight: 600;
}

.page-input {
  padding: 10px;
  border: 2px solid #bdc3c7;
  border-radius: 6px;
  width: 100%;
}

.placement-preview {
  margin-top: 25px;
}

.preview-box-large {
  border: 2px solid #bdc3c7;
  border-radius: 8px;
  padding: 20px;
  background: #f8f9fa;
}

.page-outline {
  position: relative;
  width: 100%;
  height: 300px;
  border: 1px solid #dee2e6;
  background: white;
  margin-bottom: 15px;
}

.signature-preview-placement {
  position: absolute;
  border: 2px dashed #3498db;
  background: rgba(52, 152, 219, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-content {
  padding: 10px;
  font-weight: 600;
  color: #3498db;
}

.preview-info {
  text-align: center;
  color: #7f8c8d;
  font-size: 14px;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin: 30px 0;
}

.sign-btn {
  padding: 15px 40px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 10px;
}

.sign-btn.primary {
  background: #2ecc71;
  color: white;
}

.sign-btn.primary:hover:not(:disabled) {
  background: #27ae60;
  transform: translateY(-2px);
}

.sign-btn.secondary {
  background: #f39c12;
  color: white;
}

.sign-btn.secondary:hover:not(:disabled) {
  background: #d68910;
}

.sign-btn.tertiary {
  background: #95a5a6;
  color: white;
}

.sign-btn.tertiary:hover:not(:disabled) {
  background: #7f8c8d;
}

.sign-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

/* Progress Section */
.progress-section {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.progress-text {
  font-weight: 600;
  color: #2c3e50;
}

.progress-percent {
  font-weight: bold;
  color: #3498db;
}

.progress-bar {
  height: 10px;
  background: #ecf0f1;
  border-radius: 5px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3498db, #2ecc71);
  border-radius: 5px;
  transition: width 0.3s ease;
}


/* Responsive Design */
@media (max-width: 768px) {
  .mode-tabs,
  .stamp-grid,
  .placement-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .type-options {
    grid-template-columns: 1fr;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .signatures-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .file-info {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .mode-tabs,
  .stamp-grid,
  .placement-grid,
  .signatures-grid {
    grid-template-columns: 1fr;
  }
  
  .steps {
    grid-template-columns: 1fr;
  }
  
  .converter {
    padding: 10px;
  }
}
</style>