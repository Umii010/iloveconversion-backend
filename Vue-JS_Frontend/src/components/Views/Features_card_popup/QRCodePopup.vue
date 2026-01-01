<template>
  <div class="qr-popup-content">
    <div class="popup-header">
      <h2 class="popup-title">Generate QR Code</h2>
    </div>
    
    <div class="popup-content">
      <!-- QR Type Selection -->
      <div class="section">
        <h3 class="section-title">Select Type</h3>
        <div class="type-grid">
          <button 
            v-for="type in qrTypes" 
            :key="type.id"
            class="type-button"
            :class="{ active: selectedType === type.id }"
            @click="selectType(type.id)"
          >
            <div class="type-icon">
              <component :is="type.icon" />
            </div>
            <span class="type-name">{{ type.name }}</span>
          </button>
        </div>
      </div>
      
      <!-- Input Section -->
      <div class="section">
        <h3 class="section-title">Enter Details</h3>
        <div class="input-group">
          <label class="input-label">{{ getInputLabel() }}</label>
          <textarea 
            v-model="qrContent"
            class="content-input"
            :placeholder="getPlaceholder()"
            rows="3"
          ></textarea>
          <div class="input-hint" v-if="selectedType === 'phone'">
            Format: +1234567890 (with country code)
          </div>
          <div class="input-hint" v-if="selectedType === 'whatsapp'">
            Format: +1234567890 (with country code)
          </div>
        </div>
      </div>
      
      <!-- QR Code Display -->
      <div class="section" v-if="qrContent.trim()">
        <h3 class="section-title">Generated QR Code</h3>
        <div class="qr-container">
          <div class="qr-code-wrapper">
            <div ref="qrCodeElement" class="qr-code"></div>
            <div v-if="qrError" class="qr-error">
              {{ qrError }}
            </div>
          </div>
          
          <!-- QR Code Actions -->
          <div class="qr-actions" v-if="qrContent.trim() && !qrError">
            <button class="action-button secondary" @click="downloadQR">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
              </svg>
              Download
            </button>
            <button class="action-button secondary" @click="shareQR">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
              </svg>
              Share
            </button>
          </div>
        </div>
      </div>
      
      <!-- Quick Actions -->
      <div class="section">
        <h3 class="section-title">Quick Actions</h3>
        <div class="quick-actions">
          <button class="quick-action" @click="fillExample">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            Fill Example
          </button>
          <button class="quick-action" @click="clearAll">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
            Clear All
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, h } from 'vue';
import QRCodeStyling from 'qr-code-styling';

const emit = defineEmits(['close']);

