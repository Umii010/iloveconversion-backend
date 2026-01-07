<template>
  <div class="code-diff-page">
    <div class="page-header">
      <div class="header-content">
        <div class="header-info">
          <h1 class="page-title">Code Comparison Tool</h1>
          <p class="page-subtitle">
            Compare two code versions side-by-side with Git-style highlighting
          </p>
        </div>
        <div class="header-actions">
          <button class="action-button" aria-label="moon" @click="toggleTheme">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="page-content">
      <!-- Error Display -->
      <div v-if="error" class="error-message">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
        <span>{{ error }}</span>
      </div>

      <!-- Controls -->
      <div class="controls">
        <button class="compare-button" @click="compareCode" :disabled="loading">
          <span v-if="loading" class="loading-spinner"></span>
          <span v-else>Compare Code</span>
        </button>
        <button class="clear-button" @click="clearCode">
          Clear All
        </button>
      </div>

      <!-- Code Editors Section -->
      <div class="editors-section">
        <div class="editor-container">
          <div class="editor-header">
            <h4 class="editor-title">Original Code</h4>
            <div class="diff-indicator">
              <span class="removed-marker">-</span> Removed lines
              <span v-if="firstChangedLine" class="change-start">
                • First change at line {{ firstChangedLine }}
              </span>
            </div>
          </div>
          <div class="code-editor-wrapper" ref="originalWrapper">
            <div class="code-display" ref="originalDisplay">
              <div class="line-numbers">
                <div 
                  v-for="n in originalLineCount" 
                  :key="n" 
                  class="line-number"
                  :class="{'first-change': isFirstChangeLine(n, 'original')}"
                >{{ n }}</div>
              </div>
              <div class="code-content">
                <div 
                  v-for="(line, index) in originalDisplayLines" 
                  :key="index"
                  class="code-line"
                  :class="{
                    'removed': line.type === 'removed',
                    'unchanged': line.type === 'unchanged',
                    'context': line.type === 'context',
                    'first-change': line.isFirstChange
                  }"
                >
                  <span class="git-marker" v-if="line.type === 'removed'">-</span>
                  <span class="line-text">{{ line.content }}</span>
                </div>
              </div>
            </div>
            <textarea 
              ref="originalTextarea"
              v-model="originalCode" 
              class="code-input"
              placeholder="Paste original code here..."
              spellcheck="false"
              @input="handleOriginalInput"
            ></textarea>
          </div>
        </div>

        <div class="editor-container">
          <div class="editor-header">
            <h3 class="editor-title">Modified Code</h3>
            <div class="diff-indicator">
              <span class="added-marker">+</span> Added lines
              <span v-if="firstChangedLine" class="change-start">
                • First change at line {{ firstChangedLine }}
              </span>
            </div>
          </div>
          <div class="code-editor-wrapper" ref="modifiedWrapper">
            <div class="code-display" ref="modifiedDisplay">
              <div class="line-numbers">
                <div 
                  v-for="n in modifiedLineCount" 
                  :key="n" 
                  class="line-number"
                  :class="{'first-change': isFirstChangeLine(n, 'modified')}"
                >{{ n }}</div>
              </div>
              <div class="code-content">
                <div 
                  v-for="(line, index) in modifiedDisplayLines" 
                  :key="index"
                  class="code-line"
                  :class="{
                    'added': line.type === 'added',
                    'unchanged': line.type === 'unchanged',
                    'context': line.type === 'context',
                    'first-change': line.isFirstChange
                  }"
                >
                  <span class="git-marker" v-if="line.type === 'added'">+</span>
                  <span class="line-text">{{ line.content }}</span>
                </div>
              </div>
            </div>
            <textarea 
              ref="modifiedTextarea"
              v-model="modifiedCode" 
              class="code-input"
              placeholder="Paste modified code here..."
              spellcheck="false"
              @input="handleModifiedInput"
            ></textarea>
          </div>
        </div>
      </div>

      <div v-if="stats" class="stats-section">
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value" :style="{ color: '#10b981' }">{{ stats.added }}</div>
            <div class="stat-label">Lines Added</div>
          </div>
          <div class="stat-item">
            <div class="stat-value" :style="{ color: '#ef4444' }">{{ stats.removed }}</div>
            <div class="stat-label">Lines Removed</div>
          </div>
          <div class="stat-item">
            <div class="stat-value" :style="{ color: '#64748b' }">{{ stats.unchanged }}</div>
            <div class="stat-label">Unchanged</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ stats.total }}</div>
            <div class="stat-label">Total Lines</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ stats.changePercentage }}%</div>
            <div class="stat-label">Changed</div>
          </div>
        </div>
        <div class="stat-summary">
          {{ stats.summary }}
          <span v-if="firstChangedLine" class="first-change-info">
            • First change found at line {{ firstChangedLine }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import axios from 'axios';

const API_BASE_URL = 'http://192.168.18.101:3000/api/code-diff';

const originalCode = ref('');
const modifiedCode = ref('');
const loading = ref(false);
const diffResult = ref(null);
const stats = ref(null);
const error = ref('');
const originalTextarea = ref(null);
const modifiedTextarea = ref(null);
const originalWrapper = ref(null);
const modifiedWrapper = ref(null);
const originalDisplay = ref(null);
const modifiedDisplay = ref(null);
const firstChangedLine = ref(null);

const originalLineCount = computed(() => {
  return Math.max(1, originalCode.value.split('\n').length);
});

const modifiedLineCount = computed(() => {
  return Math.max(1, modifiedCode.value.split('\n').length);
});

const originalDisplayLines = computed(() => {
  if (!originalCode.value) {
    return [];
  }
  
  const lines = originalCode.value.split('\n');
  const result = [];
  
  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1;
    const lineContent = lines[i];
    let type = 'context';
    let isFirstChange = false;
    
    if (diffResult.value) {
      const isRemoved = diffResult.value.removed?.some(item => item.lineNumber === lineNumber);
      const isUnchanged = diffResult.value.unchanged?.some(item => item.lineNumber === lineNumber);
      
      if (isRemoved) {
        type = 'removed';
        isFirstChange = lineNumber === firstChangedLine.value;
      } else if (isUnchanged) {
        type = 'unchanged';
      }
    }
    
    result.push({
      type,
      content: lineContent,
      isFirstChange,
      lineNumber
    });
  }
  
  return result;
});

