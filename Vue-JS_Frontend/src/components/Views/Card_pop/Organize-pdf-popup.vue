<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const file = ref(null)
const loading = ref(false)
const progress = ref(0)
const statusText = ref('')

// Page management
const pages = ref([])
const selectedPages = ref(new Set())
const isDragging = ref(false)
const dragStartIndex = ref(null)
const dragOverIndex = ref(null)

// View settings
const viewMode = ref('grid') // 'grid' or 'list'
const pageSize = ref('medium') // 'small', 'medium', 'large'
const showThumbnails = ref(true)

// Actions
const actions = ref([
  { id: 'rotate-right', name: 'Rotate Right', icon: '↻', color: '#4a6fa5' },
  { id: 'rotate-left', name: 'Rotate Left', icon: '↺', color: '#4a6fa5' },
  { id: 'delete', name: 'Delete', icon: '🗑️', color: '#e74c3c' },
  { id: 'duplicate', name: 'Duplicate', icon: '📄', color: '#2ecc71' },
  { id: 'extract', name: 'Extract', icon: '📤', color: '#f39c12' }
])

const selectFile = async (e) => {
  const selectedFile = e.target.files[0]
  if (!selectedFile) return
  
  file.value = selectedFile
  console.log('File selected for organization:', selectedFile.name)
  
  // Generate dummy page data (in real app, you'd extract from PDF)
  generateSamplePages()
}

const generateSamplePages = () => {
  pages.value = []
  const totalPages = 8 // Sample number of pages
  
  for (let i = 1; i <= totalPages; i++) {
    pages.value.push({
      id: i,
      number: i,
      label: `Page ${i}`,
      rotation: 0, // 0, 90, 180, 270 degrees
      selected: false,
      thumbnail: `https://via.placeholder.com/150x200/4a6fa5/ffffff?text=Page+${i}`,
      content: `Content of page ${i}`,
      size: 'A4',
      dimensions: '595 × 842 points'
    })
  }
}

// Page selection
const togglePageSelection = (pageId, event) => {
  if (event && (event.ctrlKey || event.metaKey)) {
    // Multi-select with Ctrl/Cmd
    if (selectedPages.value.has(pageId)) {
      selectedPages.value.delete(pageId)
    } else {
      selectedPages.value.add(pageId)
    }
  } else if (event && event.shiftKey) {
    // Range selection with Shift
    const pageIds = pages.value.map(p => p.id)
    const startIndex = pageIds.indexOf(Array.from(selectedPages.value)[0] || pageId)
    const endIndex = pageIds.indexOf(pageId)
    
    selectedPages.value.clear()
    const [min, max] = [Math.min(startIndex, endIndex), Math.max(startIndex, endIndex)]
    for (let i = min; i <= max; i++) {
      selectedPages.value.add(pageIds[i])
    }
  } else {
    // Single selection
    selectedPages.value.clear()
    selectedPages.value.add(pageId)
  }
  
  updatePageSelection()
}

const selectAllPages = () => {
  selectedPages.value.clear()
  pages.value.forEach(page => {
    selectedPages.value.add(page.id)
  })
  updatePageSelection()
}

const clearSelection = () => {
  selectedPages.value.clear()
  updatePageSelection()
}

const updatePageSelection = () => {
  pages.value.forEach(page => {
    page.selected = selectedPages.value.has(page.id)
  })
}

// Page actions
const performAction = (actionId) => {
  if (selectedPages.value.size === 0) {
    alert('Please select at least one page')
    return
  }
  
  const selectedIds = Array.from(selectedPages.value)
  
  switch(actionId) {
    case 'rotate-right':
      rotatePages(selectedIds, 90)
      break
    case 'rotate-left':
      rotatePages(selectedIds, -90)
      break
    case 'delete':
      deletePages(selectedIds)
      break
    case 'duplicate':
      duplicatePages(selectedIds)
      break
    case 'extract':
      extractPages(selectedIds)
      break
  }
}

