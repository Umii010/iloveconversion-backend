<script setup>
import { ref } from 'vue'

const file = ref(null)
const loading = ref(false)
const progress = ref(0)
const statusText = ref('')

// Page number settings
const pageSettings = ref({
  position: 'bottom-center', // bottom-center, bottom-right, top-center, top-right
  startFrom: 1,
  format: '1', // 1, i, I, a, A
  fontSize: 12,
  fontColor: '#000000',
  margin: 20, // in points
  includeTotal: false, // Show "Page X of Y"
  excludeFirstPage: false,
  excludeLastPage: false,
  customText: '', // Optional text before/after number
  customTextPosition: 'after' // before or after
})

// Position options
const positionOptions = ref([
  { id: 'bottom-center', name: 'Bottom Center', icon: '↓' },
  { id: 'bottom-right', name: 'Bottom Right', icon: '↘' },
  { id: 'top-center', name: 'Top Center', icon: '↑' },
  { id: 'top-right', name: 'Top Right', icon: '↗' },
  { id: 'bottom-left', name: 'Bottom Left', icon: '↙' },
  { id: 'top-left', name: 'Top Left', icon: '↖' }
])

// Format options
const formatOptions = ref([
  { id: '1', name: 'Numbers (1, 2, 3)' },
  { id: 'i', name: 'Roman (i, ii, iii)' },
  { id: 'I', name: 'Roman (I, II, III)' },
  { id: 'a', name: 'Letters (a, b, c)' },
  { id: 'A', name: 'Letters (A, B, C)' }
])

// Font size options
const fontSizeOptions = ref([8, 10, 12, 14, 16, 18, 20, 24, 28, 32])

// Color presets
const colorPresets = ref([
  '#000000', // Black
  '#333333', // Dark Gray
  '#666666', // Gray
  '#999999', // Light Gray
  '#4A6FA5', // Blue
  '#107667', // Teal
  '#D9534F', // Red
  '#5CB85C', // Green
  '#F0AD4E', // Orange
  '#5BC0DE'  // Light Blue
])

const selectFile = (e) => {
  const selectedFile = e.target.files[0]
  if (!selectedFile) return
  
  file.value = selectedFile
  console.log('File selected for page numbering:', selectedFile.name)
}

const generatePreviewNumber = (pageNum) => {
  let number = pageNum
  
  // Apply format
  switch(pageSettings.value.format) {
    case 'i':
      number = toRoman(pageNum).toLowerCase()
      break
    case 'I':
      number = toRoman(pageNum)
      break
    case 'a':
      number = toLetters(pageNum).toLowerCase()
      break
    case 'A':
      number = toLetters(pageNum)
      break
  }
  
  // Add custom text
  if (pageSettings.value.customText) {
    if (pageSettings.value.customTextPosition === 'before') {
      number = `${pageSettings.value.customText} ${number}`
    } else {
      number = `${number} ${pageSettings.value.customText}`
    }
  }
  
  // Add total if enabled
  if (pageSettings.value.includeTotal) {
    number = `${number} / 5` // Example total
  }
  
  return number
}

// Roman numeral conversion
const toRoman = (num) => {
  const roman = {
    M: 1000, CM: 900, D: 500, CD: 400,
    C: 100, XC: 90, L: 50, XL: 40,
    X: 10, IX: 9, V: 5, IV: 4, I: 1
  }
  let str = ''
  for (let i of Object.keys(roman)) {
    let q = Math.floor(num / roman[i])
    num -= q * roman[i]
    str += i.repeat(q)
  }
  return str
}

// Letter conversion (A, B, C... Z, AA, AB...)
const toLetters = (num) => {
  let result = ''
  while (num > 0) {
    num--
    result = String.fromCharCode(65 + (num % 26)) + result
    num = Math.floor(num / 26)
  }
  return result || 'A'
}