const modifiedDisplayLines = computed(() => {
  if (!modifiedCode.value) {
    return [];
  }
  
  const lines = modifiedCode.value.split('\n');
  const result = [];
  
  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1;
    const lineContent = lines[i];
    let type = 'context';
    let isFirstChange = false;
    
    if (diffResult.value) {
      const isAdded = diffResult.value.added?.some(item => item.lineNumber === lineNumber);
      const isUnchanged = diffResult.value.unchanged?.some(item => item.lineNumber === lineNumber);
      
      if (isAdded) {
        type = 'added';
        isFirstChange = lineNumber === firstChangedLine.value;
      } else if (isUnchanged) {
        type = 'unchanged';
      }
    }
    
    result.push({
      type,
      content: lineContent,
      isFirstChange,
      lineNumber
    });
  }
  
  return result;
});

const findFirstChangedLine = () => {
  if (!diffResult.value) {
    firstChangedLine.value = null;
    return;
  }

  const allChangedLines = [
    ...(diffResult.value.added || []).map(item => item.lineNumber),
    ...(diffResult.value.removed || []).map(item => item.lineNumber)
  ];

  if (allChangedLines.length > 0) {
    firstChangedLine.value = Math.min(...allChangedLines);
  } else {
    firstChangedLine.value = null;
  }
};

