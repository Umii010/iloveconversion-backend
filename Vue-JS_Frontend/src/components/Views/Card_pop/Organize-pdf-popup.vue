<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'

const file = ref(null)
const loading = ref(false)
const progress = ref(0)
const statusText = ref('')

// Page management
const pages = ref([])
const selectedPages = ref(new Set())
const currentPage = ref(1)
const isDragging = ref(false)
const dragStartIndex = ref(null)
const dragOverIndex = ref(null)

// View settings
const viewMode = ref('grid') // 'grid' or 'list'
const showThumbnails = ref(true)
const showPageNumbers = ref(true)
const itemsPerPage = ref(12) // Pagination
const currentPageIndex = ref(1)

// Actions
const actions = ref([
  { id: 'rotate-right', name: '↻', title: 'Rotate Right', color: '#4a6fa5' },
  { id: 'rotate-left', name: '↺', title: 'Rotate Left', color: '#4a6fa5' },
  { id: 'delete', name: '🗑️', title: 'Delete', color: '#e74c3c' },
  { id: 'duplicate', name: '📄', title: 'Duplicate', color: '#2ecc71' },
  { id: 'extract', name: '📤', title: 'Extract', color: '#f39c12' }
])

// Pagination
const totalPages = computed(() => Math.ceil(pages.value.length / itemsPerPage.value))
const paginatedPages = computed(() => {
  const start = (currentPageIndex.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return pages.value.slice(start, end)
})

// Selection stats
const selectionStats = computed(() => ({
  total: pages.value.length,
  selected: selectedPages.value.size,
  rotated: pages.value.filter(p => p.rotation !== 0).length,
  currentRange: `${(currentPageIndex.value - 1) * itemsPerPage.value + 1}-${Math.min(currentPageIndex.value * itemsPerPage.value, pages.value.length)}`
}))

const selectFile = async (e) => {
  const selectedFile = e.target.files[0]
  if (!selectedFile) return
  
  file.value = selectedFile
  console.log('File selected for organization:', selectedFile.name)
  
  // Generate dummy page data
  generateSamplePages()
}

const generateSamplePages = () => {
  pages.value = []
  const totalPages = 24 // Sample number of pages
  
  for (let i = 1; i <= totalPages; i++) {
    pages.value.push({
      id: i,
      number: i,
      label: `Page ${i}`,
      rotation: 0,
      selected: false,
      thumbnail: `https://via.placeholder.com/120x170/4a6fa5/ffffff?text=P${i}`,
      size: 'A4',
      dimensions: '595 × 842'
    })
  }
  currentPageIndex.value = 1
}

// Page selection
const togglePageSelection = (pageId, event) => {
  if (event?.ctrlKey || event?.metaKey) {
    // Multi-select with Ctrl/Cmd
    if (selectedPages.value.has(pageId)) {
      selectedPages.value.delete(pageId)
    } else {
      selectedPages.value.add(pageId)
    }
  } else if (event?.shiftKey) {
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

const selectCurrentPage = () => {
  const startIndex = (currentPageIndex.value - 1) * itemsPerPage.value
  const endIndex = Math.min(startIndex + itemsPerPage.value, pages.value.length)
  
  selectedPages.value.clear()
  for (let i = startIndex; i < endIndex; i++) {
    selectedPages.value.add(pages.value[i].id)
  }
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
    }
  })
}

const deletePages = (pageIds) => {
  if (!confirm(`Delete ${pageIds.length} selected page(s)?`)) return
  
  pages.value = pages.value.filter(page => !pageIds.includes(page.id))
  
  // Re-number remaining pages
  pages.value.forEach((page, index) => {
    page.number = index + 1
    page.label = `Page ${page.number}`
  })
  
  selectedPages.value.clear()
  
  // Adjust current page if needed
  if (currentPageIndex.value > totalPages.value) {
    currentPageIndex.value = totalPages.value
  }
}

const duplicatePages = (pageIds) => {
  const pagesToDuplicate = pages.value.filter(page => pageIds.includes(page.id))
  const newPages = pagesToDuplicate.map(page => ({
    ...page,
    id: Date.now() + Math.random(),
    number: pages.value.length + 1,
    label: `Page ${pages.value.length + 1}`,
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
    const actualStartIndex = (currentPageIndex.value - 1) * itemsPerPage.value + dragStartIndex.value
    const actualDropIndex = (currentPageIndex.value - 1) * itemsPerPage.value + index
    
    // Reorder pages
    const movedPage = pages.value[actualStartIndex]
    pages.value.splice(actualStartIndex, 1)
    pages.value.splice(actualDropIndex, 0, movedPage)
    
    // Update page numbers
    pages.value.forEach((page, idx) => {
      page.number = idx + 1
    })
  }
  
  dragStartIndex.value = null
  dragOverIndex.value = null
  isDragging.value = false
}

// Pagination
const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPageIndex.value = page
  }
}

