<template>
  <div class="qr-generator-container">
    <!-- Header -->
    <div class="generator-header">
      <div class="header-content">
        <h1 class="main-title">QR Code Generator</h1>
        <p class="subtitle">Create custom QR codes for websites, contacts and more</p>
      </div>
    </div>

    <!-- Main Content -->
    <div class="generator-content">
      <div class="content-wrapper">
        <!-- Left Panel - Configuration -->
        <div class="config-panel">
          <!-- Type Selection -->
          <div class="config-section">
            <div class="section-header">
              <h3 class="section-title">
                QR Code Type
              </h3>
              <p class="section-description">Select what you want to encode in your QR code</p>
            </div>
            <div class="type-grid">
              <button 
                v-for="type in qrTypes" 
                :key="type.id"
                class="type-card"
                :class="{ active: selectedType === type.id }"
                @click="selectType(type.id)"
              >
                <div class="card-icon">
                  <!-- URL Icon -->
                  <svg v-if="type.id === 'url'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  
                  <!-- WhatsApp Icon -->
                  <svg v-else-if="type.id === 'whatsapp'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16.75 13.96c.25.13.41.2.46.3.06.11.04.61-.21 1.18-.2.56-1.24 1.1-1.7 1.12-.46.02-.47.36-2.96-.73-2.49-1.09-3.99-3.75-4.11-3.92-.12-.17-.96-1.38-.92-2.61.05-1.22.69-1.8.95-2.04.24-.26.51-.29.68-.26h.47c.15 0 .36-.06.55.45l.69 1.87c.06.13.1.28.01.44l-.27.41-.39.42c-.12.12-.26.25-.12.5.12.26.62 1.09 1.32 1.78.91.88 1.71 1.17 1.95 1.3.24.14.39.12.54-.04l.81-.94c.19-.25.35-.19.58-.11l1.67.88M12 2a10 10 0 0 1 10 10 10 10 0 0 1-10 10c-1.97 0-3.8-.57-5.35-1.55L2 22l1.55-4.65A9.969 9.969 0 0 1 2 12 10 10 0 0 1 12 2m0 2a8 8 0 0 0-8 8c0 1.72.54 3.31 1.46 4.61L4.5 19.5l2.89-.96A7.95 7.95 0 0 0 12 20a8 8 0 0 0 8-8 8 8 0 0 0-8-8z"/>
                  </svg>
                  
                  <!-- Email Icon -->
                  <svg v-else-if="type.id === 'email'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                  </svg>
                  
                  <!-- WiFi Icon -->
                  <svg v-else-if="type.id === 'wifi'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/>
                  </svg>
                  
                </div>
                <span class="card-label">{{ type.name }}</span>
                <div v-if="selectedType === type.id" class="active-indicator">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                </div>
              </button>
            </div>
          </div>

          <!-- Content Input -->
          <div class="config-section">
            <div class="input-container">
              <label class="input-label">
                {{ getInputLabel() }}
                <span class="required">*</span>
              </label>
              <div class="input-wrapper">
                <textarea 
                  v-model="qrContent"
                  class="content-textarea"
                  :placeholder="getPlaceholder()"
                  rows="4"
                  @input="generateQRCode"
                ></textarea>
                <div class="char-count" v-if="qrContent.length > 0">
                  {{ qrContent.length }} characters
                </div>
              </div>
              <div class="input-hint" v-if="selectedType === 'phone' || selectedType === 'whatsapp'">
                <svg class="hint-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="config-section">
            <div class="section-header">
              <h3 class="section-title">
                Quick Actions
              </h3>
            </div>
            <div class="quick-actions">
              <button class="quick-btn primary" @click="fillExample">
                <svg class="btn-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
                Fill Example
              </button>
              <button class="quick-btn secondary" @click="clearAll">
                <svg class="btn-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
                Clear All
              </button>
            </div>
          </div>
        </div>

        <!-- Right Panel - QR Preview -->
        <div class="preview-panel">
          <div class="preview-card">
            <div class="preview-header">
              <h3 class="preview-title">
                QR Code Preview
              </h3>
              <div class="preview-status" :class="{ 'has-error': qrError }">
                <svg v-if="!qrError && qrContent.trim()" class="status-icon success" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <svg v-if="qrError" class="status-icon error" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
                <span class="status-text">
                  {{ qrError || (qrContent.trim() ? 'Ready to use' : 'Enter content to generate') }}
                </span>
              </div>
            </div>
            
            <div class="qr-display">
              <div class="qr-wrapper" :class="{ 'has-error': qrError }">
                <div ref="qrCodeElement" class="qr-code-canvas"></div>
                <div v-if="!qrContent.trim()" class="qr-placeholder">
                  <svg class="placeholder-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14.06 9.02l.92.92L5.92 19H5v-.92l9.06-9.06M17.66 3c-.25 0-.51.1-.7.29l-1.83 1.83 3.75 3.75 1.83-1.83c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.2-.2-.45-.29-.71-.29zm-3.6 3.19L3 17.25V21h3.75L17.81 9.94l-3.75-3.75z"/>
                  </svg>
                  <p class="placeholder-text">Enter content to generate QR code</p>
                </div>
                <div v-if="qrError" class="qr-error-overlay">
                  <svg class="error-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                  </svg>
                  <p class="error-text">{{ qrError }}</p>
                </div>
              </div>
            </div>

            <!-- QR Actions -->
            <div class="qr-actions" v-if="qrContent.trim() && !qrError">
              <div class="actions-header">
                <h4 class="actions-title">Download & Share</h4>
                <p class="actions-description">Save or share your generated QR code</p>
              </div>
              <div class="action-buttons">
                <button class="action-btn primary" @click="downloadQR">
                  <svg class="action-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                  </svg>
                  Download PNG
                </button>
                <button class="action-btn secondary" @click="shareQR">
                  <svg class="action-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
                  </svg>
                  Share Link
                </button>
              </div>
            </div>

            <!-- QR Info -->
            <div class="qr-info">
              <div class="info-item">
                <svg class="info-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                </svg>
                <div class="info-content">
                  <span class="info-label">Type</span>
                  <span class="info-value">{{ getTypeName(selectedType) }}</span>
                </div>
              </div>
              <div class="info-item" v-if="qrContent.trim()">
                <svg class="info-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
                </svg>
                <div class="info-content">
                  <span class="info-label">Content Length</span>
                  <span class="info-value">{{ qrContent.length }} characters</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import QRCodeStyling from 'qr-code-styling';