const isFirstChangeLine = (lineNumber, type) => {
  if (!firstChangedLine.value) return false;
  
  if (type === 'original') {
    const isRemoved = diffResult.value?.removed?.some(item => item.lineNumber === lineNumber);
    return isRemoved && lineNumber === firstChangedLine.value;
  } else {
    const isAdded = diffResult.value?.added?.some(item => item.lineNumber === lineNumber);
    return isAdded && lineNumber === firstChangedLine.value;
  }
};

const scrollToFirstChange = () => {
  if (!firstChangedLine.value) return;

  nextTick(() => {
    const lineHeight = 24;
    const scrollPosition = (firstChangedLine.value - 1) * lineHeight - 100; 
        if (originalWrapper.value) {
      originalWrapper.value.scrollTop = scrollPosition;
    }
    if (modifiedWrapper.value) {
      modifiedWrapper.value.scrollTop = scrollPosition;
    }
  });
};

const toggleTheme = () => {
  const html = document.documentElement;
  const currentTheme = html.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
};

const handleOriginalInput = () => {
  nextTick(() => {
    if (originalTextarea.value) {
      if (originalDisplay.value) {
        originalDisplay.value.style.height = originalTextarea.value.scrollHeight + 'px';
      }
    }
  });
};

const handleModifiedInput = () => {
  nextTick(() => {
    if (modifiedTextarea.value) {
      if (modifiedDisplay.value) {
        modifiedDisplay.value.style.height = modifiedTextarea.value.scrollHeight + 'px';
      }
    }
  });
};

const clearCode = () => {
  originalCode.value = '';
  modifiedCode.value = '';
  diffResult.value = null;
  stats.value = null;
  firstChangedLine.value = null;
  error.value = '';
  handleOriginalInput();
  handleModifiedInput();
};

const loadExample = (type) => {
  const examples = {
    javascript: {
      original: `function greet(name) {
  console.log("Hello, " + name);
}

greet("World");`,
      modified: `function greet(name = "Guest") {
  console.log(\`Hello, \${name}!\`);
  return \`Hello, \${name}!\`;
}

greet("World");`
    },
    python: {
      original: `def calculate_sum(numbers):
    total = 0
    for num in numbers:
        total = total + num
    return total`,
      modified: `def calculate_sum(numbers):
    if not numbers:
        return 0
    total = sum(numbers)
    return total`
    },
    html: {
      original: `<div class="container">
  <h1>Welcome</h1>
  <p>This is some content.</p>
</div>`,
      modified: `<div class="container">
  <header>
    <h1>Welcome to our site</h1>
  </header>
  <main>
    <p>This is some updated content.</p>
    <button>Learn more</button>
  </main>
</div>`
    }
  };

  if (examples[type]) {
    originalCode.value = examples[type].original;
    modifiedCode.value = examples[type].modified;
    diffResult.value = null;
    stats.value = null;
    firstChangedLine.value = null;
    handleOriginalInput();
    handleModifiedInput();
  }
};

const compareCode = async () => {
  if (!originalCode.value.trim() || !modifiedCode.value.trim()) {
    error.value = 'Please enter both original and modified code';
    return;
  }

  loading.value = true;
  error.value = '';
  diffResult.value = null;
  stats.value = null;
  firstChangedLine.value = null;

  try {
    const response = await axios.post(`${API_BASE_URL}/compare`, {
      originalCode: originalCode.value,
      modifiedCode: modifiedCode.value,
      language: 'text',
      comparisonType: 'lines'
    });

    if (response.data.success) {
      diffResult.value = response.data.diff;
      stats.value = response.data.stats;
      findFirstChangedLine();
      scrollToFirstChange();
    } else {
      error.value = response.data.error || 'Comparison failed';
    }
  } catch (err) {
    console.log('API unavailable, using local diff algorithm');
    const localDiff = generateLocalDiff();
    diffResult.value = localDiff.diff;
    stats.value = localDiff.stats;
    findFirstChangedLine();
    scrollToFirstChange();
  } finally {
    loading.value = false;
  }
};

