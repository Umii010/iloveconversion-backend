<template>
  <Transition name="slide-up">
    <div v-if="!consentGiven && !userClosed" class="cookie-consent" :class="{ expanded: expanded }">
      
      <!-- Collapsed Banner -->
      <div v-if="!expanded" class="cookie-collapsed">
        <div class="banner-left">
          <div class="cookie-icon">🍪</div>
          <div class="banner-text">
            <h4 class="banner-title">Your Privacy, Your Choice</h4>
            <p class="banner-description">
              We use cookies to enhance your browsing experience and analyze site traffic.
              <a href="/privacy" target="_blank" class="learn-more-link">Learn more</a>
            </p>
          </div>
        </div>
        <div class="banner-actions">
          <button class="btn-manage" @click="expanded = true">
            <svg class="settings-icon" viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.91,11.36,4.89,11.69,4.89,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
            </svg>
            Manage
          </button>
          <button class="btn-accept-all" @click="acceptAllCookies">
            Accept All
          </button>
        </div>
      </div>

      <!-- Expanded Preferences -->
      <div v-else class="cookie-expanded">
        <div class="expanded-header">
          <button class="back-btn" @click="expanded = false" aria-label="Go back">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
          </button>
          <h3 class="expanded-title">Customize Your Privacy</h3>
          <button class="close-btn" @click="closeBanner" aria-label="Close">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
        
        <div class="expanded-content">
          <div class="privacy-intro">
            <div class="privacy-icon">🔐</div>
            <p class="privacy-text">
              Your privacy matters. Choose which cookies you allow us to use. 
              You can change these settings anytime.
            </p>
          </div>
          
          <div class="preferences-container">
            <!-- Essential Cookies -->
            <div class="preference-card essential">
              <div class="card-header">
                <div class="card-title-group">
                  <span class="preference-badge">Required</span>
                  <h4 class="card-title">Essential Cookies</h4>
                </div>
                <div class="card-status">
                  <span class="status-dot active"></span>
                  <span class="status-text">Always Active</span>
                </div>
              </div>
              <p class="card-description">
                Necessary for the website to function. These enable basic features 
                like page navigation and access to secure areas.
              </p>
            </div>
            
            <!-- Analytics Cookies -->
            <div class="preference-card" :class="{ active: preferences.analytics }">
              <div class="card-header">
                <div class="card-title-group">
                  <span class="preference-badge analytics">Optional</span>
                  <h4 class="card-title">Analytics & Performance</h4>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" v-model="preferences.analytics">
                  <span class="toggle-slider"></span>
                </label>
              </div>
              <p class="card-description">
                Help us understand how visitors interact with our website by 
                collecting information anonymously.
              </p>
              <div class="card-benefits">
                <span class="benefit-tag">
                  <svg viewBox="0 0 24 24" width="14" height="14">
                    <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                  Site improvement
                </span>
                <span class="benefit-tag">
                  <svg viewBox="0 0 24 24" width="14" height="14">
                    <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                  Better experience
                </span>
              </div>
            </div>
            
            <!-- Advertising Cookies -->
            <div class="preference-card" :class="{ active: preferences.advertising }">
              <div class="card-header">
                <div class="card-title-group">
                  <span class="preference-badge advertising">Optional</span>
                  <h4 class="card-title">Marketing & Advertising</h4>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" v-model="preferences.advertising">
                  <span class="toggle-slider"></span>
                </label>
              </div>
              <p class="card-description">
                Used to show you relevant ads and measure campaign effectiveness. 
                May be set by advertising partners.
              </p>
              <div class="card-benefits">
                <span class="benefit-tag">
                  <svg viewBox="0 0 24 24" width="14" height="14">
                    <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                  Personalized content
                </span>
                <span class="benefit-tag">
                  <svg viewBox="0 0 24 24" width="14" height="14">
                    <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                  Relevant ads
                </span>
              </div>
            </div>
          </div>
          
          <div class="actions-section">
            <div class="action-buttons">
              <button class="btn-save" @click="savePreferences" 
                      :disabled="!hasInteracted"
                      :class="{ disabled: !hasInteracted }">
                <span v-if="hasInteracted">Save Preferences</span>
                <span v-else class="btn-hint">Adjust settings to save</span>
              </button>
              <button class="btn-accept-expanded" @click="acceptAllCookies">
                Accept All Cookies
              </button>
            </div>
            
            <div class="privacy-links">
              <a href="/privacy" target="_blank" class="privacy-link">
                <svg viewBox="0 0 24 24" width="14" height="14">
                  <path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                </svg>
                Privacy Policy
              </a>
              <a href="/cookies" target="_blank" class="privacy-link">
                <svg viewBox="0 0 24 24" width="14" height="14">
                  <path fill="currentColor" d="M21 6h-7.59l3.29-3.29L16 2l-4 4-4-4-.71.71L10.59 6H3a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8a2 2 0 0 0-2-2zm0 14H3V8h18v12zM9 10v8l7-4z"/>
                </svg>
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from "vue";
import Cookies from "js-cookie";

