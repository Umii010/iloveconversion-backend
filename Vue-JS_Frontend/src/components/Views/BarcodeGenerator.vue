<template>
  <div class="barcode-generator-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-info">
          <h1 class="page-title">
            <svg class="title-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2 6h4v12H2zm6 0h4v12H8zm6 0h4v12h-4zm6 0h4v12h-4z"/>
            </svg>
            Barcode & QR Code Generator
          </h1>
          <p class="page-subtitle">
            Generate professional barcodes and QR codes for products, events, contacts, and more
          </p>
        </div>
        <div class="header-actions">
          <button class="action-button" @click="toggleTheme">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>
            </svg>
          </button>
          <button class="action-button" @click="toggleFullscreen">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Tool Categories -->
      <div class="tool-categories">
        <button 
          v-for="category in categories" 
          :key="category.id"
          class="category-tab"
          :class="{ active: activeCategory === category.id }"
          @click="activeCategory = category.id"
        >
          <svg class="category-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path :d="category.icon"/>
          </svg>
          <span class="category-label">{{ category.label }}</span>
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="page-content">
      <!-- Simple Barcode Generator -->
      <div v-if="activeCategory === 'simple'" class="tools-section">
        <div class="section-header">
          <h2 class="section-title">
            <svg class="section-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2 6h4v12H2zm6 0h4v12H8zm6 0h4v12h-4zm6 0h4v12h-4z"/>
            </svg>
            Simple Barcode Generator
          </h2>
          <p class="section-description">
            Generate standard barcodes for any text or number
          </p>
        </div>

        <div class="generator-card">
          <div class="generator-body">
            <!-- Input Section -->
            <div class="input-section">
              <div class="input-group">
                <label class="input-label">Barcode Content</label>
                <textarea 
                  v-model="simpleBarcode.text"
                  class="code-editor"
                  placeholder="Enter text or numbers for barcode (e.g., 123456789012)"
                  rows="3"
                  spellcheck="false"
                ></textarea>
                <div class="character-count">
                  {{ simpleBarcode.text.length }} characters
                </div>
              </div>

              <!-- Barcode Options -->
              <div class="options-grid">
                <div class="option-group">
                  <label class="option-label">Barcode Type</label>
                  <select v-model="simpleBarcode.type" class="option-select">
                    <option value="code128">CODE128 (Recommended)</option>
                    <option value="code39">CODE39</option>
                    <option value="ean13">EAN-13</option>
                    <option value="ean8">EAN-8</option>
                    <option value="upc">UPC</option>
                    <option value="itf14">ITF-14</option>
                    <option value="codabar">Codabar</option>
                    <option value="pharmacode">Pharmacode</option>
                  </select>
                </div>

                <div class="option-group">
                  <label class="option-label">Size Scale</label>
                  <div class="range-input">
                    <input 
                      type="range" 
                      v-model="simpleBarcode.scale" 
                      min="1" 
                      max="5" 
                      step="0.5"
                      class="range-slider"
                    >
                    <span class="range-value">{{ simpleBarcode.scale }}x</span>
                  </div>
                </div>

                <div class="option-group">
                  <label class="option-label">Height</label>
                  <div class="range-input">
                    <input 
                      type="range" 
                      v-model="simpleBarcode.height" 
                      min="50" 
                      max="200" 
                      step="10"
                      class="range-slider"
                    >
                    <span class="range-value">{{ simpleBarcode.height }}px</span>
                  </div>
                </div>

                <div class="option-group">
                  <label class="option-label">Show Text</label>
                  <label class="switch">
                    <input type="checkbox" v-model="simpleBarcode.includeText">
                    <span class="slider"></span>
                  </label>
                </div>
              </div>

              <!-- Color Options -->
              <div class="color-options">
                <div class="color-group">
                  <label class="color-label">Foreground Color</label>
                  <div class="color-picker-wrapper">
                    <input type="color" v-model="simpleBarcode.foreground" class="color-picker">
                    <span class="color-value">{{ simpleBarcode.foreground }}</span>
                  </div>
                </div>
                <div class="color-group">
                  <label class="color-label">Background Color</label>
                  <div class="color-picker-wrapper">
                    <input type="color" v-model="simpleBarcode.background" class="color-picker">
                    <span class="color-value">{{ simpleBarcode.background }}</span>
                  </div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="action-buttons">
                <button class="generate-button primary" @click="generateSimpleBarcode" :disabled="loading.simple">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" v-if="!loading.simple">
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                  </svg>
                  <span v-if="loading.simple" class="loading-spinner"></span>
                  <span>{{ loading.simple ? 'Generating...' : 'Generate Barcode' }}</span>
                </button>
                <button class="generate-button secondary" @click="resetSimpleBarcode">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                  </svg>
                  Reset
                </button>
              </div>

              <div v-if="error.simple" class="error-message">
                {{ error.simple }}
              </div>
            </div>

            <!-- Preview Section -->
            <div class="preview-section">
              <div class="preview-header">
                <h3 class="preview-title">Preview</h3>
                <div class="preview-actions" v-if="simpleBarcode.preview">
                  <button class="preview-action" @click="downloadBarcode('simple')">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                    </svg>
                    Download PNG
                  </button>
                  <button class="preview-action" @click="copyBarcodeToClipboard('simple')">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                    </svg>
                    Copy Image
                  </button>
                </div>
              </div>

              <div class="preview-content">
                <div v-if="simpleBarcode.preview" class="barcode-preview">
                  <img :src="simpleBarcode.preview" :alt="'Barcode: ' + simpleBarcode.text" class="barcode-image">
                  <div class="barcode-info">
                    <div class="info-row">
                      <span class="info-label">Type:</span>
                      <span class="info-value">{{ simpleBarcode.type.toUpperCase() }}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">Content:</span>
                      <span class="info-value content-value">{{ simpleBarcode.text }}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">Size:</span>
                      <span class="info-value">{{ Math.round(simpleBarcode.text.length * simpleBarcode.scale * 2) }} × {{ simpleBarcode.height }} px</span>
                    </div>
                  </div>
                </div>
                <div v-else class="empty-preview">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2 6h4v12H2zm6 0h4v12H8zm6 0h4v12h-4zm6 0h4v12h-4z"/>
                  </svg>
                  <p>Your barcode will appear here</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- QR Code Generator -->
      <div v-if="activeCategory === 'qrcode'" class="tools-section">
        <div class="section-header">
          <h2 class="section-title">
            <svg class="section-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M1 1h8v8H1zm2 2v4h4V3zm8-2h8v8h-8zm2 2v4h4V3zM1 15h8v8H1zm2 2v4h4v-4zm14-2h-4v2h2v2h-2v2h4v-2h2v-2h2v-2h-4zm-6 2h2v2h-2zm-2 4h2v2H9zm6 0h2v2h-2z"/>
            </svg>
            QR Code Generator
          </h2>
          <p class="section-description">
            Generate QR codes for URLs, text, contacts, WiFi, and more
          </p>
        </div>

        <div class="generator-card">
          <div class="generator-body">
            <!-- QR Code Type Selector -->
            <div class="qr-type-selector">
              <div class="type-buttons">
                <button 
                  v-for="type in qrTypes" 
                  :key="type.id"
                  class="type-button"
                  :class="{ active: qrCode.type === type.id }"
                  @click="setQrType(type.id)"
                >
                  <svg class="type-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path :d="type.icon"/>
                  </svg>
                  <span class="type-label">{{ type.label }}</span>
                </button>
              </div>
            </div>

            <!-- QR Code Forms -->
            <div class="qr-forms">
              <!-- Text QR Code -->
              <div v-if="qrCode.type === 'text'" class="qr-form">
                <div class="input-group">
                  <label class="input-label">Text Content</label>
                  <textarea 
                    v-model="qrCode.text.content"
                    class="code-editor"
                    placeholder="Enter text for QR code"
                    rows="4"
                    spellcheck="false"
                  ></textarea>
                </div>
              </div>

              <!-- URL QR Code -->
              <div v-else-if="qrCode.type === 'url'" class="qr-form">
                <div class="input-group">
                  <label class="input-label">URL</label>
                  <input 
                    type="url"
                    v-model="qrCode.url.content"
                    class="url-input"
                    placeholder="https://example.com"
                    spellcheck="false"
                  >
                </div>
              </div>

              <!-- Contact QR Code -->
              <div v-else-if="qrCode.type === 'contact'" class="qr-form">
                <div class="form-grid">
                  <div class="form-group">
                    <label class="form-label">Full Name</label>
                    <input type="text" v-model="qrCode.contact.name" placeholder="John Doe">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Phone</label>
                    <input type="tel" v-model="qrCode.contact.phone" placeholder="+1234567890">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Email</label>
                    <input type="email" v-model="qrCode.contact.email" placeholder="john@example.com">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Company</label>
                    <input type="text" v-model="qrCode.contact.company" placeholder="Company Inc.">
                  </div>
                  <div class="form-group full-width">
                    <label class="form-label">Address</label>
                    <input type="text" v-model="qrCode.contact.address" placeholder="123 Street, City, Country">
                  </div>
                </div>
              </div>

              <!-- WiFi QR Code -->
              <div v-else-if="qrCode.type === 'wifi'" class="qr-form">
                <div class="form-grid">
                  <div class="form-group">
                    <label class="form-label">Network Name (SSID)</label>
                    <input type="text" v-model="qrCode.wifi.ssid" placeholder="MyWiFiNetwork">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Password</label>
                    <div class="password-input">
                      <input 
                        :type="qrCode.wifi.showPassword ? 'text' : 'password'"
                        v-model="qrCode.wifi.password"
                        placeholder="WiFi password"
                      >
                      <button class="toggle-password" @click="qrCode.wifi.showPassword = !qrCode.wifi.showPassword">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                          <path v-if="qrCode.wifi.showPassword" d="M12 6.5c2.76 0 5 2.24 5 5 0 .51-.1 1-.24 1.46l3.06 3.06c1.39-1.23 2.49-2.77 3.18-4.53C21.27 7.11 17 4 12 4c-1.27 0-2.49.2-3.64.57l2.17 2.17c.47-.14.96-.24 1.47-.24zM2.71 3.16c-.39.39-.39 1.02 0 1.41l1.97 1.97C3.06 7.83 1.77 9.53 1 11.5 2.73 15.89 7 19 12 19c1.52 0 2.97-.3 4.31-.82l2.72 2.72c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L4.13 3.16c-.39-.39-1.03-.39-1.42 0zM12 16.5c-2.76 0-5-2.24-5-5 0-.77.18-1.5.5-2.14l1.57 1.57c-.03.18-.07.36-.07.57 0 1.66 1.34 3 3 3 .21 0 .39-.04.57-.11L14.14 16c-.64.32-1.37.5-2.14.5zm2.97-5.33c-.15-1.4-1.25-2.49-2.64-2.64l2.64 2.64z"/>
                          <path v-else d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Encryption</label>
                    <select v-model="qrCode.wifi.encryption" class="form-select">
                      <option value="WPA">WPA/WPA2</option>
                      <option value="WEP">WEP</option>
                      <option value="nopass">No Password</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Hidden Network</label>
                    <label class="switch">
                      <input type="checkbox" v-model="qrCode.wifi.hidden">
                      <span class="slider"></span>
                    </label>
                  </div>
                </div>
              </div>

              <!-- Event QR Code -->
              <div v-else-if="qrCode.type === 'event'" class="qr-form">
                <div class="form-grid">
                  <div class="form-group">
                    <label class="form-label">Event Name</label>
                    <input type="text" v-model="qrCode.event.name" placeholder="Annual Conference">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Date</label>
                    <input type="date" v-model="qrCode.event.date">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Time</label>
                    <input type="time" v-model="qrCode.event.time">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Ticket ID</label>
                    <input type="text" v-model="qrCode.event.ticketId" placeholder="TICKET-12345">
                  </div>
                  <div class="form-group full-width">
                    <label class="form-label">Venue</label>
                    <input type="text" v-model="qrCode.event.venue" placeholder="Convention Center, City">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Attendee Name</label>
                    <input type="text" v-model="qrCode.event.attendeeName" placeholder="John Smith">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Seat Number</label>
                    <input type="text" v-model="qrCode.event.seatNumber" placeholder="A12">
                  </div>
                </div>
              </div>
            </div>

            <!-- QR Code Options -->
            <div class="qr-options">
              <div class="options-grid">
                <div class="option-group">
                  <label class="option-label">Size</label>
                  <div class="range-input">
                    <input 
                      type="range" 
                      v-model="qrCode.options.size" 
                      min="100" 
                      max="500" 
                      step="50"
                      class="range-slider"
                    >
                    <span class="range-value">{{ qrCode.options.size }}px</span>
                  </div>
                </div>

                <div class="option-group">
                  <label class="option-label">Error Correction</label>
                  <select v-model="qrCode.options.errorCorrection" class="option-select">
                    <option value="L">Low (7%)</option>
                    <option value="M">Medium (15%)</option>
                    <option value="Q">Quartile (25%)</option>
                    <option value="H">High (30%)</option>
                  </select>
                </div>

                <div class="option-group">
                  <label class="option-label">Margin</label>
                  <div class="range-input">
                    <input 
                      type="range" 
                      v-model="qrCode.options.margin" 
                      min="0" 
                      max="10" 
                      step="1"
                      class="range-slider"
                    >
                    <span class="range-value">{{ qrCode.options.margin }}px</span>
                  </div>
                </div>

                <div class="option-group">
                  <label class="option-label">Add Logo</label>
                  <label class="switch">
                    <input type="checkbox" v-model="qrCode.options.includeLogo">
                    <span class="slider"></span>
                  </label>
                </div>
              </div>

              <div class="color-options" v-if="!qrCode.options.includeLogo">
                <div class="color-group">
                  <label class="color-label">QR Color</label>
                  <div class="color-picker-wrapper">
                    <input type="color" v-model="qrCode.options.dark" class="color-picker">
                    <span class="color-value">{{ qrCode.options.dark }}</span>
                  </div>
                </div>
                <div class="color-group">
                  <label class="color-label">Background</label>
                  <div class="color-picker-wrapper">
                    <input type="color" v-model="qrCode.options.light" class="color-picker">
                    <span class="color-value">{{ qrCode.options.light }}</span>
                  </div>
                </div>
              </div>

              <div v-if="qrCode.options.includeLogo" class="logo-upload">
                <label class="upload-label">Upload Logo</label>
                <div class="upload-area" @click="triggerLogoUpload">
                  <input 
                    type="file" 
                    ref="logoInput"
                    accept="image/*"
                    @change="handleLogoUpload"
                    hidden
                  >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" v-if="!qrCode.options.logoData">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                  <img v-else :src="qrCode.options.logoData" alt="Logo Preview" class="logo-preview">
                  <p v-if="!qrCode.options.logoData">Click to upload logo</p>
                  <p v-else>Logo uploaded. Click to change.</p>
                </div>
                <div class="upload-hint">
                  Recommended: Square PNG with transparent background
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="action-buttons">
              <button class="generate-button primary" @click="generateQRCode" :disabled="loading.qr">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" v-if="!loading.qr">
                  <path d="M1 1h8v8H1zm2 2v4h4V3zm8-2h8v8h-8zm2 2v4h4V3zM1 15h8v8H1zm2 2v4h4v-4zm14-2h-4v2h2v2h-2v2h4v-2h2v-2h2v-2h-4zm-6 2h2v2h-2zm-2 4h2v2H9zm6 0h2v2h-2z"/>
                </svg>
                <span v-if="loading.qr" class="loading-spinner"></span>
                <span>{{ loading.qr ? 'Generating...' : 'Generate QR Code' }}</span>
              </button>
              <button class="generate-button secondary" @click="resetQRCode">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                </svg>
                Reset
              </button>
            </div>

            <div v-if="error.qr" class="error-message">
              {{ error.qr }}
            </div>
          </div>

          <!-- QR Code Preview -->
          <div class="preview-section" v-if="qrCode.preview">
            <div class="preview-header">
              <h3 class="preview-title">QR Code Preview</h3>
              <div class="preview-actions">
                <button class="preview-action" @click="downloadQRCode">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                  </svg>
                  Download PNG
                </button>
                <button class="preview-action" @click="copyQRCodeToClipboard">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                  </svg>
                  Copy Image
                </button>
                <button class="preview-action" @click="testScanQRCode">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
                  </svg>
                  Test Scan
                </button>
              </div>
            </div>
            <div class="preview-content">
              <div class="qr-preview">
                <img :src="qrCode.preview" alt="Generated QR Code" class="qr-image">
                <div class="qr-info">
                  <div class="info-row">
                    <span class="info-label">Type:</span>
                    <span class="info-value">{{ getQrTypeLabel() }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Size:</span>
                    <span class="info-value">{{ qrCode.options.size }} × {{ qrCode.options.size }} px</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Error Correction:</span>
                    <span class="info-value">{{ getErrorCorrectionLabel() }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Content Preview:</span>
                    <span class="info-value content-value">{{ getQrContentPreview() }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Product Barcode Generator -->
      <div v-if="activeCategory === 'product'" class="tools-section">
        <div class="section-header">
          <h2 class="section-title">
            <svg class="section-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"/>
            </svg>
            Product Barcode Generator
          </h2>
          <p class="section-description">
            Generate professional product barcodes with product information
          </p>
        </div>

        <div class="generator-card">
          <div class="generator-body">
            <!-- Product Form -->
            <div class="product-form">
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Product ID*</label>
                  <input 
                    type="text" 
                    v-model="productData.productId"
                    placeholder="PRD-001"
                    required
                  >
                </div>
                <div class="form-group">
                  <label class="form-label">Product Name</label>
                  <input 
                    type="text" 
                    v-model="productData.productName"
                    placeholder="Product Name"
                  >
                </div>
                <div class="form-group">
                  <label class="form-label">Price</label>
                  <div class="price-input">
                    <select v-model="productData.currency" class="currency-select">
                      <option value="USD">$</option>
                      <option value="EUR">€</option>
                      <option value="GBP">£</option>
                      <option value="JPY">¥</option>
                    </select>
                    <input 
                      type="number" 
                      v-model="productData.price"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    >
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Manufacturer</label>
                  <input 
                    type="text" 
                    v-model="productData.manufacturer"
                    placeholder="Manufacturer Name"
                  >
                </div>
                <div class="form-group">
                  <label class="form-label">Expiry Date</label>
                  <input 
                    type="date" 
                    v-model="productData.expiryDate"
                  >
                </div>
                <div class="form-group">
                  <label class="form-label">Batch Number</label>
                  <input 
                    type="text" 
                    v-model="productData.batchNumber"
                    placeholder="BATCH-001"
                  >
                </div>
                <div class="form-group full-width">
                  <label class="form-label">Barcode Type</label>
                  <select v-model="productData.type" class="form-select">
                    <option value="ean13">EAN-13 (Recommended)</option>
                    <option value="code128">CODE128</option>
                    <option value="upc">UPC</option>
                    <option value="itf14">ITF-14</option>
                  </select>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="action-buttons">
                <button class="generate-button primary" @click="generateProductBarcode" :disabled="loading.product">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" v-if="!loading.product">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                  </svg>
                  <span v-if="loading.product" class="loading-spinner"></span>
                  <span>{{ loading.product ? 'Generating...' : 'Generate Product Barcode' }}</span>
                </button>
                <button class="generate-button secondary" @click="resetProductData">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                  </svg>
                  Reset
                </button>
              </div>

              <div v-if="error.product" class="error-message">
                {{ error.product }}
              </div>
            </div>

            <!-- Product Barcode Preview -->
            <div class="preview-section" v-if="productData.preview">
              <div class="preview-header">
                <h3 class="preview-title">Product Barcode</h3>
                <div class="preview-actions">
                  <button class="preview-action" @click="downloadProductBarcode">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                    </svg>
                    Download
                  </button>
                  <button class="preview-action" @click="copyProductBarcodeToClipboard">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                    </svg>
                    Copy
                  </button>
                </div>
              </div>
              <div class="preview-content">
                <div class="product-barcode-preview">
                  <img :src="productData.preview" alt="Product Barcode" class="barcode-image">
                  <div class="product-info">
                    <div class="info-grid">
                      <div class="info-item">
                        <span class="info-label">Product ID:</span>
                        <span class="info-value">{{ productData.productId }}</span>
                      </div>
                      <div class="info-item" v-if="productData.productName">
                        <span class="info-label">Name:</span>
                        <span class="info-value">{{ productData.productName }}</span>
                      </div>
                      <div class="info-item" v-if="productData.price">
                        <span class="info-label">Price:</span>
                        <span class="info-value">{{ productData.currency }}{{ productData.price }}</span>
                      </div>
                      <div class="info-item" v-if="productData.manufacturer">
                        <span class="info-label">Manufacturer:</span>
                        <span class="info-value">{{ productData.manufacturer }}</span>
                      </div>
                      <div class="info-item" v-if="productData.expiryDate">
                        <span class="info-label">Expiry:</span>
                        <span class="info-value">{{ formatDate(productData.expiryDate) }}</span>
                      </div>
                      <div class="info-item" v-if="productData.batchNumber">
                        <span class="info-label">Batch:</span>
                        <span class="info-value">{{ productData.batchNumber }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Batch Generator -->
      <div v-if="activeCategory === 'batch'" class="tools-section">
        <div class="section-header">
          <h2 class="section-title">
            <svg class="section-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12zm-7-2h2v-4h4V9h-4V5h-2v4H9v2h4z"/>
            </svg>
            Batch Generator
          </h2>
          <p class="section-description">
            Generate multiple barcodes at once for inventory, labels, or serial numbers
          </p>
        </div>

        <div class="generator-card">
          <div class="generator-body">
            <!-- Batch Input -->
            <div class="batch-input">
              <div class="input-header">
                <label class="input-label">Enter items (one per line or CSV format)</label>
                <button class="input-action" @click="loadSampleData">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                  </svg>
                  Load Sample
                </button>
              </div>
              <textarea 
                v-model="batchData.items"
                class="batch-textarea"
                placeholder="Enter items, one per line:
PRD-001,Product 1
PRD-002,Product 2
PRD-003,Product 3
...
Or just numbers:
1001
1002
1003"
                rows="8"
                spellcheck="false"
              ></textarea>
              <div class="batch-info">
                <span class="info-text">{{ getItemCount() }} items detected</span>
                <span class="info-text">{{ batchData.type.toUpperCase() }} format</span>
              </div>
            </div>

            <!-- Batch Options -->
            <div class="batch-options">
              <div class="options-grid">
                <div class="option-group">
                  <label class="option-label">Barcode Type</label>
                  <select v-model="batchData.type" class="option-select">
                    <option value="code128">CODE128</option>
                    <option value="code39">CODE39</option>
                    <option value="ean13">EAN-13</option>
                    <option value="itf14">ITF-14</option>
                  </select>
                </div>
                <div class="option-group">
                  <label class="option-label">Include Labels</label>
                  <label class="switch">
                    <input type="checkbox" v-model="batchData.includeLabels">
                    <span class="slider"></span>
                  </label>
                </div>
                <div class="option-group">
                  <label class="option-label">Generate as ZIP</label>
                  <label class="switch">
                    <input type="checkbox" v-model="batchData.generateZip">
                    <span class="slider"></span>
                  </label>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="action-buttons">
              <button class="generate-button primary" @click="generateBatchBarcodes" :disabled="loading.batch">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" v-if="!loading.batch">
                  <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                </svg>
                <span v-if="loading.batch" class="loading-spinner"></span>
                <span>{{ loading.batch ? 'Generating...' : 'Generate Batch' }}</span>
              </button>
              <button class="generate-button secondary" @click="clearBatchData">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
                Clear
              </button>
            </div>

            <div v-if="error.batch" class="error-message">
              {{ error.batch }}
            </div>
          </div>

          <!-- Batch Results -->
          <div class="batch-results" v-if="batchData.results.length > 0">
            <div class="results-header">
              <h3 class="results-title">Generated Barcodes</h3>
              <div class="results-info">
                <span class="results-count">{{ batchData.results.length }} barcodes generated</span>
                <div class="results-actions">
                  <button class="results-action" @click="downloadAllBarcodes">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                    </svg>
                    Download All
                  </button>
                  <button class="results-action" @click="downloadBatchZip" v-if="batchData.generateZip">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/>
                    </svg>
                    Download ZIP
                  </button>
                </div>
              </div>
            </div>
            <div class="results-grid">
              <div v-for="(item, index) in batchData.results" :key="index" class="result-item">
                <div class="result-preview">
                  <img :src="item.barcode" :alt="item.label || item.text" class="result-image">
                </div>
                <div class="result-info">
                  <div class="result-label">{{ item.label || item.text }}</div>
                  <div class="result-actions">
                    <button class="result-action" @click="downloadSingleBarcode(item)">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                      </svg>
                    </button>
                    <button class="result-action" @click="copySingleBarcode(item)">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Features Grid -->
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 11.24V7.5C9 6.12 10.12 5 11.5 5S14 6.12 14 7.5v3.74c1.21-.81 2-2.18 2-3.74C16 5.01 13.99 3 11.5 3S7 5.01 7 7.5c0 1.56.79 2.93 2 3.74zm9.84 4.63l-4.54-2.26c-.17-.07-.35-.11-.54-.11H13v-6c0-.83-.67-1.5-1.5-1.5S10 6.67 10 7.5v10.74c-3.6-.76-3.54-.75-3.67-.75-.31 0-.59.13-.79.33l-.79.8 4.94 4.94c.27.27.65.44 1.06.44h6.79c.75 0 1.33-.55 1.44-1.28l.75-5.27c.01-.07.02-.14.02-.2 0-.62-.38-1.16-.91-1.38z"/>
            </svg>
          </div>
          <h3 class="feature-title">High Quality</h3>
          <p class="feature-description">
            Generate crisp, print-ready barcodes and QR codes
          </p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <h3 class="feature-title">Scanner Validated</h3>
          <p class="feature-description">
            All codes are optimized for reliable scanning
          </p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
          </div>
          <h3 class="feature-title">Multiple Formats</h3>
          <p class="feature-description">
            Support for all popular barcode and QR code formats
          </p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 4h-4L7.11 16.63 4 12l-3 4 3 4 4-6.37L19 12l3-4z"/>
            </svg>
          </div>
          <h3 class="feature-title">Bulk Generation</h3>
          <p class="feature-description">
            Generate hundreds of barcodes in seconds
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import axios from 'axios';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const API_BASE_URL = 'http://192.168.18.101:3000/api/barcode';

// State
const activeCategory = ref('simple');
const categories = [
  { id: 'simple', label: 'Simple Barcode', icon: 'M2 6h4v12H2zm6 0h4v12H8zm6 0h4v12h-4zm6 0h4v12h-4z' },
  { id: 'qrcode', label: 'QR Code', icon: 'M1 1h8v8H1zm2 2v4h4V3zm8-2h8v8h-8zm2 2v4h4V3zM1 15h8v8H1zm2 2v4h4v-4zm14-2h-4v2h2v2h-2v2h4v-2h2v-2h2v-2h-4zm-6 2h2v2h-2zm-2 4h2v2H9zm6 0h2v2h-2z' },
  { id: 'product', label: 'Product Barcode', icon: 'M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z' },
  { id: 'batch', label: 'Batch Generator', icon: 'M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12zm-7-2h2v-4h4V9h-4V5h-2v4H9v2h4z' },
];

// Simple Barcode Data
const simpleBarcode = reactive({
  text: '123456789012',
  type: 'code128',
  scale: 3,
  height: 100,
  background: '#ffffff',
  foreground: '#000000',
  includeText: true,
  fontSize: 20,
  textMargin: 10,
  preview: ''
});

// QR Code Data
const qrTypes = [
  { id: 'text', label: 'Text', icon: 'M4 9h16v2H4zm0 4h10v2H4z' },
  { id: 'url', label: 'URL', icon: 'M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z' },
  { id: 'contact', label: 'Contact', icon: 'M20 0H4v2h16V0zM4 24h16v-2H4v2zM20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 2.75c1.24 0 2.25 1.01 2.25 2.25s-1.01 2.25-2.25 2.25S9.75 10.24 9.75 9 10.76 6.75 12 6.75zM17 17H7v-1.5c0-1.67 3.33-2.5 5-2.5s5 .83 5 2.5V17z' },
  { id: 'wifi', label: 'WiFi', icon: 'M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z' },
  { id: 'event', label: 'Event', icon: 'M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z' },
];

const qrCode = reactive({
  type: 'text',
  text: { content: 'Hello, World!' },
  url: { content: 'https://example.com' },
  contact: {
    name: '',
    phone: '',
    email: '',
    company: '',
    address: ''
  },
  wifi: {
    ssid: '',
    password: '',
    encryption: 'WPA',
    hidden: false,
    showPassword: false
  },
  event: {
    name: '',
    date: '',
    time: '',
    venue: '',
    ticketId: '',
    attendeeName: '',
    seatNumber: ''
  },
  options: {
    size: 300,
    margin: 4,
    dark: '#000000',
    light: '#ffffff',
    errorCorrection: 'M',
    includeLogo: false,
    logoData: null,
    logoSize: 60
  },
  preview: ''
});

// Product Barcode Data
const productData = reactive({
  productId: '',
  productName: '',
  price: '',
  currency: 'USD',
  manufacturer: '',
  expiryDate: '',
  batchNumber: '',
  type: 'ean13',
  preview: ''
});

// Batch Generator Data
const batchData = reactive({
  items: '',
  type: 'code128',
  includeLabels: true,
  generateZip: true,
  results: []
});

// Loading states
const loading = reactive({
  simple: false,
  qr: false,
  product: false,
  batch: false
});

// Error states
const error = reactive({
  simple: '',
  qr: '',
  product: '',
  batch: ''
});

// Theme toggle
const toggleTheme = () => {
  const html = document.documentElement;
  const currentTheme = html.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
};

// Fullscreen toggle
const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => {
      console.log(`Error attempting to enable fullscreen: ${err.message}`);
    });
  } else {
    document.exitFullscreen();
  }
};

// QR Code Type Functions
const setQrType = (type) => {
  qrCode.type = type;
};

const getQrTypeLabel = () => {
  return qrTypes.find(t => t.id === qrCode.type)?.label || 'Text';
};

const getErrorCorrectionLabel = () => {
  const labels = {
    'L': 'Low (7%)',
    'M': 'Medium (15%)',
    'Q': 'Quartile (25%)',
    'H': 'High (30%)'
  };
  return labels[qrCode.options.errorCorrection] || 'Medium';
};

const getQrContentPreview = () => {
  switch(qrCode.type) {
    case 'text': return qrCode.text.content.substring(0, 50) + (qrCode.text.content.length > 50 ? '...' : '');
    case 'url': return qrCode.url.content;
    case 'contact': return qrCode.contact.name || 'Contact info';
    case 'wifi': return `WiFi: ${qrCode.wifi.ssid}`;
    case 'event': return qrCode.event.name || 'Event';
    default: return '';
  }
};

// Logo Upload
const logoInput = ref(null);

const triggerLogoUpload = () => {
  logoInput.value?.click();
};

const handleLogoUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    qrCode.options.logoData = e.target.result;
  };
  reader.readAsDataURL(file);
};

