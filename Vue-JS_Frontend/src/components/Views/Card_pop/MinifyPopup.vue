<!-- MinifyPopup.vue -->
<template>
  <div class="popup-overlay" @click.self="$emit('close')">
    <div class="minify-popup">
      <div class="popup-header">
        <div class="header-left">
          <div>
            <h2>CSS/JS Minifier & Beautifier</h2>
          </div>
        </div>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="popup-content">
        <!-- Language Selection -->
        <div class="language-selection">
          <div class="language-buttons">
            <button 
              class="lang-btn" 
              :class="{ active: selectedLanguage === 'css' }"
              @click="selectedLanguage = 'css'"
            >
              <span>CSS</span>
            </button>
            <button 
              class="lang-btn" 
              :class="{ active: selectedLanguage === 'js' }"
              @click="selectedLanguage = 'js'"
            >
              <span>JavaScript</span>
            </button>
          </div>
        </div>

        <!-- Input Area -->
        <div class="input-section">
          <div class="code-editor-container">
            <div class="editor-actions">
              <button class="action-btn" @click="clearCode" title="Clear">
                🗑️ Clear
              </button>
              <label class="upload-btn">
                <input type="file" @change="handleFileUpload" accept=".css,.js,.txt" hidden>
                 Upload
              </label>
            </div>
            
            <textarea 
              ref="codeInput"
              v-model="code"
              class="code-input"
              :placeholder="selectedLanguage === 'css' ? 'Paste your CSS code here...' : 'Paste your JavaScript code here...'"
              spellcheck="false"
            ></textarea>
          </div>
        </div>

        <!-- Action Selection -->
        <div class="action-selection">
          <div class="action-buttons">
            <button 
              class="action-btn minify" 
              :class="{ active: selectedAction === 'minify' }"
              @click="selectedAction = 'minify'"
            >
               Minify
            </button>
            <button 
              class="action-btn beautify" 
              :class="{ active: selectedAction === 'unminify' }"
              @click="selectedAction = 'unminify'"
            >
              Beautify
            </button>
          </div>
        </div>
        <!-- Process Button -->
        <div class="process-section">
          <button 
            class="process-btn" 
            @click="processCode"
            :disabled="processing || !code.trim()"
            :class="{ loading: processing }"
          >
            <span v-if="!processing">
              {{ selectedAction === 'minify' ? ' Minify Code' : ' Beautify Code' }}
            </span>
            <span v-else class="spinner"></span>
          </button>
        </div>

        <!-- Output Area -->
        <div v-if="output" class="output-section">
          <div class="section-header">
            <h4>Processed Code</h4>
            <div class="output-info">
              <span class="size-info">
                {{ output.length }} chars 
                <span v-if="compressionRatio > 0" class="reduction">
                  ({{ compressionRatio }}% smaller)
                </span>
              </span>
            </div>
          </div>
          
          <div class="code-output-container">
            <div class="output-header">
              <div class="output-type">
                <span class="type-badge">{{ selectedAction === 'minify' ? 'Minified' : 'Beautified' }}</span>
                <span class="lang-badge">{{ selectedLanguage.toUpperCase() }}</span>
              </div>
              <div class="output-actions">
                <button class="copy-btn" @click="copyToClipboard" :class="{ copied: copied }">
                  {{ copied ? 'Copied!' : '📋' }}
                </button>
                <button class="download-btn" @click="downloadCode">
                  ⬇️
                </button>
              </div>
            </div>
            
            <div class="code-output" ref="codeOutput">
              <pre>{{ output }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'

const emit = defineEmits(['close'])

// State
const code = ref('')
const output = ref('')
const selectedLanguage = ref('css')
const selectedAction = ref('minify')
const processing = ref(false)
const copied = ref(false)

// Options
const minifyOptions = ref({
  removeComments: true,
  removeWhitespace: true
})

// Computed properties
const compressionRatio = computed(() => {
  if (!output.value || !code.value) return 0
  const originalSize = code.value.length
  const processedSize = output.value.length
  const ratio = ((originalSize - processedSize) / originalSize) * 100
  return Math.round(ratio * 100) / 100
})

// Methods
const clearCode = () => {
  code.value = ''
  output.value = ''
}

const loadSample = () => {
  if (selectedLanguage.value === 'css') {
    code.value = `/* Sample CSS Code */
body {
    font-family: 'Arial', sans-serif;
    margin: 0;
    padding: 20px;
    background-color: #f0f0f0;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

.button {
    background-color: #007bff;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s ease;
}

.button:hover {
    background-color: #0056b3;
}`
  } else {
    code.value = `// Sample JavaScript Code
function calculateTotal(items) {
    let total = 0;
    
    // Calculate sum of all items
    for (let i = 0; i < items.length; i++) {
        total += items[i].price * items[i].quantity;
    }
    
    // Apply discount if applicable
    if (total > 100) {
        total = total * 0.9; // 10% discount
    }
    
    return total;
}

// Event handler
document.getElementById('btn').addEventListener('click', function() {
    const items = [
        { name: 'Item 1', price: 10, quantity: 2 },
        { name: 'Item 2', price: 25, quantity: 1 }
    ];
    
    const total = calculateTotal(items);
    console.log('Total: $' + total.toFixed(2));
});`
  }
}

const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (e) => {
    code.value = e.target.result
    
    // Detect language from filename
    const ext = file.name.toLowerCase().split('.').pop()
    if (ext === 'css') selectedLanguage.value = 'css'
    if (ext === 'js') selectedLanguage.value = 'js'
  }
  reader.readAsText(file)
}