const rotatePages = (pageIds, angle) => {
  pages.value.forEach(page => {
    if (pageIds.includes(page.id)) {
      page.rotation = (page.rotation + angle) % 360
      if (page.rotation < 0) page.rotation += 360
      page.label = `Page ${page.number} (${page.rotation}°)`
    }
  })
}

const deletePages = (pageIds) => {
  if (!confirm(`Delete ${pageIds.length} selected page(s)?`)) return
  
  // Filter out deleted pages
  pages.value = pages.value.filter(page => !pageIds.includes(page.id))
  
  // Re-number remaining pages
  pages.value.forEach((page, index) => {
    page.number = index + 1
    page.label = `Page ${page.number}`
  })
  
  selectedPages.value.clear()
}

const duplicatePages = (pageIds) => {
  const pagesToDuplicate = pages.value.filter(page => pageIds.includes(page.id))
  const newPages = pagesToDuplicate.map(page => ({
    ...page,
    id: Date.now() + Math.random(), // New unique ID
    number: pages.value.length + 1,
    label: `Page ${pages.value.length + 1} (copy)`,
    selected: false
  }))
  
  pages.value.push(...newPages)
  selectedPages.value.clear()
}

const extractPages = (pageIds) => {
  const extractedPages = pages.value.filter(page => pageIds.includes(page.id))
  alert(`${extractedPages.length} page(s) extracted. In a real app, this would create a new PDF.`)
}

// Drag and drop for reordering
const startDrag = (index, event) => {
  isDragging.value = true
  dragStartIndex.value = index
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', index)
}

const onDragOver = (index, event) => {
  event.preventDefault()
  if (isDragging.value && index !== dragOverIndex.value) {
    dragOverIndex.value = index
  }
}

const onDrop = (index, event) => {
  event.preventDefault()
  if (dragStartIndex.value !== null && dragStartIndex.value !== index) {
    // Reorder pages
    const movedPage = pages.value[dragStartIndex.value]
    pages.value.splice(dragStartIndex.value, 1)
    pages.value.splice(index, 0, movedPage)
    
    // Update page numbers
    pages.value.forEach((page, idx) => {
      page.number = idx + 1
      page.label = page.rotation === 0 ? `Page ${page.number}` : `Page ${page.number} (${page.rotation}°)`
    })
  }
  
  dragStartIndex.value = null
  dragOverIndex.value = null
  isDragging.value = false
}

const movePage = (fromIndex, toIndex) => {
  if (fromIndex === toIndex) return
  
  const movedPage = pages.value[fromIndex]
  pages.value.splice(fromIndex, 1)
  pages.value.splice(toIndex, 0, movedPage)
  
  // Update page numbers
  pages.value.forEach((page, idx) => {
    page.number = idx + 1
    page.label = page.rotation === 0 ? `Page ${page.number}` : `Page ${page.number} (${page.rotation}°)`
  })
}

const movePageUp = (index) => {
  if (index > 0) {
    movePage(index, index - 1)
  }
}

const movePageDown = (index) => {
  if (index < pages.value.length - 1) {
    movePage(index, index + 1)
  }
}

const moveToTop = (index) => {
  if (index > 0) {
    movePage(index, 0)
  }
}

const moveToBottom = (index) => {
  if (index < pages.value.length - 1) {
    movePage(index, pages.value.length - 1)
  }
}

// View settings
const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'grid' ? 'list' : 'grid'
}

const changePageSize = (size) => {
  pageSize.value = size
}

const toggleThumbnails = () => {
  showThumbnails.value = !showThumbnails.value
}