// Format Date
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Batch Functions
const getItemCount = () => {
  if (!batchData.items.trim()) return 0;
  const lines = batchData.items.split('\n').filter(line => line.trim() !== '');
  return lines.length;
};

const loadSampleData = () => {
  batchData.items = `PRD-001,Product Alpha
PRD-002,Product Beta
PRD-003,Product Gamma
PRD-004,Product Delta
PRD-005,Product Epsilon
100001
100002
100003
100004
100005`;
};

// API Functions
const generateSimpleBarcode = async () => {
  if (!simpleBarcode.text.trim()) {
    error.simple = 'Please enter barcode content';
    return;
  }

  loading.simple = true;
  error.simple = '';

  try {
    const response = await axios.post(`${API_BASE_URL}/generate-barcode`, {
      text: simpleBarcode.text,
      type: simpleBarcode.type,
      scale: simpleBarcode.scale,
      height: simpleBarcode.height,
      background: simpleBarcode.background,
      foreground: simpleBarcode.foreground,
      includeText: simpleBarcode.includeText,
      textMargin: simpleBarcode.textMargin,
      fontSize: simpleBarcode.fontSize
    });

    if (response.data.success) {
      simpleBarcode.preview = response.data.barcode;
      showNotification('Barcode generated successfully!');
    } else {
      error.simple = response.data.error || 'Failed to generate barcode';
    }
  } catch (err) {
    error.simple = err.response?.data?.error || 'Server error. Please try again.';
    console.error('Barcode generation error:', err);
  } finally {
    loading.simple = false;
  }
};