const applyPageNumbers = async () => {
  if (!file.value) {
    alert('Please select a PDF file')
    return
  }

  loading.value = true
  progress.value = 0
  statusText.value = 'Preparing document...'

  const formData = new FormData()
  formData.append('pdf', file.value)
  formData.append('settings', JSON.stringify(pageSettings.value))

  let fakeProgress = null

  try {
    fakeProgress = setInterval(() => {
      if (progress.value < 90) {
        progress.value += 5
        updateStatusText(progress.value)
      }
    }, 200)

    const res = await fetch('http://192.168.18.101:3000/api/add-page-numbers', {
      method: 'POST',
      body: formData
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`Server error: ${res.status} - ${errorText}`)
    }

    clearInterval(fakeProgress)
    progress.value = 100
    statusText.value = 'Downloading numbered PDF...'

    // Get filename from response
    const contentDisposition = res.headers.get('Content-Disposition')
    let fileName = `${file.value.name.replace('.pdf', '')}_numbered.pdf`
    
    if (contentDisposition) {
      const matches = contentDisposition.match(/filename="(.+)"/)
      if (matches && matches[1]) {
        fileName = matches[1]
      }
    }

    const blob = await res.blob()
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    statusText.value = 'Page numbers added successfully!'

  } catch (err) {
    statusText.value = 'Failed to add page numbers'
    alert('Error: ' + err.message)
    console.error('Page numbering error:', err)
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
  if (progressValue < 25) {
    statusText.value = 'Loading PDF document...'
  } else if (progressValue < 50) {
    statusText.value = 'Applying page numbers...'
  } else if (progressValue < 75) {
    statusText.value = 'Formatting document...'
  } else {
    statusText.value = 'Finalizing output...'
  }
}

const resetSettings = () => {
  pageSettings.value = {
    position: 'bottom-center',
    startFrom: 1,
    format: '1',
    fontSize: 12,
    fontColor: '#000000',
    margin: 20,
    includeTotal: false,
    excludeFirstPage: false,
    excludeLastPage: false,
    customText: '',
    customTextPosition: 'after'
  }
}

const clearFile = () => {
  file.value = null
  const input = document.querySelector('input[type="file"]')
  if (input) input.value = ''
}

// Apply preset styles
const applyPreset = (preset) => {
  switch(preset) {
    case 'formal':
      pageSettings.value = {
        ...pageSettings.value,
        position: 'bottom-center',
        format: '1',
        fontSize: 11,
        fontColor: '#333333',
        margin: 25,
        includeTotal: false,
        excludeFirstPage: true
      }
      break
    case 'academic':
      pageSettings.value = {
        ...pageSettings.value,
        position: 'bottom-right',
        format: '1',
        fontSize: 10,
        fontColor: '#000000',
        margin: 20,
        includeTotal: true,
        excludeFirstPage: true,
        customText: 'Page',
        customTextPosition: 'before'
      }
      break
    case 'roman':
      pageSettings.value = {
        ...pageSettings.value,
        position: 'bottom-center',
        format: 'i',
        fontSize: 12,
        fontColor: '#666666',
        margin: 30,
        includeTotal: false,
        excludeFirstPage: true,
        excludeLastPage: true
      }
      break
    case 'minimal':
      pageSettings.value = {
        ...pageSettings.value,
        position: 'bottom-right',
        format: '1',
        fontSize: 9,
        fontColor: '#999999',
        margin: 15,
        includeTotal: false,
        excludeFirstPage: false
      }
      break
  }
}
</script>

<template>
  <div class="converter">
    <h2>Add Page Numbers to PDF</h2>
    <p class="subtitle">Customize and insert page numbers into your PDF documents</p>

    <!-- File Upload -->
    <label class="upload-box">
      <input
        type="file"
        accept=".pdf"
        @change="selectFile"
        hidden
      />
      <div class="upload-content">
        <span class="icon">🔢</span>
        <p><strong>Click to upload</strong> a PDF file</p>
        <small>{{ file ? file.name : 'No file selected' }}</small>
      </div>
    </label>

    <!-- Main Interface -->
    <div v-if="file" class="page-number-interface">
      <!-- Preview Section -->
      <div class="preview-section">
        <h3>Live Preview</h3>
        <div class="preview-container">
          <div class="page-preview">
            <!-- Page representation -->
            <div class="page-outline">
              <!-- Position indicators -->
              <div class="position-indicator" :class="pageSettings.position"></div>
              
              <!-- Page number preview based on position -->
              <div 
                class="page-number-preview" 
                :class="[pageSettings.position, { 'with-total': pageSettings.includeTotal }]"
                :style="{
                  fontSize: pageSettings.fontSize + 'px',
                  color: pageSettings.fontColor
                }"
              >
                {{ generatePreviewNumber(3) }}
              </div>
              
              <!-- Position labels -->
              <div class="position-label top-left">Top Left</div>
              <div class="position-label top-center">Top Center</div>
              <div class="position-label top-right">Top Right</div>
              <div class="position-label bottom-left">Bottom Left</div>
              <div class="position-label bottom-center">Bottom Center</div>
              <div class="position-label bottom-right">Bottom Right</div>
            </div>
            
            <!-- Preview controls -->
            <div class="preview-controls">
              <button @click="generatePreviewNumber(1)" class="preview-btn">
                Page 1: {{ generatePreviewNumber(1) }}
              </button>
              <button @click="generatePreviewNumber(3)" class="preview-btn">
                Page 3: {{ generatePreviewNumber(3) }}
              </button>
              <button @click="generatePreviewNumber(5)" class="preview-btn">
                Page 5: {{ generatePreviewNumber(5) }}
              </button>
            </div>
          </div>
          
          <div class="preview-info">
            <div class="info-item">
              <span class="info-label">Current Format:</span>
              <span class="info-value">{{ generatePreviewNumber(1) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Font Size:</span>
              <span class="info-value">{{ pageSettings.fontSize }}px</span>
            </div>
            <div class="info-item">
              <span class="info-label">Margin:</span>
              <span class="info-value">{{ pageSettings.margin }} points</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Presets -->
      <div class="presets-section">
        <h3>Quick Presets</h3>
        <div class="preset-buttons">
          <button @click="applyPreset('formal')" class="preset-btn">
            📄 Formal Document
          </button>
          <button @click="applyPreset('academic')" class="preset-btn">
            🎓 Academic Paper
          </button>
          <button @click="applyPreset('roman')" class="preset-btn">
            ⚔️ Roman Numerals
          </button>
          <button @click="applyPreset('minimal')" class="preset-btn">
            ✨ Minimal Style
          </button>
          <button @click="resetSettings" class="preset-btn reset">
            🔄 Reset Settings
          </button>
        </div>
      </div>

      <!-- Settings Grid -->
      <div class="settings-grid">
        <!-- Position Settings -->
        <div class="settings-group">
          <h4>📐 Position & Alignment</h4>
          <div class="position-grid">
            <button
              v-for="pos in positionOptions"
              :key="pos.id"
              @click="pageSettings.position = pos.id"
              :class="['position-btn', { active: pageSettings.position === pos.id }]"
              :title="pos.name"
            >
              <span class="position-icon">{{ pos.icon }}</span>
              <span class="position-name">{{ pos.name }}</span>
            </button>
          </div>
          
          <div class="margin-control">
            <label>Margin from edge: {{ pageSettings.margin }} points</label>
            <input
              type="range"
              v-model="pageSettings.margin"
              min="5"
              max="100"
              step="5"
              class="margin-slider"
            />
          </div>
        </div>

        <!-- Format & Style -->
        <div class="settings-group">
          <h4>🔢 Number Format</h4>
          <div class="format-grid">
            <button
              v-for="fmt in formatOptions"
              :key="fmt.id"
              @click="pageSettings.format = fmt.id"
              :class="['format-btn', { active: pageSettings.format === fmt.id }]"
            >
              {{ fmt.name }}
            </button>
          </div>
          
          <div class="numbering-controls">
            <div class="control-row">
              <label>Start From:</label>
              <input
                type="number"
                v-model.number="pageSettings.startFrom"
                min="1"
                max="1000"
                class="number-input"
              />
            </div>
            
            <div class="control-row">
              <label>
                <input
                  type="checkbox"
                  v-model="pageSettings.includeTotal"
                  class="checkbox"
                />
                Include total pages (Page X of Y)
              </label>
            </div>
            
            <div class="control-row">
              <label>
                <input
                  type="checkbox"
                  v-model="pageSettings.excludeFirstPage"
                  class="checkbox"
                />
                Exclude page number from first page
              </label>
            </div>
            
            <div class="control-row">
              <label>
                <input
                  type="checkbox"
                  v-model="pageSettings.excludeLastPage"
                  class="checkbox"
                />
                Exclude page number from last page
              </label>
            </div>
          </div>
        </div>

        <!-- Appearance -->
        <div class="settings-group">
          <h4>🎨 Appearance</h4>
          <div class="appearance-controls">
            <div class="control-row">
              <label>Font Size:</label>
              <select v-model="pageSettings.fontSize" class="font-select">
                <option v-for="size in fontSizeOptions" :key="size" :value="size">
                  {{ size }}px
                </option>
              </select>
            </div>
            
            <div class="control-row">
              <label>Font Color:</label>
              <div class="color-selector">
                <input
                  type="color"
                  v-model="pageSettings.fontColor"
                  class="color-input"
                />
                <div class="color-value">{{ pageSettings.fontColor }}</div>
              </div>
            </div>
            
            <div class="color-presets">
              <div
                v-for="color in colorPresets"
                :key="color"
                :style="{ backgroundColor: color }"
                @click="pageSettings.fontColor = color"
                class="color-preset"
                :class="{ active: pageSettings.fontColor === color }"
                :title="color"
              ></div>
            </div>
          </div>
          
          <div class="custom-text-control">
            <label>Custom Text (optional):</label>
            <div class="custom-text-inputs">
              <select v-model="pageSettings.customTextPosition" class="text-position-select">
                <option value="before">Before number</option>
                <option value="after">After number</option>
              </select>
              <input
                type="text"
                v-model="pageSettings.customText"
                placeholder="e.g., 'Page' or '- '"
                class="text-input"
              />
            </div>
            <p class="hint">Example: "{{ pageSettings.customTextPosition === 'before' ? pageSettings.customText + ' 1' : '1 ' + pageSettings.customText }}"</p>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <button @click="clearFile" class="secondary-btn">
          Change File
        </button>
        <button 
          class="primary-btn" 
          @click="applyPageNumbers" 
          :disabled="loading"
        >
          <span v-if="loading">🔄 Adding Page Numbers...</span>
          <span v-else>🚀 Add Page Numbers to PDF</span>
        </button>
      </div>
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
  border-color: #4A6FA5;
  background: #f0f4fa;
}

.upload-content .icon {
  font-size: 36px;
  display: block;
  margin-bottom: 10px;
}

/* Page Number Interface */
.page-number-interface {
  text-align: left;
}

/* Preview Section */
.preview-section {
  background: #f8f9fa;
  padding: 25px;
  border-radius: 12px;
  margin-bottom: 25px;
  border: 1px solid #e9ecef;
}

.preview-section h3 {
  font-size: 18px;
  color: #333;
  margin-bottom: 20px;
  text-align: center;
}

.preview-container {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.page-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.page-outline {
  position: relative;
  width: 300px;
  height: 200px;
  background: white;
  border: 2px solid #333;
  border-radius: 4px;
  margin: 0 auto;
}

.position-indicator {
  position: absolute;
  width: 15px;
  height: 15px;
  background: #4A6FA5;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.position-indicator.bottom-center {
  bottom: 0;
  left: 50%;
}

.position-indicator.bottom-right {
  bottom: 0;
  right: 0;
  transform: translate(50%, 50%);
}

.position-indicator.top-center {
  top: 0;
  left: 50%;
}

.position-indicator.top-right {
  top: 0;
  right: 0;
  transform: translate(50%, -50%);
}

.position-indicator.bottom-left {
  bottom: 0;
  left: 0;
  transform: translate(-50%, 50%);
}

.position-indicator.top-left {
  top: 0;
  left: 0;
  transform: translate(-50%, -50%);
}

.page-number-preview {
  position: absolute;
  padding: 5px 10px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px dashed #4A6FA5;
  border-radius: 4px;
  font-weight: 600;
  white-space: nowrap;
}

.page-number-preview.bottom-center {
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
}

.page-number-preview.bottom-right {
  bottom: 10px;
  right: 10px;
}

.page-number-preview.top-center {
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
}

.page-number-preview.top-right {
  top: 10px;
  right: 10px;
}

.page-number-preview.bottom-left {
  bottom: 10px;
  left: 10px;
}

.page-number-preview.top-left {
  top: 10px;
  left: 10px;
}

.position-label {
  position: absolute;
  font-size: 10px;
  color: #999;
  background: rgba(255, 255, 255, 0.7);
  padding: 2px 4px;
  border-radius: 2px;
}

.position-label.top-left { top: 5px; left: 5px; }
.position-label.top-center { top: 5px; left: 50%; transform: translateX(-50%); }
.position-label.top-right { top: 5px; right: 5px; }
.position-label.bottom-left { bottom: 5px; left: 5px; }
.position-label.bottom-center { bottom: 5px; left: 50%; transform: translateX(-50%); }
.position-label.bottom-right { bottom: 5px; right: 5px; }

.preview-controls {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
}

.preview-btn {
  padding: 8px 16px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.preview-btn:hover {
  background: #f0f0f0;
  border-color: #4A6FA5;
}

.preview-info {
  display: flex;
  justify-content: center;
  gap: 30px;
  flex-wrap: wrap;
  margin-top: 15px;
}

.info-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: #666;
}

.info-value {
  font-size: 14px;
  font-weight: 600;
  color: #4A6FA5;
}

/* Presets Section */
.presets-section {
  margin-bottom: 25px;
}

.presets-section h3 {
  font-size: 16px;
  color: #333;
  margin-bottom: 15px;
  text-align: center;
}

.preset-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
}

.preset-btn {
  padding: 10px 20px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.preset-btn:hover {
  background: #f0f4fa;
  border-color: #4A6FA5;
  transform: translateY(-1px);
}

.preset-btn.reset {
  color: #666;
}

/* Settings Grid */
.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 25px;
  margin-bottom: 30px;
}

.settings-group {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.settings-group h4 {
  font-size: 16px;
  color: #333;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Position Grid */
.position-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}

.position-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 12px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.position-btn:hover {
  background: #f8f9fa;
  border-color: #4A6FA5;
}

.position-btn.active {
  background: #4A6FA5;
  border-color: #4A6FA5;
  color: white;
}

.position-icon {
  font-size: 20px;
}

.position-name {
  font-size: 11px;
  white-space: nowrap;
}

.margin-control {
  margin-top: 20px;
}

.margin-control label {
  display: block;
  margin-bottom: 10px;
  font-size: 14px;
  color: #333;
}

.margin-slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #ddd;
  outline: none;
  -webkit-appearance: none;
}

.margin-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #4A6FA5;
  cursor: pointer;
}