// QR Types (simplified without h() for clarity - use actual components or simpler approach)
const qrTypes = ref([
  { id: 'url', name: 'Website URL', icon: { template: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>' } },
  { id: 'phone', name: 'Phone Number', icon: { template: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>' } },
  { id: 'whatsapp', name: 'WhatsApp', icon: { template: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M16.75 13.96c.25.13.41.2.46.3.06.11.04.61-.21 1.18-.2.56-1.24 1.1-1.7 1.12-.46.02-.47.36-2.96-.73-2.49-1.09-3.99-3.75-4.11-3.92-.12-.17-.96-1.38-.92-2.61.05-1.22.69-1.8.95-2.04.24-.26.51-.29.68-.26h.47c.15 0 .36-.06.55.45l.69 1.87c.06.13.1.28.01.44l-.27.41-.39.42c-.12.12-.26.25-.12.5.12.26.62 1.09 1.32 1.78.91.88 1.71 1.17 1.95 1.3.24.14.39.12.54-.04l.81-.94c.19-.25.35-.19.58-.11l1.67.88M12 2a10 10 0 0 1 10 10 10 10 0 0 1-10 10c-1.97 0-3.8-.57-5.35-1.55L2 22l1.55-4.65A9.969 9.969 0 0 1 2 12 10 10 0 0 1 12 2m0 2a8 8 0 0 0-8 8c0 1.72.54 3.31 1.46 4.61L4.5 19.5l2.89-.96A7.95 7.95 0 0 0 12 20a8 8 0 0 0 8-8 8 8 0 0 0-8-8z"/></svg>' } },
  { id: 'email', name: 'Email', icon: { template: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>' } },
  { id: 'wifi', name: 'WiFi', icon: { template: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/></svg>' } },
  { id: 'payment', name: 'EasyPaisa', icon: { template: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg>' } },
]);

const selectedType = ref('url');
const qrContent = ref('');
const qrError = ref('');
const qrCodeElement = ref(null);
let qrCode = null;

// Initialize QR Code generator
const initQRCode = () => {
  qrCode = new QRCodeStyling({
    width: 200,
    height: 200,
    type: "canvas",
    data: "",
    image: "",
    dotsOptions: {
      color: "#000000",
      type: "rounded"
    },
    backgroundOptions: {
      color: "#ffffff",
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
    qrError.value = 'Please enter content to generate QR code';
    if (qrCode && qrCodeElement.value) {
      qrCode.append(qrCodeElement.value);
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
    case 'phone':
      return `tel:${content}`;
    case 'whatsapp':
      return `https://wa.me/${content.replace(/\D/g, '')}`;
    case 'email':
      return `mailto:${content}`;
    case 'wifi':
      return `WIFI:S:${content.split(',')[0] || 'MyWiFi'};T:WPA;P:${content.split(',')[1] || 'password'};;`;
    case 'payment':
      return content;
    default:
      return content;
  }
};

// Get input label based on selected type
const getInputLabel = () => {
  const labels = {
    'url': 'Website URL',
    'phone': 'Phone Number',
    'whatsapp': 'WhatsApp Number',
    'email': 'Email Address',
    'wifi': 'WiFi Details (Network,Password)',
    'payment': 'Payment Details (Account/Number)'
  };
  return labels[selectedType.value] || 'Content';
};

// Get placeholder based on selected type
const getPlaceholder = () => {
  const placeholders = {
    'url': 'https://example.com',
    'phone': '+1234567890',
    'whatsapp': '+1234567890',
    'email': 'name@example.com',
    'wifi': 'MyNetwork,MyPassword',
    'payment': '03123456789 (for EasyPaisa)'
  };
  return placeholders[selectedType.value] || 'Enter text or URL...';
};

// Select QR type
const selectType = (type) => {
  selectedType.value = type;
  qrContent.value = '';
};

// Fill with example based on selected type
const fillExample = () => {
  const examples = {
    'url': 'https://vuejs.org',
    'phone': '+1234567890',
    'whatsapp': '+1234567890',
    'email': 'hello@example.com',
    'wifi': 'HomeWiFi,SecurePassword123',
    'payment': '03123456789'
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
      name: `qr-code-${selectedType.value}`,
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

// Add escape key listener
const handleEscape = (e) => {
  if (e.key === 'Escape') {
    emit('close');
  }
};

window.addEventListener('keydown', handleEscape);
</script>

<style scoped>
.qr-popup-content {
  width: 100%;
}

.popup-header {
  margin-bottom: 24px;
}

.popup-title {
  font-size: 24px;
  font-weight: 600;
  color: #111827;
  margin: 0;
  text-align: center;
}

.popup-content {
  width: 100%;
}

.section {
  margin-bottom: 28px;
}

.section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 16px 0;
}

.type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
}

.type-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  background-color: white;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.type-button:hover {
  border-color: #4f46e5;
  transform: translateY(-2px);
}

.type-button.active {
  border-color: #4f46e5;
  background-color: #eef2ff;
}

.type-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4f46e5;
  margin-bottom: 8px;
}

.type-icon svg {
  width: 20px;
  height: 20px;
}

.type-name {
  font-size: 12px;
  font-weight: 500;
  color: #374151;
  text-align: center;
}

.input-group {
  margin-bottom: 16px;
}

.input-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

.content-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
  transition: border-color 0.2s;
  font-family: inherit;
}

.content-input:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.input-hint {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

.qr-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.qr-code-wrapper {
  background-color: white;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.qr-code {
  width: 200px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-error {
  text-align: center;
  color: #dc2626;
  font-size: 14px;
  margin-top: 10px;
}

.qr-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background-color: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-button:hover {
  background-color: #4338ca;
  transform: translateY(-1px);
}

.action-button.secondary {
  background-color: white;
  color: #374151;
  border: 1px solid #d1d5db;
}

.action-button.secondary:hover {
  background-color: #f9fafb;
  border-color: #9ca3af;
}

.action-button svg {
  width: 18px;
  height: 18px;
}

.quick-actions {
  display: flex;
  gap: 12px;
}

.quick-action {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  background-color: white;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
}

.quick-action:hover {
  background-color: #f9fafb;
  border-color: #9ca3af;
}

.quick-action svg {
  width: 18px;
  height: 18px;
}

@media (max-width: 640px) {
  .type-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .qr-actions {
    flex-direction: column;
    width: 100%;
  }
  
  .action-button {
    width: 100%;
    justify-content: center;
  }
  
  .popup-title {
    font-size: 20px;
  }
}
</style>