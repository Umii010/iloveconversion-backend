<template>
  <div class="video-downloader-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">Video Downloader</h1>
        <p class="page-subtitle">
          Download videos from YouTube, Instagram Reels, Facebook, TikTok, and more
        </p>
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

      <!-- Success Message -->
      <div v-if="success" class="success-message">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
        <span>{{ success }}</span>
      </div>

      <!-- Progress Bar -->
      <div v-if="showProgress && !privateVideoError" class="progress-section">
        <div class="progress-container">
          <div class="progress-header">
            <h3>{{ progressTitle }}</h3>
            <span class="progress-percentage">{{ Math.round(progress) }}%</span>
          </div>
          
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: progress + '%' }"
              :class="{ 'indeterminate': progress === 100 && progressIndeterminate }"
            ></div>
          </div>
          
          <div class="progress-details">
            <span class="progress-status">{{ progressStatus }}</span>
            <span class="progress-time">{{ elapsedTime }}s</span>
          </div>
          
          <button 
            v-if="progress < 100" 
            class="cancel-button" 
            @click="cancelOperation"
          >
            Cancel
          </button>
        </div>
      </div>

      <!-- Private Video Error -->
      <div v-if="privateVideoError" class="private-video-error">
        <div class="private-error-content">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
          </svg>
          <div>
            <h3>Private or Restricted Video</h3>
            <p>{{ privateVideoError }}</p>
            <p class="private-note">This video requires special permissions or login to access.</p>
          </div>
        </div>
      </div>

      <!-- Video URL Input -->
      <div class="input-section">
        <div class="input-container">
          <div class="input-header">
            <h3>Paste Video URL</h3>
            <p>Supported: YouTube, Instagram Reels, Facebook, TikTok, Twitter, and more...</p>
          </div>
          
          <div class="url-input-container">
            <div class="url-input-wrapper">
              <input
                v-model="videoUrl"
                type="text"
                placeholder="Paste ANY public video URL here..."
                class="url-input"
                @keyup.enter="fetchVideoInfo"
                @input="onUrlInput"
                @paste="handlePaste"
                :disabled="loading || downloading"
              />
              <button 
                class="fetch-button" 
                @click="fetchVideoInfo" 
                :disabled="loading || !videoUrl.trim() || downloading"
              >
                <span v-if="loading" class="loading-spinner small"></span>
                <span v-else>Fetch Video</span>
              </button>
            </div>
            
            <div class="input-status" v-if="urlStatus">
              <span class="status-text" :class="urlStatus.type">{{ urlStatus.text }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Video Info Display -->
      <div v-if="videoInfo && !privateVideoError" class="video-info-section">
        <div class="video-preview">
          <div class="video-thumbnail" v-if="videoInfo.thumbnail">
            <img :src="videoInfo.thumbnail" :alt="videoInfo.title" class="thumbnail-img" />
            <div class="video-duration" v-if="videoInfo.duration">
              {{ formatDuration(videoInfo.duration) }}
            </div>
            <div class="video-platform-badge">
              {{ videoInfo.platform?.toUpperCase() || selectedPlatform.toUpperCase() }}
            </div>
          </div>
          
          <div class="video-details">
            <h3 class="video-title">{{ videoInfo.title || 'Video' }}</h3>
            
            <div class="video-meta">
              <div class="meta-item" v-if="videoInfo.author">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
                <span>{{ videoInfo.author }}</span>
              </div>
              
              <div class="meta-item" v-if="videoInfo.views">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
                </svg>
                <span>{{ formatNumber(videoInfo.views) }} views</span>
              </div>

              <div class="meta-item">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8s8 3.58 8 8-3.58 8-8 8-8-3.58-8-8z"/>
                </svg>
                <span>{{ selectedPlatform.toUpperCase() }}</span>
              </div>
            </div>
            
            <div class="url-display">
              <small>URL: {{ truncateUrl(videoUrl, 60) }}</small>
            </div>
          </div>
        </div>

        <!-- Quality Options - ONLY 2 FORMATS -->
        <div class="quality-section" v-if="videoInfo.formats && videoInfo.formats.length > 0">
          <h3 class="section-title">Download Options</h3>
          <p class="section-subtitle">Select your preferred quality to download:</p>
          
          <div class="quality-grid" :class="{'two-formats': videoInfo.formats.length === 2}">
            <div 
              v-for="(format, index) in videoInfo.formats.slice(0, 2)" 
              :key="format.formatId || format.quality"
              class="quality-card"
              :class="{ 
                'selected': selectedFormat === format.formatId,
                'best-quality': index === 0,
                'good-quality': index === 1
              }"
              @click="selectFormat(format.formatId)"
            >
              <div class="quality-header">
                <div class="quality-type">
                  <span class="quality-badge" :class="format.type">{{ format.type.toUpperCase() }}</span>
                  <span class="quality-label">{{ format.quality }}</span>
                  <span v-if="index === 0" class="recommended-badge">Recommended</span>
                </div>
                <div class="quality-size">{{ format.size }}</div>
              </div>
              
              <div class="quality-details">
                <div class="detail-item">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 9H3V5h9v7z"/>
                  </svg>
                  <span>{{ format.resolution || 'N/A' }}</span>
                </div>
                
                <div class="detail-item" v-if="format.fps && format.fps !== 'N/A' && selectedPlatform === 'youtube'">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                  </svg>
                  <span>{{ format.fps }} fps</span>
                </div>

                <div class="detail-item" v-if="format.bitrate && format.bitrate !== 'N/A' && selectedPlatform === 'youtube'">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-8 12H9v-2h2v2zm0-4H9V7h2v4zm4 4h-2v-2h2v2zm0-4h-2V7h2v4z"/>
                  </svg>
                  <span>{{ format.bitrate }}</span>
                </div>
              </div>
              
              <button 
                class="download-quality-btn"
                :class="{ 'best-btn': index === 0, 'good-btn': index === 1 }"
                @click.stop="downloadVideo(format)"
                :disabled="downloading"
              >
                <span v-if="downloading && selectedFormat === format.formatId" class="loading-spinner small"></span>
                <span v-else>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                  </svg>
                  {{ index === 0 ? 'Download Best' : 'Download Good' }}
                </span>
              </button>
            </div>
          </div>
          
          <!-- Note about limited formats -->
          <div class="formats-note" v-if="videoInfo.formats.length === 1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <span>Only one quality option is available for this video.</span>
          </div>
        </div>

        <!-- Platform-specific note -->
        <div class="platform-note" v-if="selectedPlatform !== 'youtube' && videoInfo">
          <div class="note-content">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <div>
              <strong>Note:</strong> {{ selectedPlatform.toUpperCase() }} download support is limited. 
              <span v-if="selectedPlatform === 'instagram'">Some Instagram videos may require authentication.</span>
              <span v-if="selectedPlatform === 'facebook'">Facebook videos may have download restrictions.</span>
              <span v-if="selectedPlatform === 'tiktok'">TikTok videos are downloaded without watermark when possible.</span>
              <span v-if="videoInfo.note">{{ videoInfo.note }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Features -->
      <div class="features-section">
        <h2 class="section-title">Features</h2>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon youtube">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z"/>
              </svg>
            </div>
            <h3>YouTube Full Support</h3>
            <p>Download any YouTube video, short, or playlist in multiple qualities</p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon instagram">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/>
              </svg>
            </div>
            <h3>Instagram Reels</h3>
            <p>Download Instagram Reels, Stories, and posts (when available)</p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon facebook">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 0 0 8.44-9.9c0-5.53-4.5-10.02-10-10.02z"/>
              </svg>
            </div>
            <h3>Facebook Videos</h3>
            <p>Download Facebook videos, reels, and watch content</p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon tiktok">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
              </svg>
            </div>
            <h3>TikTok Videos</h3>
            <p>Download TikTok videos with or without watermark</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import axios from 'axios'

const API_BASE_URL = 'http://192.168.18.101:3000/api/video-downloader'

// =====================
// STATE
// =====================
const videoUrl = ref('')
const selectedPlatform = ref('youtube')
const autoDetectedPlatform = ref('')
const loading = ref(false)
const downloading = ref(false)
const videoInfo = ref(null)
const selectedFormat = ref(null)
const error = ref('')
const success = ref('')
const urlStatus = ref(null)
const privateVideoError = ref('')

// Progress tracking
const showProgress = ref(false)
const progress = ref(0)
const progressTitle = ref('')
const progressStatus = ref('')
const elapsedTime = ref(0)
const progressIndeterminate = ref(false)
const progressInterval = ref(null)
const cancelController = ref(null)

// =====================
// PLATFORMS
// =====================
const platforms = [
  { id: 'youtube', name: 'YouTube' },
  { id: 'instagram', name: 'Instagram' },
  { id: 'facebook', name: 'Facebook' },
  { id: 'tiktok', name: 'TikTok' },
  { id: 'twitter', name: 'Twitter' },
  { id: 'other', name: 'Other' }
]

// Platform icons mapping
const getPlatformIcon = (platformId) => {
  const icons = {
    youtube: 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png',
    instagram: 'https://cdn-icons-png.flaticon.com/512/2111/2111463.png',
    facebook: 'https://cdn-icons-png.flaticon.com/512/124/124010.png',
    tiktok: 'https://cdn-icons-png.flaticon.com/512/3046/3046126.png',
    twitter: 'https://cdn-icons-png.flaticon.com/512/733/733579.png',
    other: 'https://cdn-icons-png.flaticon.com/512/1006/1006771.png'
  }
  return icons[platformId] || icons.other
}

// =====================
// HELPERS
// =====================
const detectPlatformFromUrl = (url) => {
  if (!url) return ''

  const u = url.toLowerCase()
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube'
  if (u.includes('instagram.com')) return 'instagram'
  if (u.includes('facebook.com')) return 'facebook'
  if (u.includes('tiktok.com')) return 'tiktok'
  if (u.includes('twitter.com') || u.includes('x.com')) return 'twitter'
  return ''
}

const updateUrlStatus = () => {
  if (!videoUrl.value.trim()) {
    urlStatus.value = null
    return
  }

  const detected = detectPlatformFromUrl(videoUrl.value)
  if (detected) {
    urlStatus.value = {
      type: 'success',
      text: `✓ Detected ${detected.toUpperCase()} video`
    }
  } else {
    urlStatus.value = {
      type: 'info',
      text: '✓ URL entered. Trying generic video...'
    }
  }
}

const formatDuration = (seconds) => {
  if (!seconds) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatNumber = (num) => {
  if (!num) return '0'
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

const truncateUrl = (url, maxLength) => {
  if (!url) return ''
  if (url.length <= maxLength) return url
  return url.substring(0, maxLength) + '...'
}

// =====================
// PROGRESS MANAGEMENT
// =====================
const startProgressTimer = () => {
  elapsedTime.value = 0
  if (progressInterval.value) {
    clearInterval(progressInterval.value)
  }
  progressInterval.value = setInterval(() => {
    elapsedTime.value++
  }, 1000)
}

const stopProgressTimer = () => {
  if (progressInterval.value) {
    clearInterval(progressInterval.value)
    progressInterval.value = null
  }
}

const updateProgress = (title, status, value, indeterminate = false) => {
  showProgress.value = true
  progressTitle.value = title
  progressStatus.value = status
  progress.value = Math.min(Math.max(value, 0), 100)
  progressIndeterminate.value = indeterminate
}

const hideProgress = () => {
  showProgress.value = false
  progress.value = 0
  progressTitle.value = ''
  progressStatus.value = ''
  stopProgressTimer()
}

const cancelOperation = () => {
  if (cancelController.value) {
    cancelController.value.abort()
  }
  hideProgress()
  loading.value = false
  downloading.value = false
  error.value = 'Operation cancelled by user'
}

// =====================
// EVENTS
// =====================
const onUrlInput = () => {
  error.value = ''
  success.value = ''
  privateVideoError.value = ''
  videoInfo.value = null
  selectedFormat.value = null
  hideProgress()

  const detected = detectPlatformFromUrl(videoUrl.value)
  autoDetectedPlatform.value = detected
  selectedPlatform.value = detected || 'other'

  updateUrlStatus()
}

const selectPlatform = (platform) => {
  selectedPlatform.value = platform
  autoDetectedPlatform.value = ''
}

const loadExample = (url) => {
  videoUrl.value = url
  onUrlInput()
}

const selectFormat = (formatId) => {
  selectedFormat.value = formatId
}

// =====================
// API CALLS
// =====================
const fetchVideoInfo = async () => {
  if (!videoUrl.value.trim()) {
    error.value = 'Please enter a video URL'
    return
  }

  if (loading.value) return

  // Reset all states
  loading.value = true
  error.value = ''
  success.value = ''
  privateVideoError.value = ''
  videoInfo.value = null
  selectedFormat.value = null

  // Setup progress tracking
  updateProgress('Fetching Video Info', 'Connecting to service...', 10)
  startProgressTimer()
  
  // Setup cancel controller
  cancelController.value = new AbortController()

  try {
    const response = await axios.post(
      `${API_BASE_URL}/info`,
      {
        url: videoUrl.value.trim(),
        platform: selectedPlatform.value
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 20000, // 20 second timeout
        signal: cancelController.value.signal
      }
    )

    updateProgress('Fetching Video Info', 'Processing data...', 80)

    if (!response.data?.success) {
      throw new Error(response.data?.error || 'Failed to fetch video info')
    }

    videoInfo.value = response.data.videoInfo
    
    // Check if we got actual video info or just placeholder
    if (videoInfo.value.title === 'Video' && 
        videoInfo.value.formats?.[0]?.size === 'Unknown' &&
        selectedPlatform.value !== 'other') {
      // This is fine for non-YouTube platforms
      if (selectedPlatform.value !== 'youtube') {
        // For Instagram/Facebook/TikTok, show limited info is OK
        updateProgress('Fetching Video Info', 'Complete!', 100)
        setTimeout(() => {
          success.value = 'Video information fetched successfully'
          hideProgress()
          
          if (videoInfo.value.formats?.length) {
            selectedFormat.value = videoInfo.value.formats[0].formatId
          }
        }, 500)
      } else {
        // For YouTube, we should have proper info
        hideProgress()
        error.value = 'Could not fetch detailed video information. The video might be private or restricted.'
      }
    } else {
      // Success case
      updateProgress('Fetching Video Info', 'Complete!', 100)
      setTimeout(() => {
        success.value = '✓ Video information fetched successfully'
        hideProgress()
        
        if (videoInfo.value.formats?.length) {
          selectedFormat.value = videoInfo.value.formats[0].formatId
        }
      }, 500)
    }
  } catch (err) {
    hideProgress()
    
    // Check for private/restricted video error
    if (err.response?.status === 403 || 
        err.message?.includes('private') || 
        err.message?.includes('restricted') ||
        err.message?.includes('login') ||
        err.response?.data?.error?.includes('private') ||
        err.response?.data?.error?.includes('restricted')) {
      
      privateVideoError.value = err.response?.data?.error || err.message || 'This video is private or restricted.'
      videoInfo.value = null
      selectedFormat.value = null
      
    } else if (err.name === 'CanceledError' || err.name === 'AbortError') {
      error.value = 'Request cancelled'
    } else if (err.code === 'ECONNABORTED') {
      error.value = 'Request timeout. Please try again.'
    } else if (err.response?.status === 404) {
      error.value = 'Video not found. Please check the URL.'
    } else {
      error.value = err.response?.data?.error || err.message || 'Unable to fetch video information.'
    }
  } finally {
    loading.value = false
    cancelController.value = null
  }
}

// =====================
// DOWNLOAD
// =====================
const downloadVideo = async (format) => {
  if (downloading.value) return

  downloading.value = true
  error.value = ''
  success.value = ''
  privateVideoError.value = ''

  // Setup progress tracking
  updateProgress('Downloading Video', 'Preparing download...', 5, true)
  startProgressTimer()
  
  // Setup cancel controller
  cancelController.value = new AbortController()

  try {
    const response = await axios.post(
      `${API_BASE_URL}/download`,
      {
        url: videoUrl.value,
        quality: format.quality,
        format: format.type,
        formatId: format.formatId,
        platform: selectedPlatform.value
      },
      {
        responseType: 'blob',
        timeout: 300000, // 5 minutes
        signal: cancelController.value.signal,
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentComplete = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            updateProgress(
              'Downloading Video', 
              `Downloading: ${formatBytes(progressEvent.loaded)} / ${formatBytes(progressEvent.total)}`,
              percentComplete
            )
          } else {
            updateProgress(
              'Downloading Video',
              `Downloading: ${formatBytes(progressEvent.loaded)}`,
              50,
              true
            )
          }
        }
      }
    )

    updateProgress('Downloading Video', 'Creating file...', 95)

    const blob = new Blob([response.data])
    const url = window.URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    
    // Create better filename
    const title = videoInfo.value.title || 'video'
    const cleanTitle = title.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_')
    link.download = `${cleanTitle}_${format.quality}.${format.type === 'audio' ? 'mp3' : 'mp4'}`
    link.click()

    window.URL.revokeObjectURL(url)

    updateProgress('Downloading Video', 'Download complete!', 100)
    setTimeout(() => {
      success.value = '✓ Download completed successfully'
      hideProgress()
    }, 1000)

  } catch (err) {
    hideProgress()
    
    if (err.name === 'CanceledError' || err.name === 'AbortError') {
      error.value = 'Download cancelled'
    } else if (err.code === 'ECONNABORTED') {
      error.value = 'Download timeout. The video might be too large or the connection is slow.'
    } else {
      error.value = err.response?.data?.error || 'Download failed. Please try again.'
    }
  } finally {
    downloading.value = false
    cancelController.value = null
  }
}

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const handlePaste = (event) => {
  const pastedText = event.clipboardData.getData('text')
  if (pastedText) {
    videoUrl.value = pastedText
    // Trigger detection after a short delay
    setTimeout(() => {
      onUrlInput()
    }, 100)
  }
}

// =====================
// CLEANUP
// =====================
onUnmounted(() => {
  stopProgressTimer()
  if (cancelController.value) {
    cancelController.value.abort()
  }
})
</script>

<style scoped>
    /* Base Styles */
.video-downloader-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}