// QR Types
const qrTypes = ref([
  { id: 'url', name: 'Social Media URL' },
  { id: 'whatsapp', name: 'WhatsApp' },
  { id: 'email', name: 'Email' },
  { id: 'wifi', name: 'WiFi' },
]);

const selectedType = ref('url');
const qrContent = ref('');
const qrError = ref('');
const qrCodeElement = ref(null);
let qrCode = null;

// Helper function to get type name
const getTypeName = (typeId) => {
  const type = qrTypes.value.find(t => t.id === typeId);
  return type ? type.name : 'Unknown';
};

// Initialize QR Code generator
const initQRCode = () => {
  qrCode = new QRCodeStyling({
    width: 280,
    height: 280,
    type: "canvas",
    data: "",
    image: "",
    dotsOptions: {
      color: "#fffff",
      type: "rounded"
    },
    backgroundOptions: {
      color: "#ffffff",
    },
    cornersSquareOptions: {
      color: "#9ca3af",
      type: "extra-rounded"
    },
    cornersDotOptions: {
      color: "#9ca3af",
      type: "dot"
    },
    imageOptions: {
      crossOrigin: "anonymous",
      margin: 10
    }
  });
};

// Watch for content changes to generate QR code
watch([qrContent, selectedType], () => {
  generateQRCode();
});

// Generate QR code based on selected type and content
const generateQRCode = () => {
  if (!qrContent.value.trim()) {
    qrError.value = '';
    if (qrCode && qrCodeElement.value) {
      qrCodeElement.value.innerHTML = '';
    }
    return;
  }
  
  qrError.value = '';
  const formattedContent = formatContentForQR(qrContent.value.trim());
  
  if (qrCode) {
    qrCode.update({
      data: formattedContent
    });
    
    if (qrCodeElement.value) {
      qrCodeElement.value.innerHTML = '';
      qrCode.append(qrCodeElement.value);
    }
  }
};

// Format content based on selected type
const formatContentForQR = (content) => {
  switch (selectedType.value) {
    case 'url':
      return content.startsWith('http') ? content : `https://${content}`;
    case 'whatsapp':
      return `https://wa.me/${content.replace(/\D/g, '')}`;
    case 'email':
      return `mailto:${content}`;
    case 'wifi':
      return `WIFI:S:${content.split(',')[0] || 'MyWiFi'};T:WPA;P:${content.split(',')[1] || 'password'};;`;
    default:
      return content;
  }
};

// Get input label based on selected type
const getInputLabel = () => {
  const labels = {
    'url': 'Social Media URL',
    'whatsapp': 'WhatsApp Number',
    'email': 'Email Address',
    'wifi': 'WiFi Details'
    
  };
  return labels[selectedType.value] || 'Content';
};