const generateLocalDiff = () => {
  const originalLines = originalCode.value.split('\n');
  const modifiedLines = modifiedCode.value.split('\n');
  
  const added = [];
  const removed = [];
  const unchanged = [];
  
  const m = originalLines.length;
  const n = modifiedLines.length;
  
  const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (originalLines[i - 1] === modifiedLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  let i = m, j = n;
  let lineNumber = 1;
  
  while (i > 0 && j > 0) {
    if (originalLines[i - 1] === modifiedLines[j - 1]) {
      unchanged.push({ lineNumber: lineNumber++, content: originalLines[i - 1] });
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      removed.push({ lineNumber: lineNumber++, content: originalLines[i - 1] });
      i--;
    } else {
      added.push({ lineNumber: lineNumber++, content: modifiedLines[j - 1] });
      j--;
    }
  }
  
  while (i > 0) {
    removed.push({ lineNumber: lineNumber++, content: originalLines[i - 1] });
    i--;
  }
  
  while (j > 0) {
    added.push({ lineNumber: lineNumber++, content: modifiedLines[j - 1] });
    j--;
  }
  
  added.sort((a, b) => a.lineNumber - b.lineNumber);
  removed.sort((a, b) => a.lineNumber - b.lineNumber);
  unchanged.sort((a, b) => a.lineNumber - b.lineNumber);
const totalLines = Math.max(originalLines.length, modifiedLines.length);
  const changePercentage = totalLines > 0 ? Math.round(((added.length + removed.length) / totalLines) * 100) : 0;
  
  const stats = {
    added: added.length,
    removed: removed.length,
    unchanged: unchanged.length,
    total: totalLines,
    changePercentage: changePercentage,
    summary: `${added.length} lines added, ${removed.length} lines removed (${changePercentage}% changed)`
  };
  
  return { 
    diff: { added, removed, unchanged }, 
    stats 
  };
};

onMounted(() => {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  handleOriginalInput();
  handleModifiedInput();
});
</script>

<style scoped>
.code-diff-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  transition: background 0.3s ease;
}

[data-theme="dark"] .code-diff-page {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
}

.page-header {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 24px 0;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  border-radius: 10px;
}

[data-theme="dark"] .page-header {
  background: #1e293b;
  border-bottom-color: #334155;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.header-info {
  flex: 1;
  min-width: 0;
}

.page-title {
  font-size: 1.7rem;
  font-weight: 300;
  color: #1e293b;
  margin: 0 0 8px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

[data-theme="dark"] .page-title {
  color: #f1f5f9;
  -webkit-text-fill-color: #f1f5f9;
}

.page-subtitle {
  font-size: 1rem;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
}

[data-theme="dark"] .page-subtitle {
  color: #94a3b8;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.action-button {
  width: 44px;
  height: 44px;
  background: #f1f5f9;
  border: none;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #475569;
}

[data-theme="dark"] .action-button {
  background: #334155;
  color: #cbd5e1;
}

.action-button:hover {
  background: #e2e8f0;
  transform: translateY(-2px);
}

[data-theme="dark"] .action-button:hover {
  background: #475569;
}

.action-button svg {
  width: 20px;
  height: 20px;
}

.page-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px 60px;
}

.error-message {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
}

[data-theme="dark"] .error-message {
  background: #422626;
  border-color: #7f1d1d;
  color: #fca5a5;
}

.error-message svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.controls {
  display: flex;
  gap: 16px;
  margin-bottom: 32px;
  flex-wrap: wrap;
}