/* Header */
.page-header {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 24px 0;
  text-align: center;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.page-title {
  font-size: 2.1rem;
  color: white;
  margin: 0 0 12px 0;
  background: gray;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-subtitle {
  font-size: 1.1rem;
  color: #64748b;
  margin: 0;
  line-height: 1.6;
}

/* Main Content */
.page-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px 60px;
}

/* Messages */
.error-message,
.success-message {
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.95rem;
}

.error-message {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
}

.success-message {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #16a34a;
}

.error-message svg,
.success-message svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

/* Input Section */
.input-section {
  background: white;
  border-radius: 20px;
  padding: 32px;
  margin-bottom: 32px;
  box-shadow: 0 4px 25px rgba(0, 0, 0, 0.08);
}

.input-header {
  text-align: center;
  margin-bottom: 32px;
}

.input-header h3 {
  font-size: 1.8rem;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.input-header p {
  color: #64748b;
  margin: 0;
}

/* Platform Icons */
.platform-icons {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.platform-icon {
  position: relative;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: white;
  border: 2px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 8px;
}

.platform-icon:hover {
  transform: translateY(-2px);
  border-color: #c7d2fe;
}


.platform-icon.auto .platform-img {
  border: 2px solid #10b981;
}

.auto-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #10b981;
  color: white;
  font-size: 0.6rem;
  padding: 1px 4px;
  border-radius: 4px;
  font-weight: bold;
  z-index: 2;
}

.platform-img {
  width: 24px;
  height: 24px;
  filter: brightness(0.7);
}

.platform-icon.active .platform-img {
  filter: brightness(0) invert(1);
}

/* URL Input */
.url-input-wrapper {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.url-input {
  flex: 1;
  padding: 16px 20px;
  font-size: 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
  color: #1e293b;
  transition: all 0.3s ease;
}

.url-input:focus {
  outline: none;
  background: white;
}

.url-input::placeholder {
  color: #94a3b8;
}

.fetch-button {
  padding: 0 32px;
  background: black;
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 140px;
  justify-content: center;
}

.fetch-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.fetch-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Input Status */
.input-status {
  text-align: center;
  margin-bottom: 20px;
  min-height: 24px;
}

.status-text {
  font-size: 0.9rem;
  font-weight: 500;
  padding: 4px 12px;
  border-radius: 20px;
  display: inline-block;
}

.status-text.success {
  background: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
}

.status-text.info {
  background: #eff6ff;
  color: #2563eb;
  border: 1px solid #bfdbfe;
}

.status-text.warning {
  background: #fffbeb;
  color: #d97706;
  border: 1px solid #fde68a;
}

/* Examples */
.examples {
  text-align: center;
}

.examples-title {
  color: #64748b;
  margin-bottom: 12px;
  font-size: 0.9rem;
}

.example-links {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.example-link {
  padding: 8px 16px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  color: #475569;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.example-link:hover {
  background: #e2e8f0;
  border-color: #c7d2fe;
  color: #4f46e5;
  transform: translateY(-1px);
}

/* Video Info */
.video-info-section {
  background: white;
  border-radius: 20px;
  padding: 32px;
  margin-bottom: 32px;
  box-shadow: 0 4px 25px rgba(0, 0, 0, 0.08);
  animation: slideUp 0.3s ease-out;
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

.video-preview {
  display: flex;
  gap: 24px;
  margin-bottom: 32px;
  padding-bottom: 32px;
  border-bottom: 2px solid #f1f5f9;
}

@media (max-width: 768px) {
  .video-preview {
    flex-direction: column;
  }
}

.video-thumbnail {
  position: relative;
  flex-shrink: 0;
  width: 300px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.thumbnail-img {
  width: 100%;
  height: 170px;
  object-fit: cover;
  display: block;
}

.video-duration {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

.video-platform-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(79, 70, 229, 0.9);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
}

.video-details {
  flex: 1;
}

.video-title {
  font-size: 1.5rem;
  color: #1e293b;
  margin: 0 0 16px 0;
  line-height: 1.4;
}

.video-meta {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #64748b;
  font-size: 0.95rem;
}

.meta-item svg {
  width: 18px;
  height: 18px;
  color: #94a3b8;
}

.url-display {
  margin-top: 12px;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 6px;
  border-left: 3px solid #c7d2fe;
}

.url-display small {
  color: #64748b;
  word-break: break-all;
}

/* Quality Section */
.section-title {
  font-size: 1.5rem;
  color: #1e293b;
  margin: 0 0 24px 0;
}

.section-subtitle {
  color: #64748b;
  margin: 0 0 24px 0;
  font-size: 0.95rem;
}

.quality-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.quality-card {
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.quality-card:hover {
  border-color: #c7d2fe;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.quality-card.selected {
  border-color: #4f46e5;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
}

.quality-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.quality-type {
  display: flex;
  align-items: center;
  gap: 8px;
}

.quality-badge {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 700;
  color: white;
}

.quality-badge.video {
  background: #3b82f6;
}

.quality-badge.audio {
  background: #10b981;
}

.quality-label {
  font-weight: 600;
  color: #1e293b;
}

.quality-size {
  font-weight: 600;
  color: #4f46e5;
}

.quality-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: #64748b;
}

.detail-item svg {
  width: 16px;
  height: 16px;
  color: #94a3b8;
}

.download-quality-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.download-quality-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.download-quality-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Bulk Download */
.bulk-download {
  text-align: center;
  padding-top: 24px;
  border-top: 2px solid #f1f5f9;
}

.bulk-download-btn {
  padding: 14px 28px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 12px;
}

.bulk-download-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.bulk-download-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.bulk-download-btn svg {
  width: 20px;
  height: 20px;
}

/* Platform Note */
.platform-note {
  margin-top: 24px;
  padding: 16px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 12px;
  color: #92400e;
}

.note-content {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.note-content svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  color: #d97706;
}

.note-content div {
  flex: 1;
  font-size: 0.9rem;
  line-height: 1.5;
}

.note-content strong {
  color: #92400e;
}

/* Features */
.features-section {
  background: white;
  border-radius: 20px;
  padding: 32px;
  margin-bottom: 32px;
  box-shadow: 0 4px 25px rgba(0, 0, 0, 0.08);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  margin-top: 32px;
}

.feature-card {
  text-align: center;
  padding: 24px;
  background: #f8fafc;
  border-radius: 16px;
  transition: all 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.feature-icon {
  width: 60px;
  height: 60px;
  margin: 0 auto 20px;
  background: white;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: black;
}

.feature-icon svg {
  width: 28px;
  height: 28px;
}

.feature-icon.other {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
}

.feature-card h3 {
  font-size: 1.2rem;
  color: #1e293b;
  margin: 0 0 12px 0;
}

.feature-card p {
  color: #64748b;
  margin: 0;
  line-height: 1.6;
  font-size: 0.95rem;
}

/* Loading Spinner */
.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.8s linear infinite;
}

.loading-spinner.small {
  width: 16px;
  height: 16px;
  border-width: 2px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Dark Theme Support */
@media (prefers-color-scheme: dark) {
  .page-title,
  .input-header h3,
  .video-title,
  .section-title,
  .quality-label,
  .step-content h3,
  .feature-card h3 {
    color: gray;
  }
  
  .page-subtitle,
  .input-header p,
  .examples-title,
  .meta-item,
  .detail-item,
  .feature-card p,
  .step-content p {
    color: #94a3b8;
  }
  
  .url-input,
  .quality-card,
  .feature-card {
    color: #cbd5e1;
  }
  
  
  .example-link {
    background: #334155;
    border-color: #475569;
    color: #cbd5e1;
  }
  
  .platform-img {
    filter: brightness(0.8) invert(0.2);
  }
  
  .platform-icon.active .platform-img {
    filter: brightness(0) invert(1);
  }
  
  .video-preview,
  .bulk-download {
    border-color: #334155;
  }
  
  .status-text.success {
    background: #064e3b;
    color: #a7f3d0;
    border-color: #047857;
  }
  
  .status-text.info {
    background: #1e3a8a;
    color: #93c5fd;
    border-color: #1d4ed8;
  }
  
  .status-text.warning {
    background: #78350f;
    color: #fcd34d;
    border-color: #d97706;
  }
  
  .platform-note {
    background: #78350f;
    border-color: #92400e;
    color: #fde68a;
  }
  
  .note-content svg {
    color: #fbbf24;
  }
  
  .note-content strong {
    color: #fde68a;
  }
  
  .url-display {
    background: #0f172a;
    border-left-color: #4f46e5;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .page-title {
    font-size: 2rem;
  }
  
  .page-content,
  .input-section,
  .video-info-section,
  .features-section {
    padding: 24px 16px;
  }
  
  .quality-grid {
    grid-template-columns: 1fr;
  }
  
  .url-input-wrapper {
    flex-direction: column;
  }
  
  .fetch-button {
    min-width: 100%;
    padding: 16px;
  }
  
  .video-thumbnail {
    width: 100%;
  }
  
  .thumbnail-img {
    height: 200px;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
  }
  
  .platform-icons {
    gap: 12px;
  }
  
  .platform-icon {
    width: 48px;
    height: 48px;
  }
  
  .platform-img {
    width: 20px;
    height: 20px;
  }
  
  .example-links {
    flex-direction: column;
    align-items: center;
  }
  
  .example-link {
    width: 200px;
    max-width: 100%;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .quality-card,
  .feature-card,
  .fetch-button,
  .download-quality-btn,
  .bulk-download-btn,
  .example-link,
  .platform-icon {
    transition: none;
  }
  
  .video-info-section {
    animation: none;
  }
}

/* Focus styles for keyboard navigation */
.url-input:focus-visible,
.fetch-button:focus-visible,
.download-quality-btn:focus-visible,
.bulk-download-btn:focus-visible,
.example-link:focus-visible,
.platform-icon:focus-visible {
  outline: 1px solid gray;
 
}

/* Print Styles */
@media print {
  .fetch-button,
  .download-quality-btn,
  .bulk-download-btn,
  .example-link,
  .platform-icon {
    display: none;
  }
  
  .video-downloader-page {
    background: white !important;
  }
  
  .page-header,
  .input-section,
  .video-info-section,
  .features-section {
    background: white !important;
    border: 1px solid #ddd !important;
    box-shadow: none !important;
  }
  
  .page-title {
    color: gray !important;
    background: none !important;
    -webkit-text-fill-color: black !important;
  }
}
/* Add these styles for the progress bar */
.progress-section {
  margin: 20px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 20px;
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.progress-container {
  max-width: 600px;
  margin: 0 auto;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.progress-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.progress-percentage {
  font-size: 24px;
  font-weight: bold;
  background: rgba(255, 255, 255, 0.2);
  padding: 5px 15px;
  border-radius: 20px;
}

.progress-bar {
  height: 12px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4cd964, #5ac8fa);
  border-radius: 6px;
  transition: width 0.3s ease;
}

.progress-fill.indeterminate {
  background: linear-gradient(90deg, 
    #4cd964 25%, 
    #5ac8fa 50%, 
    #4cd964 75%);
  background-size: 200% 100%;
  animation: indeterminate 2s linear infinite;
}

@keyframes indeterminate {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.progress-details {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 15px;
}

.cancel-button {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.4);
  color: white;
  padding: 8px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  display: block;
  margin: 0 auto;
}

.cancel-button:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Private Video Error */
.private-video-error {
  margin: 20px 0;
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 12px;
  padding: 24px;
  color: #92400e;
}

.private-error-content {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.private-error-content svg {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  color: #d97706;
}

.private-error-content h3 {
  margin: 0 0 8px 0;
  font-size: 1.2rem;
  color: #92400e;
}

.private-error-content p {
  margin: 0 0 8px 0;
  line-height: 1.5;
}

.private-note {
  font-size: 0.9rem;
  opacity: 0.8;
  margin-top: 12px !important;
  padding-top: 12px;
  border-top: 1px solid rgba(146, 64, 14, 0.2);
}

/* Loading spinner styles */
.loading-spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s ease-in-out infinite;
}

.loading-spinner.small {
  width: 16px;
  height: 16px;
  border-width: 2px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Disabled states */
.fetch-button:disabled,
.example-link:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.url-input:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Platform icons improvements */
.platform-img {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.auto-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #4cd964;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: bold;
}

/* Add these styles to the existing CSS */
.quality-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.quality-card {
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.quality-card:hover {
  border-color: #c7d2fe;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.quality-card.selected {
  border-color: #4f46e5;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
}

.quality-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.quality-type {
  display: flex;
  align-items: center;
  gap: 8px;
}

.quality-badge {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 700;
  color: white;
}

.quality-badge.video {
  background: #3b82f6;
}

.quality-label {
  font-weight: 600;
  color: #1e293b;
  font-size: 1.1rem;
}

.quality-size {
  font-weight: 600;
  color: #4f46e5;
  font-size: 1rem;
}

.quality-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: #64748b;
}

.detail-item svg {
  width: 16px;
  height: 16px;
  color: #94a3b8;
}

.download-quality-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.download-quality-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.download-quality-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.section-subtitle {
  color: #64748b;
  margin: 0 0 24px 0;
  font-size: 0.95rem;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .quality-grid {
    grid-template-columns: 1fr;
  }
  
  .private-error-content {
    flex-direction: column;
    text-align: center;
  }
  
  .private-error-content svg {
    margin: 0 auto;
  }
}
</style>