// Organize PDF (send to backend)
const organizePdf = async () => {
  if (!file.value) {
    alert('Please select a PDF file')
    return
  }

  if (pages.value.length === 0) {
    alert('No pages to organize')
    return
  }

  loading.value = true
  progress.value = 0
  statusText.value = 'Preparing organization data...'

  // Prepare organization data
  const organizationData = {
    pages: pages.value.map(page => ({
      originalNumber: page.id,
      newNumber: page.number,
      rotation: page.rotation,
      action: 'keep' // In real app, could be 'keep', 'delete', 'rotate', etc.
    })),
    order: pages.value.map(page => page.number)
  }

  const formData = new FormData()
  formData.append('pdf', file.value)
  formData.append('organization', JSON.stringify(organizationData))

  let fakeProgress = null

  try {
    fakeProgress = setInterval(() => {
      if (progress.value < 90) progress.value += 5
    }, 150)

    // Call organize API
    const res = await fetch('http://192.168.18.101:3000/api/organize-pdf', {
      method: 'POST',
      body: formData
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`Server error: ${res.status} - ${errorText}`)
    }

    clearInterval(fakeProgress)
    progress.value = 100
    statusText.value = 'Downloading organized PDF...'

    // Get filename
    const contentDisposition = res.headers.get('content-disposition')
    let fileName = `organized_${file.value.name}`
    
    if (contentDisposition) {
      const matches = contentDisposition.match(/filename="(.+)"/)
      if (matches && matches[1]) {
        fileName = matches[1]
      }
    }

    // Download the organized PDF
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    statusText.value = 'Organization completed!'

  } catch (err) {
    statusText.value = 'Organization failed'
    alert('Organization failed: ' + err.message)
    console.error('Organization error:', err)
  } finally {
    if (fakeProgress) clearInterval(fakeProgress)
    loading.value = false
    setTimeout(() => {
      progress.value = 0
      statusText.value = ''
    }, 2000)
  }
}

const resetOrganization = () => {
  if (confirm('Reset all changes and start over?')) {
    file.value = null
    pages.value = []
    selectedPages.value.clear()
    const input = document.querySelector('input[type="file"]')
    if (input) input.value = ''
  }
}