// Get input description based on selected type
const getInputDescription = () => {
  const descriptions = {
    'url': 'Enter the full Social Media URL (https://...)',
    'whatsapp': 'Enter WhatsApp number with country code',
    'email': 'Enter email address for mailto link',
    'wifi': 'Format: NetworkName,Password'
    
  };
  return descriptions[selectedType.value] || 'Enter the content to encode in QR code';
};

// Get placeholder based on selected type
const getPlaceholder = () => {
  const placeholders = {
    'url': 'https://example.com',
    'whatsapp': '+1234567890',
    'email': 'name@example.com',
    'wifi': 'MyNetwork,MyPassword123'
    
  };
  return placeholders[selectedType.value] || 'Enter your content here...';
};

// Select QR type
const selectType = (type) => {
  selectedType.value = type;
  qrContent.value = '';
};

// Fill with example based on selected type
const fillExample = () => {
  const examples = {
    'url': 'https://www.google.com',
    'whatsapp': '+1234567890',
    'email': 'hello@example.com',
    'wifi': 'HomeWiFi,SecurePassword123'
   
  };
  qrContent.value = examples[selectedType.value] || 'Example content for QR code';
};

// Clear all inputs
const clearAll = () => {
  qrContent.value = '';
  qrError.value = '';
};

// Download QR code
const downloadQR = () => {
  if (qrCode) {
    qrCode.download({
      name: `qr-code-${selectedType.value}-${Date.now()}`,
      extension: "png"
    });
  }
};

// Share QR code
const shareQR = async () => {
  if (navigator.share && qrContent.value.trim()) {
    try {
      await navigator.share({
        title: `QR Code for ${selectedType.value}`,
        text: `Check out this QR code for ${selectedType.value}: ${qrContent.value}`,
        url: window.location.href
      });
    } catch (err) {
      console.log('Error sharing:', err);
      // Fallback to copy
      try {
        await navigator.clipboard.writeText(qrContent.value);
        alert('Content copied to clipboard!');
      } catch (copyErr) {
        console.log('Error copying:', copyErr);
      }
    }
  } else {
    try {
      await navigator.clipboard.writeText(qrContent.value);
      alert('Content copied to clipboard!');
    } catch (err) {
      console.log('Error copying:', err);
    }
  }
};

// Initialize on mount
onMounted(() => {
  initQRCode();
  fillExample();
});
</script>

<style scoped>
.qr-generator-container {
  padding: 20px;
}

.generator-header {
  max-width: 1200px;
  margin: 0;
  padding: 40px 0;
  text-align: center;
}