const nextPage = () => {
  if (currentPageIndex.value < totalPages.value) {
    currentPageIndex.value++
  }
}

const prevPage = () => {
  if (currentPageIndex.value > 1) {
    currentPageIndex.value--
  }
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
  statusText.value = 'Preparing organization...'

  const organizationData = {
    pages: pages.value.map(page => ({
      originalNumber: page.id,
      newNumber: page.number,
      rotation: page.rotation,
      action: 'keep'
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

    const contentDisposition = res.headers.get('content-disposition')
    let fileName = `organized_${file.value.name}`
    
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

    statusText.value = '✅ Organization completed!'

  } catch (err) {
    statusText.value = '❌ Organization failed'
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
    currentPageIndex.value = 1
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
    // Arrow keys for navigation
    if (e.key === 'ArrowRight') nextPage()
    if (e.key === 'ArrowLeft') prevPage()
  }

  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div class="converter">
    <h2>📑 Organize PDF Pages</h2>
    <p class="subtitle">Rearrange, rotate, delete or extract pages from your PDF</p>

    <!-- File Upload -->
    <label class="upload-box" v-if="!file">
      <input
        type="file"
        accept="application/pdf"
        @change="selectFile"
        hidden
      />
      <div class="upload-content">
        <span class="icon">📄</span>
        <p><strong>Upload PDF</strong></p>
        <small>Drag & drop or click to browse</small>
      </div>
    </label>

    <!-- Organization Interface -->
    <div v-if="file" class="organization-interface">
      <!-- Compact Header -->
      <div class="compact-header">
        <div class="header-left">
          <div class="file-badge">
            <span class="file-icon">📄</span>
            <div class="file-details">
              <strong>{{ file.name }}</strong>
              <small>{{ selectionStats.total }} pages</small>
            </div>
          </div>
        </div>
        
        <div class="header-center">
          <div class="selection-badge" v-if="selectionStats.selected > 0">
            <span class="selected-count">{{ selectionStats.selected }}</span>
            <span>selected</span>
          </div>
          <div class="selection-badge rotated" v-if="selectionStats.rotated > 0">
            <span class="rotated-count">{{ selectionStats.rotated }}</span>
            <span>rotated</span>
          </div>
        </div>
        
        <div class="header-right">
          <div class="view-toggle">
            <button 
              @click="showThumbnails = !showThumbnails" 
              class="view-btn"
              :title="showThumbnails ? 'Hide thumbnails' : 'Show thumbnails'"
            >
              {{ showThumbnails ? '👁️' : '👁️‍🗨️' }}
            </button>
            <button 
              @click="showPageNumbers = !showPageNumbers" 
              class="view-btn"
              :title="showPageNumbers ? 'Hide page numbers' : 'Show page numbers'"
            >
              {{ showPageNumbers ? '🔢' : '#' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Quick Actions Bar -->
      <div class="quick-actions">
        <div class="action-group">
          <button 
            @click="selectAllPages" 
            class="action-btn compact"
            :disabled="pages.length === 0"
            title="Select all pages"
          >
            ☑ All
          </button>
          <button 
            @click="selectCurrentPage" 
            class="action-btn compact"
            :disabled="pages.length === 0"
            title="Select current page"
          >
            📄 Current
          </button>
          <button 
            @click="clearSelection" 
            class="action-btn compact"
            :disabled="selectionStats.selected === 0"
            title="Clear selection"
          >
            ✕ Clear
          </button>
        </div>
        
        <div class="action-group">
          <button 
            v-for="action in actions" 
            :key="action.id"
            @click="performAction(action.id)"
            class="action-btn icon-only"
            :style="{ '--btn-color': action.color }"
            :title="action.title"
            :disabled="selectionStats.selected === 0"
          >
            {{ action.name }}
          </button>
        </div>
      </div>

      <!-- Pages Grid -->
      <div class="pages-grid-container">
        <!-- Pagination Header -->
        <div class="pagination-header">
          <div class="pagination-info">
            Showing pages {{ selectionStats.currentRange }} of {{ selectionStats.total }}
          </div>
          <div class="pagination-controls">
            <button @click="prevPage" :disabled="currentPageIndex === 1" class="page-nav">
              ←
            </button>
            <div class="page-numbers">
              <span 
                v-for="page in Math.min(5, totalPages)" 
                :key="page"
                @click="goToPage(page)"
                :class="{ active: currentPageIndex === page }"
                class="page-number"
              >
                {{ page }}
              </span>
              <span v-if="totalPages > 5" class="page-ellipsis">...</span>
              <span 
                v-if="totalPages > 1" 
                @click="goToPage(totalPages)"
                :class="{ active: currentPageIndex === totalPages }"
                class="page-number"
              >
                {{ totalPages }}
              </span>
            </div>
            <button @click="nextPage" :disabled="currentPageIndex === totalPages" class="page-nav">
              →
            </button>
          </div>
        </div>

        <!-- Pages Grid -->
        <div class="pages-grid">
          <div 
            v-for="(page, index) in paginatedPages" 
            :key="page.id"
            class="page-card"
            :class="{ 
              selected: page.selected,
              dragging: dragOverIndex === index,
              rotated: page.rotation !== 0
            }"
            @click="togglePageSelection(page.id, $event)"
            draggable="true"
            @dragstart="startDrag(index, $event)"
            @dragover.prevent="onDragOver(index, $event)"
            @drop="onDrop(index, $event)"
            @dragleave="dragOverIndex = null"
            @dragend="isDragging = false"
          >
            <!-- Page Number -->
            <div v-if="showPageNumbers" class="page-number-badge">
              {{ page.number }}
              <span v-if="page.rotation !== 0" class="rotation-badge">
                {{ page.rotation }}°
              </span>
            </div>
            
            <!-- Thumbnail -->
            <div v-if="showThumbnails" class="page-thumbnail">
              <div 
                class="thumbnail"
                :style="{ 
                  backgroundImage: `url(${page.thumbnail})`,
                  transform: `rotate(${page.rotation}deg)`
                }"
              ></div>
              <div class="thumbnail-overlay">
                <span class="page-label">Page {{ page.number }}</span>
              </div>
            </div>
            
            <!-- Fallback when thumbnails are hidden -->
            <div v-else class="page-placeholder">
              <span class="placeholder-icon">📄</span>
              <span class="placeholder-text">Page {{ page.number }}</span>
              <span v-if="page.rotation !== 0" class="placeholder-rotation">
                ↻ {{ page.rotation }}°
              </span>
            </div>
            
            <!-- Selection Checkbox -->
            <div class="selection-indicator">
              <div class="checkbox" :class="{ checked: page.selected }">
                <span v-if="page.selected">✓</span>
              </div>
            </div>
            
            <!-- Quick Actions on Hover -->
            <div class="page-actions-hover">
              <button 
                @click.stop="rotatePages([page.id], 90)" 
                class="hover-action"
                title="Rotate right"
              >
                ↻
              </button>
              <button 
                @click.stop="deletePages([page.id])" 
                class="hover-action delete"
                title="Delete page"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="pages.length === 0" class="empty-state">
          <div class="empty-icon">📄</div>
          <p>No pages to display</p>
          <small>Upload a PDF to start organizing pages</small>
        </div>
      </div>

      <!-- Pagination Footer -->
      <div class="pagination-footer">
        <div class="footer-left">
          <div class="page-size-control">
            <label>Show:</label>
            <select v-model="itemsPerPage" class="size-select">
              <option value="8">8 per page</option>
              <option value="12">12 per page</option>
              <option value="16">16 per page</option>
              <option value="20">20 per page</option>
            </select>
          </div>
        </div>
        
        <div class="footer-right">
          <div class="keyboard-hint">
            <kbd>Ctrl+A</kbd> Select all • 
            <kbd>Shift+Click</kbd> Range • 
            <kbd>Del</kbd> Delete
          </div>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="action-buttons">
      <button 
        v-if="file" 
        @click="resetOrganization" 
        class="secondary-btn"
        :disabled="loading"
      >
        ↺ Reset
      </button>
      <button 
        class="organize-btn" 
        @click="organizePdf" 
        :disabled="loading || !file || pages.length === 0"
        :class="{ loading: loading }"
      >
        <template v-if="loading">
          <span class="spinner">⟳</span>
          Processing... {{ progress }}%
        </template>
        <template v-else>
          🚀 Download Organized PDF
        </template>
      </button>
    </div>

    <!-- Progress Bar -->
    <div v-if="loading" class="progress-container">
      <div class="progress-info">
        <span class="status">{{ statusText }}</span>
        <span class="percentage">{{ progress }}%</span>
      </div>
      <div class="progress-bar">
        <div 
          class="progress-fill" 
          :style="{ width: progress + '%' }"
        ></div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.converter {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

h2 {
  font-size: 24px;
  margin-bottom: 8px;
  color: #333;
  text-align: center;
}

.subtitle {
  font-size: 14px;
  color: #666;
  margin-bottom: 30px;
  text-align: center;
  line-height: 1.5;
}

/* File Upload */
.upload-box {
  display: block;
  border: 3px dashed #d1d5db;
  border-radius: 16px;
  padding: 60px 20px;
  cursor: pointer;
  background: #f9fafb;
  transition: all 0.3s;
  margin: 0 auto 30px;
  max-width: 600px;
  text-align: center;
}

.upload-box:hover {
  border-color: #8FBC5D;
  background: #f5f9f0;
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(143, 188, 93, 0.1);
}

.upload-content .icon {
  font-size: 48px;
  display: block;
  margin-bottom: 15px;
  color: #8FBC5D;
}

.upload-content p {
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 8px 0;
}

.upload-content small {
  font-size: 14px;
  color: #6b7280;
}

/* Compact Header */
.compact-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 15px 20px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  margin-bottom: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.header-left, .header-center, .header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.file-badge {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: #f5f9f0;
  border-radius: 10px;
  border: 1px solid #d1e7b5;
}

.file-icon {
  font-size: 24px;
  color: #8FBC5D;
}

.file-details {
  display: flex;
  flex-direction: column;
}

.file-details strong {
  font-size: 14px;
  color: #374151;
  font-weight: 600;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-details small {
  font-size: 12px;
  color: #6b7280;
}

.selection-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #f0f4fa;
  border-radius: 20px;
  font-size: 13px;
  color: #4a6fa5;
  font-weight: 500;
}

.selection-badge.rotated {
  background: #fff8e1;
  color: #f59e0b;
}

.selected-count, .rotated-count {
  font-weight: 700;
  font-size: 14px;
}

.view-toggle {
  display: flex;
  gap: 8px;
}

.view-btn {
  width: 36px;
  height: 36px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.view-btn:hover {
  border-color: #8FBC5D;
  background: #f5f9f0;
}

/* Quick Actions */
.quick-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 12px 20px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.action-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-btn {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.action-btn.compact {
  min-width: 80px;
}

.action-btn.icon-only {
  width: 36px;
  height: 36px;
  padding: 0;
  border-color: var(--btn-color, #d1d5db);
  color: var(--btn-color, #374151);
}

.action-btn:hover:not(:disabled) {
  background: #f5f9f0;
  border-color: #8FBC5D;
  transform: translateY(-1px);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

/* Pages Grid Container */
.pages-grid-container {
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  margin-bottom: 20px;
  overflow: hidden;
}

/* Pagination Header */
.pagination-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e5e7eb;
}

.pagination-info {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.page-nav {
  width: 32px;
  height: 32px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.page-nav:hover:not(:disabled) {
  border-color: #8FBC5D;
  background: #f5f9f0;
}

.page-nav:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 4px;
  align-items: center;
}

.page-number {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.page-number:hover {
  background: #f3f4f6;
}

.page-number.active {
  background: #8FBC5D;
  color: white;
}

.page-ellipsis {
  color: #9ca3af;
  padding: 0 4px;
}

/* Pages Grid */
.pages-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 15px;
  padding: 20px;
  max-height: 500px;
  overflow-y: auto;
}

/* Page Card */
.page-card {
  position: relative;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s;
  aspect-ratio: 3/4;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  user-select: none;
}

.page-card:hover {
  border-color: #8FBC5D;
  box-shadow: 0 8px 20px rgba(143, 188, 93, 0.15);
  transform: translateY(-4px);
}

.page-card.selected {
  border-color: #8FBC5D;
  background: #f5f9f0;
}

.page-card.dragging {
  border-color: #4a6fa5;
  background: #f0f4fa;
  opacity: 0.8;
}

.page-card.rotated {
  border-left: 3px solid #f59e0b;
}

.page-number-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 4px;
}

.rotation-badge {
  background: #f59e0b;
  color: white;
  padding: 1px 4px;
  border-radius: 8px;
  font-size: 10px;
}

.page-thumbnail {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  border-radius: 6px;
}

.thumbnail {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  transition: transform 0.3s;
}

.thumbnail-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  padding: 8px;
  text-align: center;
}

.page-label {
  color: white;
  font-size: 11px;
  font-weight: 500;
}

.page-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 100%;
}

.placeholder-icon {
  font-size: 32px;
  color: #9ca3af;
}

.placeholder-text {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

.placeholder-rotation {
  font-size: 11px;
  color: #f59e0b;
  background: #fff8e1;
  padding: 2px 6px;
  border-radius: 10px;
}

.selection-indicator {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2;
}

.checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid #d1d5db;
  border-radius: 6px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  transition: all 0.2s;
}

.checkbox.checked {
  background: #8FBC5D;
  border-color: #8FBC5D;
  color: white;
}

.page-actions-hover {
  position: absolute;
  bottom: 10px;
  right: 10px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.3s;
}

.page-card:hover .page-actions-hover {
  opacity: 1;
  transform: translateY(0);
}

.hover-action {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.hover-action:hover {
  background: #8FBC5D;
  color: white;
}

.hover-action.delete:hover {
  background: #ef4444;
}

/* Empty State */
.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-state p {
  font-size: 16px;
  color: #6b7280;
  margin: 0 0 8px 0;
  font-weight: 500;
}

.empty-state small {
  font-size: 14px;
  color: #9ca3af;
}

/* Pagination Footer */
.pagination-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #f8f9fa;
  border-top: 1px solid #e5e7eb;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
}

.page-size-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-size-control label {
  font-size: 13px;
  color: #6b7280;
}

.size-select {
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
}

.size-select:focus {
  outline: none;
  border-color: #8FBC5D;
}

.keyboard-hint {
  font-size: 12px;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.keyboard-hint kbd {
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 11px;
  font-family: monospace;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin: 40px 0 30px;
}

.organize-btn {
  flex: 1;
  max-width: 350px;
  padding: 18px 30px;
  background: linear-gradient(135deg, #8FBC5D, #7CAF4D);
  color: white;
  border: none;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 8px 25px rgba(143, 188, 93, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 56px;
}

.organize-btn:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 12px 30px rgba(143, 188, 93, 0.4);
  background: linear-gradient(135deg, #7CAF4D, #6BA23D);
}

.organize-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.organize-btn.loading {
  background: linear-gradient(135deg, #6b7280, #4b5563);
}

.secondary-btn {
  padding: 18px 30px;
  background: white;
  border: 2px solid #d1d5db;
  border-radius: 14px;
  color: #6b7280;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 120px;
  font-size: 15px;
}

.secondary-btn:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
  color: #374151;
}

.secondary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  display: inline-block;
  animation: spin 1s linear infinite;
  font-size: 18px;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Progress Container */
.progress-container {
  margin: 30px auto;
  max-width: 600px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 14px;
}

.progress-info .status {
  color: #374151;
  font-weight: 500;
}

.progress-info .percentage {
  color: #8FBC5D;
  font-weight: 600;
}

.progress-bar {
  height: 10px;
  background: #e5e7eb;
  border-radius: 5px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #8FBC5D, #A3D47A);
  border-radius: 5px;
  transition: width 0.3s ease;
  position: relative;
  overflow: hidden;
}

.progress-fill::after {
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

/* Quick Tips */
.quick-tips {
  background: linear-gradient(135deg, #f0f9f4, #e8f5e9);
  border: 1px solid #c8e6c9;
  border-radius: 12px;
  padding: 20px;
  margin-top: 20px;
}

.quick-tips h4 {
  margin: 0 0 12px 0;
  color: #217346;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.quick-tips ul {
  margin: 0;
  padding-left: 0;
  list-style: none;
}

.quick-tips li {
  margin-bottom: 8px;
  color: #2e7d32;
  font-size: 13px;
  line-height: 1.5;
  display: flex;
  align-items: center;
  gap: 8px;
}

.quick-tips li:last-child {
  margin-bottom: 0;
}

.quick-tips kbd {
  background: white;
  border: 1px solid #a3d47a;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 11px;
  font-family: monospace;
  color: #217346;
}

/* Responsive */
@media (max-width: 768px) {
  .converter {
    padding: 15px;
  }
  
  .pages-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;
    padding: 15px;
  }
  
  .compact-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .header-left, .header-center, .header-right {
    justify-content: center;
  }
  
  .quick-actions {
    flex-direction: column;
    gap: 10px;
  }
  
  .action-group {
    justify-content: center;
  }
  
  .pagination-header, .pagination-footer {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .organize-btn, .secondary-btn {
    width: 100%;
    max-width: none;
  }
}

@media (max-width: 480px) {
  .pages-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 10px;
    padding: 10px;
  }
  
  .page-card {
    padding: 10px;
  }
  
  .file-badge {
    max-width: 100%;
    overflow: hidden;
  }
  
  .keyboard-hint {
    font-size: 11px;
  }
}
</style>