.compare-button {
  padding: 12px 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.compare-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.compare-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.clear-button {
  padding: 12px 32px;
  background: #f1f5f9;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  color: #475569;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

[data-theme="dark"] .clear-button {
  background: #334155;
  border-color: #475569;
  color: #cbd5e1;
}

.clear-button:hover {
  background: #e2e8f0;
  transform: translateY(-2px);
}

[data-theme="dark"] .clear-button:hover {
  background: #475569;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Editors Section */
.editors-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  margin-bottom: 32px;
}

@media (max-width: 768px) {
  .editors-section {
    grid-template-columns: 1fr;
  }
  .page-content{
    padding-inline: 10px;
  }
  .code-input{
    padding: 10px 0px 0px 60px !important;  }
}

.editor-container {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

[data-theme="dark"] .editor-container {
  background: #1e293b;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #f8fafc;
  border-bottom: 2px solid #e2e8f0;
}

[data-theme="dark"] .editor-header {
  background: #0f172a;
  border-bottom-color: #334155;
}

.editor-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

[data-theme="dark"] .editor-title {
  color: #f1f5f9;
}

.diff-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.875rem;
  color: #64748b;
}

[data-theme="dark"] .diff-indicator {
  color: #94a3b8;
}

.change-start {
  color: #f59e0b;
  font-weight: 500;
  background: rgba(245, 158, 11, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
  border-left: 3px solid #f59e0b;
}

[data-theme="dark"] .change-start {
  color: #fbbf24;
  background: rgba(245, 158, 11, 0.2);
}

.removed-marker {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: #ef4444;
  color: white;
  border-radius: 4px;
  font-weight: bold;
}

.added-marker {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: #10b981;
  color: white;
  border-radius: 4px;
  font-weight: bold;
}

/* Code Editor Wrapper */
.code-editor-wrapper {
  position: relative;
  height: 500px;
  overflow: auto;
  background: white;
}

[data-theme="dark"] .code-editor-wrapper {
  background: white;
}

/* Code Display Layer */
.code-display {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  min-height: 100%;
  pointer-events: none;
  z-index: 1;
  display: flex;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 24px;
}

/* Line Numbers */
.line-numbers {
  width: 50px;
  background: #f8fafc;
  border-right: 2px solid #e2e8f0;
  user-select: none;
  flex-shrink: 0;
  padding-top: 10px;
}

[data-theme="dark"] .line-numbers {
  background: #0f172a;
  border-right-color: #334155;
  color: #94a3b8;
}

.line-number {
  color: #64748b;
  height: 24px;
  line-height: 24px;
  padding-right: 8px;
  text-align: right;
}

[data-theme="dark"] .line-number {
  color: #94a3b8;
}

.line-number.first-change {
  color: #f59e0b;
  font-weight: 700;
  background: rgba(245, 158, 11, 0.1);
  border-left: 3px solid #f59e0b;
  padding-left: 5px;
}

/* Code Content */
.code-content {
  flex: 1;
  padding: 10px 16px;
  padding-left: 20px;
  overflow-x: auto;
}

.code-line {
  height: 24px;
  display: flex;
  align-items: center;
  white-space: pre;
  font-family: inherit;
  font-size: inherit;
  border-left: 3px solid transparent;
  padding-left: 8px;
  margin-left: -8px;
}

/* Removed Lines - RED TEXT */
.code-line.removed {
  background: rgba(239, 68, 68, 0.05);
  border-left-color: #ef4444;
  color: #ef4444 !important;
}

.code-line.removed .line-text {
  color: #ef4444 !important;
  font-weight: 500;
}

/* Added Lines - GREEN TEXT */
.code-line.added {
  background: rgba(16, 185, 129, 0.05);
  border-left-color: #10b981;
  color: #10b981 !important;
}

.code-line.added .line-text {
  color: #10b981 !important;
  font-weight: 500;
}

/* First Change Line - AMBER HIGHLIGHT */
.code-line.first-change {
  background: rgba(245, 158, 11, 0.15) !important;
  border-left-color: #f59e0b !important;
  border-left-width: 5px;
  animation: pulse 2s infinite;
}

.code-line.first-change .line-text {
  color: inherit;
  font-weight: 600;
}

/* Unchanged Lines - Normal Text */
.code-line.unchanged {
  color: inherit;
}

.code-line.unchanged .line-text {
  color: inherit;
}

/* Context Lines - Normal Text */
.code-line.context {
  color: inherit;
}

.code-line.context .line-text {
  color: inherit;
}

@keyframes pulse {
  0%, 100% {
    background-color: rgba(245, 158, 11, 0.15);
  }
  50% {
    background-color: rgba(245, 158, 11, 0.25);
  }
}

.git-marker {
  width: 20px;
  text-align: center;
  font-weight: bold;
  margin-right: 8px;
  user-select: none;
  flex-shrink: 0;
}

.code-line.removed .git-marker {
  color: #ef4444;
}

.code-line.added .git-marker {
  color: #10b981;
}

.code-line.first-change .git-marker {
  color: #f59e0b;
  font-weight: 900;
}

.line-text {
  flex: 1;
  white-space: pre;
  overflow-x: visible;
  font-family: inherit;
}

/* Invisible Textarea Input */
.code-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  padding: 10px 16px 10px 70px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 24px;
  border: none;
  resize: none;
  color: transparent !important;
  caret-color: #1e293b;
  overflow-wrap: normal;
  overflow-x: auto;
  outline: none;
}

[data-theme="dark"] .code-input {
  caret-color: #cbd5e1;
}

.code-input::placeholder {
  color: #94a3b8 !important;
  opacity: 0.7;
}

[data-theme="dark"] .code-input::placeholder {
  color: #94a3b8 !important;
}

/* Make selection visible */
.code-input::selection {
  background: rgba(59, 130, 246, 0.3) !important;
}

[data-theme="dark"] .code-input::selection {
  background: rgba(59, 130, 246, 0.5) !important;
}

/* Statistics */
.stats-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

[data-theme="dark"] .stats-section {
  background: #1e293b;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 4px;
  line-height: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: #64748b;
}

[data-theme="dark"] .stat-label {
  color: #94a3b8;
}

.stat-summary {
  font-size: 0.9rem;
  color: #475569;
  text-align: center;
  padding: 12px;
  background: #f1f5f9;
  border-radius: 8px;
}

[data-theme="dark"] .stat-summary {
  background: #334155;
  color: #cbd5e1;
}

.first-change-info {
  color: #f59e0b;
  font-weight: 500;
  margin-left: 12px;
}

[data-theme="dark"] .first-change-info {
  color: #fbbf24;
}

/* Quick Test */
.quick-test {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

[data-theme="dark"] .quick-test {
  background: #1e293b;
}

.quick-test-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 16px 0;
}

[data-theme="dark"] .quick-test-title {
  color: #f1f5f9;
}

.quick-test-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.test-button {
  padding: 10px 20px;
  background: #f1f5f9;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #475569;
  cursor: pointer;
  transition: all 0.3s ease;
}

[data-theme="dark"] .test-button {
  background: #334155;
  border-color: #475569;
  color: #94a3b8;
}

.test-button:hover {
  background: #e2e8f0;
  border-color: #c7d2fe;
  color: #4f46e5;
}

[data-theme="dark"] .test-button:hover {
  background: #475569;
  border-color: #4f46e5;
  color: #c7d2fe;
}

/* Responsive Design */
@media (max-width: 768px) {
  .header-content {
    align-items: flex-start;
  }
  
  .controls {
    flex-direction: column;
  }
  
  .compare-button,
  .clear-button {
    width: 100%;
    justify-content: center;
  }
  
  .editor-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  
  .code-editor-wrapper {
    height: 400px;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .quick-test-buttons {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 1.5rem;
  }
  
  .page-subtitle {
    font-size: 0.875rem;
  }
  .code-editor-wrapper {
    height: 350px;
  }
}
</style>