const generateQRCode = async () => {
  let qrContent = '';
  
  // Build content based on type
  switch(qrCode.type) {
    case 'text':
      if (!qrCode.text.content.trim()) {
        error.qr = 'Please enter text content';
        return;
      }
      qrContent = qrCode.text.content;
      break;
      
    case 'url':
      if (!qrCode.url.content.trim()) {
        error.qr = 'Please enter URL';
        return;
      }
      qrContent = qrCode.url.content;
      break;
      
    case 'contact':
      if (!qrCode.contact.name && !qrCode.contact.phone && !qrCode.contact.email) {
        error.qr = 'Please enter at least one contact field';
        return;
      }
      // For contact, we'll generate vCard format
      try {
        const contactResponse = await axios.post(`${API_BASE_URL}/generate-contact-qr`, {
          ...qrCode.contact
        });
        if (contactResponse.data.success) {
          qrCode.preview = contactResponse.data.qrcode;
          showNotification('Contact QR code generated successfully!');
          loading.qr = false;
          return;
        }
      } catch (err) {
        error.qr = err.response?.data?.error || 'Failed to generate contact QR';
        loading.qr = false;
        return;
      }
      break;
      
    case 'wifi':
      if (!qrCode.wifi.ssid.trim()) {
        error.qr = 'Please enter WiFi SSID';
        return;
      }
      try {
        const wifiResponse = await axios.post(`${API_BASE_URL}/generate-wifi-qr`, {
          ...qrCode.wifi
        });
        if (wifiResponse.data.success) {
          qrCode.preview = wifiResponse.data.qrcode;
          showNotification('WiFi QR code generated successfully!');
          loading.qr = false;
          return;
        }
      } catch (err) {
        error.qr = err.response?.data?.error || 'Failed to generate WiFi QR';
        loading.qr = false;
        return;
      }
      break;
      
    case 'event':
      if (!qrCode.event.name || !qrCode.event.ticketId) {
        error.qr = 'Event name and ticket ID are required';
        return;
      }
      try {
        const eventResponse = await axios.post(`${API_BASE_URL}/generate-event-qr`, {
          ...qrCode.event
        });
        if (eventResponse.data.success) {
          qrCode.preview = eventResponse.data.qrcode;
          showNotification('Event QR code generated successfully!');
          loading.qr = false;
          return;
        }
      } catch (err) {
        error.qr = err.response?.data?.error || 'Failed to generate event QR';
        loading.qr = false;
        return;
      }
      break;
  }

  // For text and URL QR codes
  if (qrContent) {
    loading.qr = true;
    error.qr = '';

    try {
      const response = await axios.post(`${API_BASE_URL}/generate-qrcode`, {
        text: qrContent,
        size: qrCode.options.size,
        margin: qrCode.options.margin,
        dark: qrCode.options.dark,
        light: qrCode.options.light,
        errorCorrectionLevel: qrCode.options.errorCorrection,
        includeLogo: qrCode.options.includeLogo,
        logoData: qrCode.options.logoData,
        logoSize: qrCode.options.logoSize
      });

      if (response.data.success) {
        qrCode.preview = response.data.qrcode;
        showNotification('QR code generated successfully!');
      } else {
        error.qr = response.data.error || 'Failed to generate QR code';
      }
    } catch (err) {
      error.qr = err.response?.data?.error || 'Server error. Please try again.';
      console.error('QR code generation error:', err);
    } finally {
      loading.qr = false;
    }
  }
};