const processCode = async () => {
  if (!code.value.trim() || processing.value) return
  
  processing.value = true
  output.value = ''
  
  try {
    // Prepare request
    const requestData = {
      code: code.value,
      language: selectedLanguage.value,
      action: selectedAction.value,
      options: selectedAction.value === 'minify' ? minifyOptions.value : {}
    }
    
    // Make API call
    const response = await fetch('http://localhost:3000/api/process-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    })
    
    if (!response.ok) {
      throw new Error('Processing failed')
    }
    
    const result = await response.json()
    
    if (result.success) {
      output.value = result.processedCode
      
      // Scroll to output
      await nextTick()
      if (codeOutput.value) {
        codeOutput.value.scrollIntoView({ behavior: 'smooth' })
      }
    } else {
      output.value = `Error: ${result.error}`
    }
    
  } catch (error) {
    console.error('Error:', error)
    output.value = `Error: ${error.message}`
  } finally {
    processing.value = false
  }
}

const copyToClipboard = async () => {
  if (!output.value) return
  
  try {
    await navigator.clipboard.writeText(output.value)
    copied.value = true
    
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
    // Fallback
    const textArea = document.createElement('textarea')
    textArea.value = output.value
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    copied.value = true
    
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
}

const downloadCode = () => {
  if (!output.value) return
  
  const extension = selectedLanguage.value === 'css' ? 'css' : 'js'
  const actionType = selectedAction.value === 'minify' ? 'minified' : 'beautified'
  const filename = `${actionType}_code.${extension}`
  
  const blob = new Blob([output.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Refs
const codeInput = ref(null)
const codeOutput = ref(null)

// Initialize with sample code
loadSample()
</script>

<style scoped>
.popup-overlay {
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
  backdrop-filter: blur(3px);
}

.minify-popup {
  background: white;
  border-radius: 16px;
  max-width: 800px;
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: popupIn 0.3s ease;
}

@keyframes popupIn {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.popup-header {
  background: black;
  color: white;
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.header-icon {
  font-size: 32px;
}

.popup-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.subtitle {
  margin: 5px 0 0;
  font-size: 14px;
  opacity: 0.9;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.popup-content {
  padding: 10px;
  overflow-y: auto;
}

.language-selection h4 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: #2c3e50;
}

.language-buttons {
  display: flex;
  gap: 15px;
}

.lang-btn {
  background: #f8f9fa;
  border: 2px solid #dee2e6;
  padding: 10px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.3s ease;
}

.lang-btn.active {
  background: #e7f3ff;
  border-color: #264de4;
  color: #264de4;
}

.lang-icon {
  font-size: 20px;
}

/* Input Section */
.input-section {
  margin-bottom: 10px;
  margin-top: 10px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.section-header h4 {
  margin: 0;
  font-size: 16px;
  color: #2c3e50;
}

.input-info {
  font-size: 14px;
  color: #6c757d;
}

.code-editor-container {
  border: 2px solid #e9ecef;
  border-radius: 12px;
  overflow: hidden;
}

.editor-actions {
  background: #f8f9fa;
  padding: 10px;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  gap: 10px;
}

.action-btn, .upload-btn {
  background: white;
  border: 1px solid #dee2e6;
  padding: 8px 15px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.action-btn:hover, .upload-btn:hover {
  background: #e9ecef;
}

.upload-btn {
  display: inline-block;
  cursor: pointer;
}

.code-input {
  width: 100%;
  min-height: 120px;
  padding: 5px;
  border: none;
  resize: vertical;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.5;
  color: #333;
  background: #fafafa;
  outline: none;
}

/* Action Selection */
.action-selection {
  margin-bottom: 25px;
}

.action-selection h4 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: #2c3e50;
}

.action-buttons {
  display: flex;
  gap: 15px;
}

.action-btn {
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.action-btn.minify {
  background: #e9ecef;
  color: #2c3e50;
}

.action-btn.beautify {
  background: #e9ecef;
  color: #2c3e50;
}

.action-btn.minify.active {
  background: linear-gradient(135deg, #264de4 0%, #4a6bdb 100%);
  color: white;
}

.action-btn.beautify.active {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
}

/* Options Section */
.options-section {
  margin-bottom: 25px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
}

.options-section h4 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: #2c3e50;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.option-checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 14px;
}

.option-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
}

.process-btn {
  width: 100%;
  padding: 10px;
  background: linear-gradient(135deg, #264de4 0%, #6f42c1 100%);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 18px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.process-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(38, 77, 228, 0.3);
}

.process-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.process-btn.loading {
  opacity: 0.8;
}

.spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Output Section */
.output-section {
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.output-info {
  font-size: 14px;
  color: #6c757d;
}

.size-info .reduction {
  color: #28a745;
  font-weight: 600;
}

.code-output-container {
  border: 2px solid #e9ecef;
  border-radius: 12px;
  overflow: hidden;
  margin-top: 15px;
}

.output-header {
  background: #f8f9fa;
  padding: 15px;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.output-type {
  display: flex;
  gap: 10px;
}

.type-badge, .lang-badge {
  padding: 4px 12px;
  border-radius: 15px;
  font-size: 12px;
  font-weight: 600;
}

.type-badge {
  background: #e7f3ff;
  color: #264de4;
  border: 1px solid #264de4;
}

.lang-badge {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #856404;
}

.output-actions {
  display: flex;
  gap: 10px;
}

.copy-btn, .download-btn {
  padding: 8px 15px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.copy-btn {
  background: #6f42c1;
  color: white;
}

.copy-btn.copied {
  background: #28a745;
}

.download-btn {
  background: #17a2b8;
  color: white;
}

.copy-btn:hover, .download-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.code-output {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 20px;
  max-height: 300px;
  overflow-y: auto;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.5;
}

.code-output pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* Responsive */
@media (max-width: 768px) {
  .language-buttons,
  .action-buttons {
    flex-direction: column;
  }
  
  .editor-actions {
    flex-wrap: wrap;
  }
  
  .output-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .output-type {
    justify-content: center;
  }
  
  .output-actions {
    justify-content: center;
  }
}
</style>