.header-content {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.main-title {
  font-size: 2.0rem;
  color: #1e293b;
  margin: 0 0 16px 0;
  background: gray;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  font-size: 1.2rem;
  color: #64748b;
  margin: 0;
  line-height: 1.6;
}

.generator-content {
  max-width: 1200px;
  margin: 0 auto;
}

.content-wrapper {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
}

/* Configuration Panel */
.config-panel {
  background: white;
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.config-section {
  margin-bottom: 40px;
}

.config-section:last-child {
  margin-bottom: 0;
}

.section-header {
  margin-bottom: 24px;
}

.section-title {
  font-size: 1.2rem;
  color: #1e293b;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-icon {
  font-size: 1.2rem;
}

.section-description {
  font-size: 0.95rem;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
}

/* Type Grid */
.type-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.type-card {
  position: relative;
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  padding: 24px 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.type-card:hover {
  border-color: #c7d2fe;
  transform: translateY(-4px);
  box-shadow: 0 10px 25px rgba(99, 102, 241, 0.1);
}

.type-card.active {
  border-color: #667eea;
  color: white;
}



.type-card.active .card-label {
  color: black;
  font-weight: 300;
}

.card-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  padding: 12px;
}

.card-icon svg {
  width: 24px;
  height: 24px;
  color: #667eea;
}

.card-label {
  font-size: 0.95rem;
  font-weight: 500;
  color: #475569;
  text-align: center;
}

.active-indicator {
  position: absolute;
  top: 12px;
  right: 12px;
  background: #22c55e;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.active-indicator svg {
  width: 16px;
  height: 16px;
  color: white;
}

/* Input Section */
.input-container {
  margin-top: 8px;
}

.input-label {
  display: block;
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 12px;
}

.required {
  color: #ef4444;
  margin-left: 4px;
}

.input-wrapper {
  position: relative;
}

.content-textarea {
  width: 85%;
  padding: 16px;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 1rem;
  line-height: 1.5;
  resize: vertical;
  transition: all 0.3s ease;
  font-family: 'Inter', sans-serif;
  min-height: 120px;
}

.content-textarea:focus {
  outline: none;
  border-color: #667eea;
  background: white;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

.char-count {
  position: absolute;
  bottom: 12px;
  right: 57px;
  font-size: 0.875rem;
  color: #94a3b8;
  background: rgba(255, 255, 255, 0.9);
  padding: 4px 8px;
  border-radius: 6px;
}

.input-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  color: #64748b;
  margin-top: 12px;
  padding: 12px;
  background: #f1f5f9;
  border-radius: 8px;
}

.hint-icon {
  width: 16px;
  height: 16px;
  color: #64748b;
}

/* Quick Actions */
.quick-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 8px;
}

.quick-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 15px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.quick-btn.primary {
  background: gray;
  color: white;
}

.quick-btn.secondary {
  background: #f1f5f9;
  color: #475569;
  border: 2px solid #e2e8f0;
}


.btn-icon {
  width: 20px;
  height: 20px;
}

/* Preview Panel */
.preview-panel {
  background: white;
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.preview-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.preview-title {
  font-size: 1.2rem;
  color: #1e293b;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.preview-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f0fdf4;
  border-radius: 20px;
  border: 1px solid #bbf7d0;
}

.preview-status.has-error {
  background: #fef2f2;
  border-color: #fecaca;
}

.status-icon {
  width: 16px;
  height: 16px;
}

.status-icon.success {
  color: #22c55e;
}

.status-icon.error {
  color: #ef4444;
}

.status-text {
  font-size: 0.875rem;
  font-weight: 500;
  color: #166534;
}

.preview-status.has-error .status-text {
  color: #991b1b;
}

/* QR Display */
.qr-display {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 32px 0;
}

.qr-wrapper {
  position: relative;
  width: 320px;
  height: 320px;
  background: #f8fafc;
  border-radius: 20px;
  border: 2px dashed #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.qr-wrapper.has-error {
  border-color: #fecaca;
  background: #fef2f2;
}

.qr-code-canvas {
  height: 280px;
}

.qr-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.placeholder-icon {
  width: 64px;
  height: 64px;
  color: #cbd5e1;
}

.placeholder-text {
 font-size: 1rem;
    color: #94a3b8;
    text-align: left;
    margin: 0;
}

.qr-error-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 32px;
}

.error-icon {
  width: 48px;
  height: 48px;
  color: #ef4444;
}

.error-text {
  font-size: 1rem;
  color: #991b1b;
  text-align: center;
  max-width: 240px;
  margin: 0;
  font-weight: 500;
}

/* QR Actions */
.qr-actions {
  margin-top: 32px;
  padding: 24px;
  background: #f8fafc;
  border-radius: 16px;
}

.actions-header {
  margin-bottom: 20px;
}

.actions-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 4px 0;
}

.actions-description {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
}

.action-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 15px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.action-btn.primary {
  background: gray;
  color: white;
}



.action-btn.secondary {
  background: white;
  color: #475569;
  border: 2px solid #e2e8f0;
}



.action-icon {
  width: 20px;
  height: 20px;
}

/* QR Info */
.qr-info {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e2e8f0;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-icon {
  width: 20px;
  height: 20px;
  color: #64748b;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.info-label {
  font-size: 0.875rem;
  color: #64748b;
}

.info-value {
  font-size: 1rem;
  font-weight: 500;
  color: #1e293b;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .content-wrapper {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  
  .generator-header {
    padding: 20px 0;
  }
  
  .header-content {
    padding: 30px 20px;
  }
  
  .main-title {
    font-size: 2.2rem;
  }
}

@media (max-width: 768px) {
  .qr-generator-container {
    padding: 16px;
  }
  
  .type-grid {
    grid-template-columns: 1fr;
  }
  
  .quick-actions {
    grid-template-columns: 1fr;
  }
  
  .action-buttons {
    grid-template-columns: 1fr;
  }
  
  .qr-wrapper {
    width: 280px;
    height: 280px;
  }
  
  .qr-code-canvas {
    height: 240px;
  }
  
  .main-title {
    font-size: 1.8rem;
  }
  
  .subtitle {
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .config-panel,
  .preview-panel {
    padding: 24px 16px;
  }
  
  .qr-wrapper {
    width: 240px;
    height: 240px;
  }
  
  .qr-code-canvas {
    width: 200px;
    height: 200px;
  }
  
  .generator-header {
    margin-bottom: 24px;
  }
  
  .header-content {
    padding: 24px 16px;
  }
}
</style>