const generateProductBarcode = async () => {
  if (!productData.productId.trim()) {
    error.product = 'Product ID is required';
    return;
  }

  loading.product = true;
  error.product = '';

  try {
    const response = await axios.post(`${API_BASE_URL}/generate-product-barcode`, {
      ...productData
    });

    if (response.data.success) {
      productData.preview = response.data.barcode;
      showNotification('Product barcode generated successfully!');
    } else {
      error.product = response.data.error || 'Failed to generate product barcode';
    }
  } catch (err) {
    error.product = err.response?.data?.error || 'Server error. Please try again.';
    console.error('Product barcode generation error:', err);
  } finally {
    loading.product = false;
  }
};

const generateBatchBarcodes = async () => {
  if (!batchData.items.trim()) {
    error.batch = 'Please enter items for batch generation';
    return;
  }

  const lines = batchData.items.split('\n').filter(line => line.trim() !== '');
  if (lines.length === 0) {
    error.batch = 'No valid items found';
    return;
  }

  if (lines.length > 50) {
    error.batch = 'Maximum 50 items allowed for batch generation';
    return;
  }

  loading.batch = true;
  error.batch = '';
  batchData.results = [];

  try {
    // Parse items
    const items = lines.map(line => {
      const parts = line.split(',');
      return {
        text: parts[0].trim(),
        label: parts[1] ? parts[1].trim() : parts[0].trim()
      };
    });

    const response = await axios.post(`${API_BASE_URL}/batch-generate`, {
      items: items,
      type: batchData.type
    });

    if (response.data.success) {
      batchData.results = response.data.items.filter(item => item.success);
      showNotification(`Generated ${batchData.results.length} barcodes successfully!`);
    } else {
      error.batch = response.data.error || 'Failed to generate batch barcodes';
    }
  } catch (err) {
    error.batch = err.response?.data?.error || 'Server error. Please try again.';
    console.error('Batch generation error:', err);
  } finally {
    loading.batch = false;
  }
};