// Keyboard shortcuts
onMounted(() => {
  const handleKeyDown = (e) => {
    // Ctrl+A to select all
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
      e.preventDefault()
      selectAllPages()
    }
    // Delete key to delete selected pages
    if (e.key === 'Delete' && selectedPages.value.size > 0) {
      deletePages(Array.from(selectedPages.value))
    }
    // Escape to clear selection
    if (e.key === 'Escape') {
      clearSelection()
    }
  }

  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div class="converter">
    <h2>Organize PDF</h2>
    <p class="subtitle">Drag and drop to reorder pages, rotate, delete, or organize your PDF</p>

    <!-- File Upload -->
    <label class="upload-box" v-if="!file">
      <input
        type="file"
        accept="application/pdf"
        @change="selectFile"
        hidden
      />
      <div class="upload-content">
        <span class="icon">📑</span>
        <p><strong>Click to upload</strong> a PDF file</p>
        <small>{{ file ? file.name : 'No file selected' }}</small>
      </div>
    </label>

    <!-- Organization Interface -->
    <div v-if="file" class="organization-interface">
      <!-- Header with file info and controls -->
      <div class="org-header">
        <div class="file-info">
          <h3>{{ file.name }}</h3>
          <p>{{ pages.length }} page(s) • Drag to reorder</p>
        </div>
        <div class="header-controls">
          <div class="selection-info">
            <span v-if="selectedPages.size > 0">
              {{ selectedPages.size }} page(s) selected
            </span>
            <span v-else>No pages selected</span>
          </div>
          <div class="view-controls">
            <button 
              @click="toggleViewMode" 
              class="view-btn"
              :title="viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'"
            >
              {{ viewMode === 'grid' ? '📋 List' : '🖼️ Grid' }}
            </button>
            <button 
              @click="toggleThumbnails" 
              class="view-btn"
              :title="showThumbnails ? 'Hide thumbnails' : 'Show thumbnails'"
            >
              {{ showThumbnails ? '👁️ Hide' : '👁️ Show' }}
            </button>
            <div class="size-controls">
              <button 
                v-for="size in ['small', 'medium', 'large']" 
                :key="size"
                @click="changePageSize(size)"
                :class="['size-btn', { active: pageSize === size }]"
                :title="size.charAt(0).toUpperCase() + size.slice(1) + ' thumbnails'"
              >
                {{ size.charAt(0).toUpperCase() }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Toolbar -->
      <div class="action-toolbar">
        <div class="selection-actions">
          <button @click="selectAllPages" class="toolbar-btn">
            ☑ Select All
          </button>
          <button @click="clearSelection" class="toolbar-btn" :disabled="selectedPages.size === 0">
            ☐ Clear Selection
          </button>
        </div>
        <div class="page-actions">
          <button 
            v-for="action in actions" 
            :key="action.id"
            @click="performAction(action.id)"
            class="action-btn"
            :style="{ '--btn-color': action.color }"
            :title="action.name"
            :disabled="selectedPages.size === 0"
          >
            <span class="action-icon">{{ action.icon }}</span>
            <span class="action-text">{{ action.name }}</span>
          </button>
        </div>
      </div>

      <!-- Pages Display -->
      <div class="pages-container" :class="[viewMode, pageSize]">
        <div 
          v-for="(page, index) in pages" 
          :key="page.id"
          class="page-item"
          :class="{ 
            selected: page.selected,
            dragging: dragOverIndex === index,
            'has-rotation': page.rotation !== 0
          }"
          @click="togglePageSelection(page.id, $event)"
          @contextmenu.prevent="togglePageSelection(page.id, $event)"
          draggable="true"
          @dragstart="startDrag(index, $event)"
          @dragover.prevent="onDragOver(index, $event)"
          @drop="onDrop(index, $event)"
          @dragleave="dragOverIndex = null"
          @dragend="isDragging = false"
        >
          <!-- Page number and drag handle -->
          <div class="page-header">
            <div class="page-number">
              <span class="current-number">{{ page.number }}</span>
              <span v-if="page.rotation !== 0" class="rotation-indicator">
                {{ page.rotation }}°
              </span>
            </div>
            <div class="page-controls">
              <button @click.stop="movePageUp(index)" class="move-btn" title="Move up">⬆️</button>
              <button @click.stop="movePageDown(index)" class="move-btn" title="Move down">⬇️</button>
              <button @click.stop="moveToTop(index)" class="move-btn" title="Move to top">⏫</button>
              <button @click.stop="moveToBottom(index)" class="move-btn" title="Move to bottom">⏬</button>
            </div>
          </div>

          <!-- Page thumbnail -->
          <div v-if="showThumbnails" class="page-thumbnail">
            <div 
              class="thumbnail-placeholder"
              :style="{ 
                backgroundImage: `url(${page.thumbnail})`,
                transform: `rotate(${page.rotation}deg)`
              }"
            >
              <div class="page-label">{{ page.label }}</div>
            </div>
          </div>

          <!-- Page info (for list view) -->
          <div v-if="viewMode === 'list'" class="page-info">
            <h4>{{ page.label }}</h4>
            <p>{{ page.content }}</p>
            <div class="page-meta">
              <span>{{ page.size }}</span>
              <span>{{ page.dimensions }}</span>
            </div>
          </div>

          <!-- Selection checkbox -->
          <div class="selection-checkbox">
            <input 
              type="checkbox" 
              :checked="page.selected"
              @click.stop="togglePageSelection(page.id, $event)"
            />
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="pages.length === 0" class="empty-state">
        <div class="empty-icon">📄</div>
        <p>No pages to display</p>
        <p class="empty-hint">Upload a PDF to start organizing pages</p>
      </div>

      <!-- Page Stats -->
      <div class="page-stats">
        <div class="stat">
          <span class="stat-label">Total Pages:</span>
          <span class="stat-value">{{ pages.length }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Selected:</span>
          <span class="stat-value">{{ selectedPages.size }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Rotated:</span>
          <span class="stat-value">{{ pages.filter(p => p.rotation !== 0).length }}</span>
        </div>
      </div>

      <!-- Keyboard Shortcuts Help -->
      <div class="shortcuts-help">
        <details>
          <summary>📋 Keyboard Shortcuts</summary>
          <div class="shortcuts-list">
            <div class="shortcut">
              <kbd>Ctrl/Cmd</kbd> + <kbd>A</kbd>
              <span>Select all pages</span>
            </div>
            <div class="shortcut">
              <kbd>Shift</kbd> + <kbd>Click</kbd>
              <span>Select range of pages</span>
            </div>
            <div class="shortcut">
              <kbd>Ctrl/Cmd</kbd> + <kbd>Click</kbd>
              <span>Multi-select pages</span>
            </div>
            <div class="shortcut">
              <kbd>Delete</kbd>
              <span>Delete selected pages</span>
            </div>
            <div class="shortcut">
              <kbd>Escape</kbd>
              <span>Clear selection</span>
            </div>
          </div>
        </details>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="action-buttons">
      <button 
        v-if="file" 
        @click="resetOrganization" 
        class="secondary-btn"
      >
        Reset
      </button>
      <button 
        class="organize-btn" 
        @click="organizePdf" 
        :disabled="loading || !file || pages.length === 0"
      >
        <span v-if="loading">🔄 Organizing PDF...</span>
        <span v-else>🚀 Download Organized PDF</span>
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
  border-color: #8FBC5D;
  background: #f5f9f0;
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

/* Organization Interface */
.organization-interface {
  text-align: left;
}

/* Header */
.org-header {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
  border: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.file-info h3 {
  font-size: 18px;
  color: #333;
  margin: 0 0 5px 0;
  word-break: break-all;
}

.file-info p {
  font-size: 13px;
  color: #666;
  margin: 0;
}

.header-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.selection-info {
  font-size: 14px;
  color: #8FBC5D;
  font-weight: 500;
  text-align: right;
}

.view-controls {
  display: flex;
  gap: 10px;
  align-items: center;
}

.view-btn, .size-btn {
  padding: 8px 12px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.view-btn:hover, .size-btn:hover {
  border-color: #8FBC5D;
  background: #f5f9f0;
}

.size-controls {
  display: flex;
  gap: 5px;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 2px;
  background: white;
}

.size-btn {
  padding: 6px 10px;
  border: none;
  background: transparent;
}

.size-btn.active {
  background: #8FBC5D;
  color: white;
}

/* Action Toolbar */
.action-toolbar {
  background: white;
  padding: 15px 20px;
  border-radius: 12px;
  margin-bottom: 20px;
  border: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
}

.selection-actions, .page-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.toolbar-btn {
  padding: 8px 16px;
  background: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.toolbar-btn:hover:not(:disabled) {
  background: #e9ecef;
  border-color: #999;
}

.toolbar-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn {
  padding: 8px 16px;
  background: white;
  border: 1px solid var(--btn-color, #8FBC5D);
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  color: var(--btn-color, #8FBC5D);
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.action-btn:hover:not(:disabled) {
  background: var(--btn-color, #8FBC5D);
  color: white;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-icon {
  font-size: 16px;
}

.action-text {
  font-weight: 500;
}

/* Pages Container */
.pages-container {
  margin: 20px 0;
  min-height: 400px;
}

/* Grid View */
.pages-container.grid {
  display: grid;
  gap: 20px;
}

.pages-container.grid.small {
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
}

.pages-container.grid.medium {
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}

.pages-container.grid.large {
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
}

/* List View */
.pages-container.list .page-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 20px;
  align-items: center;
  padding: 15px;
  margin-bottom: 10px;
}

/* Page Item */
.page-item {
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  padding: 15px;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;
}

.page-item:hover {
  border-color: #8FBC5D;
  box-shadow: 0 4px 12px rgba(143, 188, 93, 0.1);
  transform: translateY(-2px);
}

.page-item.selected {
  border-color: #8FBC5D;
  background: #f5f9f0;
}

.page-item.dragging {
  border-color: #4a6fa5;
  background: #f0f4fa;
}

.page-item.has-rotation {
  border-left: 4px solid #f39c12;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.page-number {
  display: flex;
  align-items: center;
  gap: 8px;
}

.current-number {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  background: #f8f9fa;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.rotation-indicator {
  font-size: 11px;
  color: #f39c12;
  background: #fff8e1;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 500;
}

.page-controls {
  display: flex;
  gap: 5px;
  opacity: 0;
  transition: opacity 0.2s;
}

.page-item:hover .page-controls {
  opacity: 1;
}

.move-btn {
  width: 28px;
  height: 28px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.move-btn:hover {
  background: #f8f9fa;
  border-color: #8FBC5D;
}

/* Page Thumbnail */
.page-thumbnail {
  margin: 10px 0;
}

.thumbnail-placeholder {
  width: 100%;
  height: 200px;
  background: linear-gradient(135deg, #f5f5f5, #e9ecef);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  transition: transform 0.3s ease;
}

.thumbnail-placeholder::before {
  content: '';
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  bottom: 10px;
  border: 1px dashed #ddd;
  border-radius: 4px;
}

.page-label {
  position: absolute;
  bottom: 10px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  background: rgba(255, 255, 255, 0.9);
  padding: 5px;
}

/* Page Info (List View) */
.page-info h4 {
  font-size: 16px;
  color: #333;
  margin: 0 0 10px 0;
}

.page-info p {
  font-size: 13px;
  color: #666;
  margin: 0 0 10px 0;
  line-height: 1.5;
}

.page-meta {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: #999;
}

/* Selection Checkbox */
.selection-checkbox {
  position: absolute;
  top: 15px;
  left: 15px;
}

.selection-checkbox input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: #8FBC5D;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 2px dashed #e9ecef;
  margin: 20px 0;
}

.empty-icon {
  font-size: 60px;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-state p {
  font-size: 16px;
  color: #666;
  margin: 0 0 10px 0;
}

.empty-hint {
  font-size: 13px;
  color: #999;
}

/* Page Stats */
.page-stats {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin: 20px 0;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.stat {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 5px;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: bold;
  color: #8FBC5D;
}

/* Keyboard Shortcuts Help */
.shortcuts-help {
  margin: 20px 0;
}

.shortcuts-help details {
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  overflow: hidden;
}

.shortcuts-help summary {
  padding: 15px 20px;
  cursor: pointer;
  font-weight: 500;
  color: #333;
  list-style: none;
  display: flex;
  align-items: center;
  gap: 10px;
}

.shortcuts-help summary::-webkit-details-marker {
  display: none;
}

.shortcuts-help summary::after {
  content: '▶';
  transition: transform 0.3s;
  margin-left: auto;
}

.shortcuts-help details[open] summary::after {
  transform: rotate(90deg);
}

.shortcuts-list {
  padding: 15px 20px;
  border-top: 1px solid #e9ecef;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
}

.shortcut {
  display: flex;
  align-items: center;
  gap: 15px;
}

.shortcut kbd {
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  font-family: monospace;
  min-width: 80px;
  text-align: center;
}

.shortcut span {
  font-size: 13px;
  color: #666;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin: 30px 0;
}

.organize-btn {
  flex: 1;
  max-width: 300px;
  padding: 16px 30px;
  font-size: 16px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  background: linear-gradient(135deg, #8FBC5D, #7CAF4D);
  color: white;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(143, 188, 93, 0.2);
}

.organize-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(143, 188, 93, 0.3);
  background: linear-gradient(135deg, #7CAF4D, #6BA23D);
}

.organize-btn:disabled {
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
  color: #8FBC5D;
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
  background: linear-gradient(90deg, #8FBC5D, #A3D47A);
  transition: width 0.3s ease;
}
</style>