/* Format Grid */
.format-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}

.format-btn {
  padding: 12px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
  text-align: center;
}

.format-btn:hover {
  background: #f8f9fa;
  border-color: #4A6FA5;
}

.format-btn.active {
  background: #4A6FA5;
  border-color: #4A6FA5;
  color: white;
}

.numbering-controls {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 20px;
}

.control-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.control-row label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #333;
  cursor: pointer;
}

.number-input {
  width: 80px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

/* Appearance Controls */
.appearance-controls {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 20px;
}

.font-select {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  width: 100px;
}

.color-selector {
  display: flex;
  align-items: center;
  gap: 10px;
}

.color-input {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  padding: 0;
}

.color-value {
  font-size: 13px;
  color: #666;
  font-family: monospace;
}

.color-presets {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.color-preset {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.color-preset:hover {
  transform: scale(1.1);
}

.color-preset.active {
  border-color: #333;
  box-shadow: 0 0 0 2px white, 0 0 0 4px #4A6FA5;
}

.custom-text-control {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e9ecef;
}

.custom-text-control label {
  display: block;
  margin-bottom: 10px;
  font-size: 14px;
  color: #333;
}

.custom-text-inputs {
  display: flex;
  gap: 10px;
  margin-bottom: 8px;
}

.text-position-select {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  min-width: 120px;
}

.text-input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.hint {
  font-size: 12px;
  color: #666;
  font-style: italic;
  margin-top: 5px;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin: 30px 0;
}

.primary-btn {
  flex: 1;
  max-width: 400px;
  padding: 16px 30px;
  font-size: 16px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  background: linear-gradient(135deg, #4A6FA5, #3a5a8c);
  color: white;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(74, 111, 165, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.primary-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(74, 111, 165, 0.3);
  background: linear-gradient(135deg, #3a5a8c, #2a4a7c);
}

.primary-btn:disabled {
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
  color: #4A6FA5;
  font-weight: 500;
  text-align: center;
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
  background: linear-gradient(90deg, #4A6FA5, #6a8fc5);
  transition: width 0.3s ease;
}

/* Tips Section */
.tips-section {
  background: #f0f4fa;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #d1dce9;
  margin-top: 25px;
  text-align: left;
}

.tips-section h4 {
  font-size: 16px;
  color: #333;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tips-section ul {
  margin: 0;
  padding-left: 20px;
  color: #666;
}

.tips-section li {
  margin-bottom: 8px;
  line-height: 1.5;
  font-size: 13px;
}
</style>