// Download Functions
const downloadBarcode = (type) => {
  let dataUrl, filename;
  
  if (type === 'simple') {
    dataUrl = simpleBarcode.preview;
    filename = `barcode-${simpleBarcode.text.substring(0, 20)}.png`;
  } else if (type === 'product') {
    dataUrl = productData.preview;
    filename = `product-barcode-${productData.productId}.png`;
  }
  
  if (!dataUrl) return;
  
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showNotification('Barcode downloaded!');
};

const downloadQRCode = () => {
  if (!qrCode.preview) return;
  
  const filename = `qrcode-${qrCode.type}-${Date.now()}.png`;
  const link = document.createElement('a');
  link.href = qrCode.preview;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showNotification('QR code downloaded!');
};

const downloadProductBarcode = () => {
  downloadBarcode('product');
};

const downloadSingleBarcode = (item) => {
  const link = document.createElement('a');
  link.href = item.barcode;
  link.download = `barcode-${item.text}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showNotification('Barcode downloaded!');
};

const downloadAllBarcodes = async () => {
  if (batchData.results.length === 0) return;
  
  const zip = new JSZip();
  
  batchData.results.forEach((item, index) => {
    // Convert data URL to blob
    const byteString = atob(item.barcode.split(',')[1]);
    const mimeString = item.barcode.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeString });
    
    zip.file(`barcode-${item.text || index}.png`, blob);
  });
  
  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, `barcodes-${Date.now()}.zip`);
  showNotification(`Downloaded ${batchData.results.length} barcodes as ZIP!`);
};

const downloadBatchZip = async () => {
  await downloadAllBarcodes();
};

// Copy to Clipboard Functions
const copyBarcodeToClipboard = async (type) => {
  let dataUrl;
  
  if (type === 'simple') {
    dataUrl = simpleBarcode.preview;
  } else if (type === 'product') {
    dataUrl = productData.preview;
  }
  
  if (!dataUrl) return;
  
  try {
    // Fetch the image as blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    
    // Copy blob to clipboard
    await navigator.clipboard.write([
      new ClipboardItem({
        [blob.type]: blob
      })
    ]);
    
    showNotification('Barcode copied to clipboard!');
  } catch (err) {
    console.error('Failed to copy image:', err);
    // Fallback: Copy data URL as text
    try {
      await navigator.clipboard.writeText(dataUrl);
      showNotification('Barcode URL copied to clipboard!');
    } catch (textErr) {
      alert('Failed to copy barcode to clipboard');
    }
  }
};

const copyQRCodeToClipboard = async () => {
  if (!qrCode.preview) return;
  
  try {
    const response = await fetch(qrCode.preview);
    const blob = await response.blob();
    
    await navigator.clipboard.write([
      new ClipboardItem({
        [blob.type]: blob
      })
    ]);
    
    showNotification('QR code copied to clipboard!');
  } catch (err) {
    console.error('Failed to copy QR code:', err);
    try {
      await navigator.clipboard.writeText(qrCode.preview);
      showNotification('QR code URL copied to clipboard!');
    } catch (textErr) {
      alert('Failed to copy QR code to clipboard');
    }
  }
};

const copyProductBarcodeToClipboard = () => {
  copyBarcodeToClipboard('product');
};

const copySingleBarcode = async (item) => {
  try {
    const response = await fetch(item.barcode);
    const blob = await response.blob();
    
    await navigator.clipboard.write([
      new ClipboardItem({
        [blob.type]: blob
      })
    ]);
    
    showNotification('Barcode copied to clipboard!');
  } catch (err) {
    console.error('Failed to copy barcode:', err);
  }
};

// Test QR Code Scan (Simulation)
const testScanQRCode = () => {
  if (!qrCode.preview) return;
  
  // Simulate scanning by showing content
  let content = '';
  switch(qrCode.type) {
    case 'text': content = qrCode.text.content; break;
    case 'url': content = qrCode.url.content; break;
    case 'contact': content = 'Contact information'; break;
    case 'wifi': content = `WiFi Network: ${qrCode.wifi.ssid}`; break;
    case 'event': content = `Event: ${qrCode.event.name}`; break;
  }
  
  showNotification(`Scan simulation: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`);
};

// Reset Functions
const resetSimpleBarcode = () => {
  simpleBarcode.text = '123456789012';
  simpleBarcode.type = 'code128';
  simpleBarcode.scale = 3;
  simpleBarcode.height = 100;
  simpleBarcode.background = '#ffffff';
  simpleBarcode.foreground = '#000000';
  simpleBarcode.includeText = true;
  simpleBarcode.preview = '';
  error.simple = '';
};

const resetQRCode = () => {
  qrCode.text.content = 'Hello, World!';
  qrCode.url.content = 'https://example.com';
  qrCode.contact = {
    name: '',
    phone: '',
    email: '',
    company: '',
    address: ''
  };
  qrCode.wifi = {
    ssid: '',
    password: '',
    encryption: 'WPA',
    hidden: false,
    showPassword: false
  };
  qrCode.event = {
    name: '',
    date: '',
    time: '',
    venue: '',
    ticketId: '',
    attendeeName: '',
    seatNumber: ''
  };
  qrCode.options = {
    size: 300,
    margin: 4,
    dark: '#000000',
    light: '#ffffff',
    errorCorrection: 'M',
    includeLogo: false,
    logoData: null,
    logoSize: 60
  };
  qrCode.preview = '';
  error.qr = '';
};

const resetProductData = () => {
  productData.productId = '';
  productData.productName = '';
  productData.price = '';
  productData.currency = 'USD';
  productData.manufacturer = '';
  productData.expiryDate = '';
  productData.batchNumber = '';
  productData.type = 'ean13';
  productData.preview = '';
  error.product = '';
};

const clearBatchData = () => {
  batchData.items = '';
  batchData.results = [];
  error.batch = '';
};

// Notification
const showNotification = (message) => {
  const notification = document.createElement('div');
  notification.className = 'copy-notification';
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    z-index: 9999;
    animation: slideIn 0.3s ease-out;
  `;
  
  const style = document.createElement('style');
  style.textContent = `
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
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => {
      document.body.removeChild(notification);
      document.head.removeChild(style);
    }, 300);
  }, 2000);
};

// Initialize
onMounted(() => {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
});
</script>

<style scoped>
/* Base Styles */
.barcode-generator-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  transition: background 0.3s ease;
  border-radius: 20px;
}

[data-theme="dark"] .barcode-generator-page {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
}

/* Header */
.page-header {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 24px 0;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  border-radius: 20px;
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
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

[data-theme="dark"] .page-title {
  color: #f1f5f9;
  -webkit-text-fill-color: #f1f5f9;
}

.title-icon {
  width: 28px;
  height: 28px;
  color: #4f46e5;
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

/* Tool Categories */
.tool-categories {
  max-width: 1200px;
  margin: 24px auto 0;
  padding: 0 24px;
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;
}

.tool-categories::-webkit-scrollbar {
  display: none;
}

.category-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

[data-theme="dark"] .category-tab {
  background: #334155;
  border-color: #475569;
  color: #94a3b8;
}

.category-tab:hover {
  border-color: #c7d2fe;
  color: #4f46e5;
}

[data-theme="dark"] .category-tab:hover {
  border-color: #6366f1;
  color: #c7d2fe;
}

.category-tab.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
  color: white;
}

.category-icon {
  width: 18px;
  height: 18px;
}

.category-tab.active .category-icon {
  color: white;
}

.category-label {
  font-weight: 500;
}

/* Main Content */
.page-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px 60px;
}

/* Section Header */
.tools-section {
  margin-bottom: 48px;
}

.section-header {
  margin-bottom: 32px;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 500;
  color: #1e293b;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

[data-theme="dark"] .section-title {
  color: #f1f5f9;
}

.section-icon {
  width: 24px;
  height: 24px;
  color: #4f46e5;
}

.section-description {
  font-size: 1rem;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
}

[data-theme="dark"] .section-description {
  color: #94a3b8;
}

/* Generator Card */
.generator-card {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  margin-bottom: 32px;
}

[data-theme="dark"] .generator-card {
  background: #1e293b;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.generator-body {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-label {
  font-size: 0.95rem;
  font-weight: 500;
  color: #475569;
}

[data-theme="dark"] .input-label {
  color: #cbd5e1;
}

.code-editor {
  width: 95%;
  padding: 16px;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9rem;
  line-height: 1.5;
  resize: vertical;
  transition: all 0.3s ease;
  color: #1e293b;
}

[data-theme="dark"] .code-editor {
  background: #0f172a;
  border-color: #334155;
  color: #cbd5e1;
}

.code-editor:focus {
  outline: none;
  border-color: #4f46e5;
  background: white;
}

[data-theme="dark"] .code-editor:focus {
  background: #1e293b;
  border-color: #6366f1;
}

.character-count {
  text-align: right;
  font-size: 0.8rem;
  color: #64748b;
  margin-top: 4px;
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.option-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #475569;
}

[data-theme="dark"] .option-label {
  color: #cbd5e1;
}

.option-select {
  padding: 10px 12px;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #1e293b;
  transition: all 0.3s ease;
}

[data-theme="dark"] .option-select {
  background: #0f172a;
  border-color: #334155;
  color: #cbd5e1;
}

.option-select:focus {
  outline: none;
  border-color: #4f46e5;
}

.range-input {
  display: flex;
  align-items: center;
  gap: 12px;
}

.range-slider {
  flex: 1;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  outline: none;
  -webkit-appearance: none;
}

.range-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  background: #4f46e5;
  border-radius: 50%;
  cursor: pointer;
}

.range-value {
  min-width: 60px;
  text-align: right;
  font-size: 0.9rem;
  color: #64748b;
}

.color-options {
  display: flex;
  gap: 24px;
  margin: 20px 0;
}

.color-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.color-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #475569;
}

.color-picker-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.color-picker {
  width: 50px;
  height: 50px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  background: transparent;
}

.color-value {
  font-size: 0.85rem;
  color: #64748b;
  font-family: 'Monaco', 'Menlo', monospace;
}

.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 26px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 34px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

input:checked + .slider:before {
  transform: translateX(24px);
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 16px;
  margin-top: 24px;
}

.generate-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 28px;
  font-size: 1rem;
  font-weight: 500;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.generate-button.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.generate-button.primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
}

.generate-button.secondary {
  background: #f1f5f9;
  color: #475569;
}

[data-theme="dark"] .generate-button.secondary {
  background: #334155;
  color: #cbd5e1;
}

.generate-button.secondary:hover {
  background: #e2e8f0;
}

[data-theme="dark"] .generate-button.secondary:hover {
  background: #475569;
}

.generate-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.generate-button svg {
  width: 20px;
  height: 20px;
}

/* Preview Section */
.preview-section {
  margin-top: 32px;
  padding: 24px;
  background: #f8fafc;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
}

[data-theme="dark"] .preview-section {
  background: #0f172a;
  border-color: #334155;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.preview-title {
  font-size: 1.2rem;
  font-weight: 300;
  color: #1e293b;
  margin: 0;
}

[data-theme="dark"] .preview-title {
  color: #f1f5f9;
}

.preview-actions {
  display: flex;
  gap: 12px;
}

.preview-action {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.preview-action:hover {
  opacity: 0.9;
  transform: translateY(-2px);
}

.preview-action svg {
  width: 16px;
  height: 16px;
}

.preview-content {
  background: white;
  border-radius: 8px;
  padding: 20px;
}

[data-theme="dark"] .preview-content {
  background: #1e293b;
}

/* Barcode Preview */
.barcode-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.barcode-image {
  max-width: 100%;
  height: auto;
  max-height: 300px;
  object-fit: contain;
}

.barcode-info {
  width: 100%;
  background: #f8fafc;
  border-radius: 8px;
  padding: 16px;
}

[data-theme="dark"] .barcode-info {
  background: #0f172a;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #e2e8f0;
}

[data-theme="dark"] .info-row {
  border-bottom-color: #334155;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #475569;
}

[data-theme="dark"] .info-label {
  color: #cbd5e1;
}

.info-value {
  font-size: 0.9rem;
  color: #1e293b;
  font-weight: 500;
}

[data-theme="dark"] .info-value {
  color: #f1f5f9;
}

.content-value {
  font-family: 'Monaco', 'Menlo', monospace;
  background: #f1f5f9;
  padding: 4px 8px;
  border-radius: 4px;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

[data-theme="dark"] .content-value {
  background: #0f172a;
}

.empty-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  gap: 16px;
  color: #64748b;
}

.empty-preview svg {
  width: 64px;
  height: 64px;
  color: #cbd5e1;
}

/* QR Code Specific Styles */
.qr-type-selector {
  margin-bottom: 24px;
}

.type-buttons {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.type-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: #f1f5f9;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  min-width: 100px;
  cursor: pointer;
  transition: all 0.3s ease;
}

[data-theme="dark"] .type-button {
  background: #334155;
  border-color: #475569;
}

.type-button:hover {
  border-color: #c7d2fe;
  transform: translateY(-2px);
}

.type-button.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
  color: white;
}

.type-icon {
  width: 24px;
  height: 24px;
}

.type-label {
  font-size: 0.85rem;
  font-weight: 500;
}

.qr-forms {
  margin-bottom: 24px;
}

.qr-form {
  background: #f8fafc;
  border-radius: 12px;
  padding: 24px;
}

[data-theme="dark"] .qr-form {
  background: #0f172a;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #475569;
}

[data-theme="dark"] .form-label {
  color: #cbd5e1;
}

.form-grid input,
.form-grid select {
  padding: 10px 12px;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #1e293b;
  transition: all 0.3s ease;
  width:91%;
}

[data-theme="dark"] .form-grid input,
[data-theme="dark"] .form-grid select {
  background: #1e293b;
  border-color: #334155;
  color: #cbd5e1;
}

.form-grid input:focus,
.form-grid select:focus {
  outline: none;
  border-color: #4f46e5;
}

.password-input {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input input {
  flex: 1;
  padding-right: 40px;
}

.toggle-password {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggle-password svg {
  width: 18px;
  height: 18px;
}

.price-input {
  display: flex;
  gap: 8px;
}

.currency-select {
  min-width: 60px;
  background: #f1f5f9;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px;
}

.qr-options {
  margin: 24px 0;
}

.logo-upload {
  margin-top: 20px;
}

.upload-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #475569;
  margin-bottom: 8px;
  display: block;
}

.upload-area {
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.upload-area:hover {
  border-color: #4f46e5;
  background: #f8fafc;
}

[data-theme="dark"] .upload-area {
  border-color: #475569;
}

[data-theme="dark"] .upload-area:hover {
  background: #0f172a;
}

.upload-area svg {
  width: 48px;
  height: 48px;
  color: #cbd5e1;
  margin-bottom: 12px;
}

.upload-area p {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
}

.logo-preview {
  width: 100px;
  height: 100px;
  object-fit: contain;
  margin-bottom: 12px;
}

.upload-hint {
  font-size: 0.8rem;
  color: #94a3b8;
  margin-top: 8px;
  text-align: center;
}

/* QR Preview */
.qr-preview {
  display: flex;
  gap: 24px;
  align-items: center;
}

@media (max-width: 768px) {
  .qr-preview {
    flex-direction: column;
  }
}

.qr-image {
  width: 200px;
  height: 200px;
  object-fit: contain;
}

.qr-info {
  flex: 1;
  background: #f8fafc;
  border-radius: 8px;
  padding: 16px;
}

[data-theme="dark"] .qr-info {
  background: #0f172a;
}

/* Product Barcode Styles */
.product-form {
  margin-bottom: 32px;
}

.product-barcode-preview {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.product-info {
  background: #f8fafc;
  border-radius: 8px;
  padding: 20px;
}

[data-theme="dark"] .product-info {
  background: #0f172a;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* Batch Generator Styles */
.batch-input {
  margin-bottom: 24px;
}

.input-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.input-action {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  color: #475569;
  cursor: pointer;
  transition: all 0.3s ease;
}

[data-theme="dark"] .input-action {
  background: #334155;
  border-color: #475569;
  color: #cbd5e1;
}

.input-action:hover {
  background: #e2e8f0;
}

[data-theme="dark"] .input-action:hover {
  background: #475569;
}

.input-action svg {
  width: 16px;
  height: 16px;
}

.batch-textarea {
  width: 100%;
  min-height: 200px;
  padding: 16px;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.9rem;
  line-height: 1.5;
  resize: vertical;
  color: #1e293b;
}

[data-theme="dark"] .batch-textarea {
  background: #0f172a;
  border-color: #334155;
  color: #cbd5e1;
}

.batch-info {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 0.8rem;
  color: #64748b;
}

.info-text {
  font-size: 0.8rem;
  color: #64748b;
}

.batch-options {
  margin: 24px 0;
}

.batch-results {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 2px solid #e2e8f0;
}

[data-theme="dark"] .batch-results {
  border-top-color: #334155;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.results-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

[data-theme="dark"] .results-title {
  color: #f1f5f9;
}

.results-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.results-count {
  font-size: 0.9rem;
  color: #64748b;
}

.results-actions {
  display: flex;
  gap: 8px;
}

.results-action {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.results-action:hover {
  opacity: 0.9;
  transform: translateY(-2px);
}

.results-action svg {
  width: 16px;
  height: 16px;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.result-item {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

[data-theme="dark"] .result-item {
  background: #1e293b;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.result-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.1);
}

.result-preview {
  margin-bottom: 12px;
}

.result-image {
  width: 100%;
  height: 120px;
  object-fit: contain;
}

.result-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.result-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #475569;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

[data-theme="dark"] .result-label {
  color: #cbd5e1;
}

.result-actions {
  display: flex;
  gap: 4px;
}

.result-action {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  border: none;
  border-radius: 6px;
  color: #475569;
  cursor: pointer;
  transition: all 0.3s ease;
}

[data-theme="dark"] .result-action {
  background: #334155;
  color: #cbd5e1;
}

.result-action:hover {
  background: #e2e8f0;
}

[data-theme="dark"] .result-action:hover {
  background: #475569;
}

.result-action svg {
  width: 16px;
  height: 16px;
}

/* Features Grid */
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  margin-top: 60px;
}

.feature-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

[data-theme="dark"] .feature-card {
  background: #1e293b;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(102, 126, 234, 0.1);
}

.feature-icon {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
}

.feature-icon svg {
  width: 28px;
  height: 28px;
  color: white;
}

.feature-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 12px 0;
}

[data-theme="dark"] .feature-title {
  color: #f1f5f9;
}

.feature-description {
  font-size: 0.9rem;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
}

[data-theme="dark"] .feature-description {
  color: #94a3b8;
}

/* Loading Spinner */
.loading-spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Error Message */
.error-message {
  color: #ef4444;
  font-size: 0.875rem;
  margin: 8px 0 0 0;
  padding: 12px 16px;
  background: #fef2f2;
  border-radius: 8px;
  border-left: 4px solid #ef4444;
}

[data-theme="dark"] .error-message {
  background: #7f1d1d;
  color: #fecaca;
  border-left-color: #ef4444;
}

/* Responsive Design */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .tool-categories {
    flex-wrap: wrap;
  }
  
  .generator-card {
    padding: 20px;
  }
  
  .options-grid {
    grid-template-columns: 1fr;
  }
  
  .color-options {
    flex-direction: column;
    gap: 16px;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .preview-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .preview-actions {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }
  
  .results-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .results-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .results-actions {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }
  
  .results-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
  
  .features-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .type-buttons {
    flex-wrap: wrap;
  }
  
  .type-button {
    min-width: calc(50% - 4px);
  }
  
  .qr-preview {
    text-align: center;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .page-title {
    font-size: 1.4rem;
  }
}
</style>