const consentGiven = ref(false);
const userClosed = ref(false);
const expanded = ref(false);
const hasInteracted = ref(false);

const preferences = reactive({
  essential: true,
  analytics: false,
  advertising: false
});

// 🔴 Function to update Google Consent Mode
function updateGoogleConsent() {
  if (window.gtag) {
    window.gtag('consent', 'update', {
      'ad_storage': preferences.advertising ? 'granted' : 'denied',
      'analytics_storage': preferences.analytics ? 'granted' : 'denied',
      'ad_user_data': preferences.advertising ? 'granted' : 'denied',
      'ad_personalization': preferences.advertising ? 'granted' : 'denied'
    });
    
    console.log('✅ Google Consent Mode updated:', {
      analytics: preferences.analytics ? 'granted' : 'denied',
      advertising: preferences.advertising ? 'granted' : 'denied'
    });
  }
}

// 🔴 Function to send event to Google Analytics
function trackGAEvent(eventName, eventParams = {}) {
  if (window.gtag && preferences.analytics) {
    window.gtag('event', eventName, {
      'event_category': 'Cookie Consent',
      'event_label': eventName,
      ...eventParams
    });
    console.log(`📊 GA Event: ${eventName}`, eventParams);
  }
}

onMounted(() => {
  const saved = Cookies.get("cookieConsent");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      consentGiven.value = true;
      Object.assign(preferences, parsed.preferences);
      
      // 🔴 Update Google Consent Mode with saved preferences
      updateGoogleConsent();
      
      if (parsed.timestamp) {
        console.log("Consent given on:", new Date(parsed.timestamp).toLocaleDateString());
      }
      
      // Track that consent was loaded from cookie
      trackGAEvent('consent_loaded_from_cookie');
    } catch (e) {
      console.error("Error parsing cookie consent:", e);
    }
  }
});

watch(preferences, () => {
  hasInteracted.value = true;
}, { deep: true });

function acceptAllCookies() {
  console.log("✅ Accept All clicked");
  preferences.analytics = true;
  preferences.advertising = true;
  saveConsent();
}

function savePreferences() {
  if (!hasInteracted.value) {
    console.log("⚠️ No preferences changed");
    return;
  }
  saveConsent();
}

function saveConsent() {
  console.log("💾 Saving consent...");
  
  const consentData = {
    timestamp: new Date().toISOString(),
    version: "1.0",
    preferences: { ...preferences }
  };
  
  // Save to cookie
  Cookies.set("cookieConsent", JSON.stringify(consentData), { 
    expires: 365, 
    path: '/',
    sameSite: 'strict',
    secure: import.meta.env.PROD
  });
  
  consentGiven.value = true;
  expanded.value = false;
  
  // 🔴 1. Update Google Consent Mode FIRST
  updateGoogleConsent();
  
  // 🔴 2. Track the consent event in GA
  trackGAEvent('consent_saved', {
    analytics_accepted: preferences.analytics,
    advertising_accepted: preferences.advertising
  });
  
  // 🔴 3. If analytics accepted, track page view
  if (preferences.analytics && window.gtag) {
    window.gtag('event', 'page_view', {
      page_title: document.title,
      page_location: window.location.href,
      page_path: window.location.pathname
    });
  }
  
  // 🔴 4. Load advertising if accepted
  if (preferences.advertising) {
    loadAds();
  }
  
  console.log("✅ Consent saved successfully!");
}

function closeBanner() {
  userClosed.value = true;
  Cookies.set("cookieBannerClosed", "true", { expires: 7 });
  
  // Track banner closed without consent
  trackGAEvent('banner_closed_without_consent');
}

function loadAds() {
  console.log("📢 Loading advertising scripts...");
  // Add your advertising scripts here (Google Ads, Facebook Pixel, etc.)
}

// 🔴 Export this function so other components can track tool usage
function trackToolUsage(toolName, action = 'use', metadata = {}) {
  if (window.gtag && preferences.analytics) {
    window.gtag('event', 'tool_used', {
      'tool_name': toolName,
      'action': action,
      'event_category': 'Tools',
      'event_label': `${toolName} - ${action}`,
      ...metadata
    });
    
    console.log(`🛠️ Tool tracked: ${toolName} - ${action}`, metadata);
  }
}

// 🔴 Make functions available globally (optional)
if (typeof window !== 'undefined') {
  window.trackToolUsage = trackToolUsage;
}
</script>

<style scoped>
.cookie-consent {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background: white;
  color: black;
  z-index: 9999;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.cookie-consent.expanded {
  background: white;
  color: #333;
  box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.15);
}

.cookie-collapsed {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.banner-left {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  flex: 1;
}

.cookie-icon {
  font-size: 32px;
  line-height: 1;
}

.banner-text {
  flex: 1;
}
.banner-title {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: black;
}
.banner-description {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: black;
  max-width: 600px;
}
.learn-more-link {
  color: rgba(255, 255, 255, 0.9);
  text-decoration: underline;
  margin-left: 8px;
  transition: color 0.2s;
}
.learn-more-link:hover {
  color: white;
}

.banner-actions {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}
.btn-manage {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: black;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-accept-all {
  padding: 12px 32px;
  background: black;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 300;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}
.settings-icon {
  flex-shrink: 0;
}

.cookie-expanded {
  max-height: 70vh;
  overflow-y: auto;
}
.expanded-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  background: white;
  position: sticky;
  top: 0;
  z-index: 10;
}
.back-btn, .close-btn {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  color: #6b7280;
  border-radius: 8px;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.back-btn:hover, .close-btn:hover {
  background: #f3f4f6;
}
.expanded-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  text-align: center;
  flex: 1;
}
.expanded-content {
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
}
.privacy-intro {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  padding: 10px;
  border-radius: 12px;
  margin-bottom: 10px;
  border-left: 4px solid #0ea5e9;
}
.privacy-icon {
  font-size: 16px;
  flex-shrink: 0;
}
.privacy-text {
  margin: 0;
  color: #0369a1;
  font-size: 15px;
  line-height: 1.6;
  font-weight: 500;
}
.preferences-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 32px;
}
.preference-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 15px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}
.preference-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: #e5e7eb;
  transition: background 0.3s;
}
.preference-card.essential::before {
  background: #059669;
}
.preference-card.active::before {
  background: #8b5cf6;
}
.preference-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}
.card-title-group {
  flex: 1;
}
.preference-badge {
  display: inline-block;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-radius: 20px;
  margin-bottom: 8px;
  background: #f3f4f6;
  color: #6b7280;
}
.preference-badge.analytics {
  background: #f0f9ff;
  color: #0369a1;
}
.preference-badge.advertising {
  background: #fef3c7;
  color: #92400e;
}
.card-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}
.card-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #6b7280;
}
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #dc2626;
}
.status-dot.active {
  background: #059669;
}
.card-description {
  margin: 0 0 12px 0;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.6;
}
.card-benefits {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.benefit-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: #f3f4f6;
  color: #4b5563;
  font-size: 12px;
  font-weight: 500;
  border-radius: 20px;
  transition: all 0.2s;
}

.preference-card.active .benefit-tag {
  background: #8b5cf6;
  color: white;
}
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 52px;
  height: 28px;
}
.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #d1d5db;
  transition: .4s;
  border-radius: 34px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}
.toggle-slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}
input:checked + .toggle-slider {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
}
input:checked + .toggle-slider:before {
  transform: translateX(24px);
}
input:focus + .toggle-slider {
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2);
}
.actions-section {
  border-top: 1px solid #e5e7eb;
}

.action-buttons {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.btn-save {
  padding: 10px 12px;
  background: #111827;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}
.btn-save:hover:not(.disabled) {
  background: #1f2937;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}
.btn-save.disabled {
  background: #9ca3af;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}
.btn-hint {
  font-weight: normal;
  font-size: 14px;
  opacity: 0.9;
}

.btn-accept-expanded {
  padding: 16px 24px;
  background: black;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.3s;
}
.privacy-links {
  display: flex;
  justify-content: center;
  gap: 24px;
}
.privacy-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #6b7280;
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  transition: color 0.2s;
}
.privacy-link:hover {
  color: #4b5563;
}
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(100%);
}
@media (max-width: 768px) {
  .cookie-collapsed {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
    padding: 16px;
  }
  
  .banner-left {
    gap: 12px;
  }
  
  .cookie-icon {
    font-size: 24px;
  }
  
  .banner-actions {
    width: 100%;
    flex-direction: column;
  }
  
  .banner-actions button {
    width: 100%;
    justify-content: center;
  }
  
  .expanded-header {
    padding: 16px;
  }
  
  .expanded-content {
    padding: 16px;
  }
  
  .privacy-intro {
    flex-direction: column;
    text-align: center;
  }
  
  .privacy-icon {
    align-self: center;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .privacy-links {
    flex-direction: column;
    gap: 12px;
    align-items: center;
  }
}

@media (max-width: 480px) {
  .banner-title {
    font-size: 14px;
  }
  
  .banner-description {
    font-size: 13px;
  }
  
  .expanded-title {
    font-size: 16px;
  }
  
  .preference-card {
    padding: 16px;
  }
  
  .card-header {
    flex-direction: column;
    gap: 12px;
  }
}
</style>