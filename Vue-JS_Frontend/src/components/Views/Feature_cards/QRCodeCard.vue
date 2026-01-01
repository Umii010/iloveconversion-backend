<template>
  <div class="feature-card" @click="handleCardClick">
    <div class="card-icon">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zm8-2v8h8V3h-8zm6 6h-4V5h4v4zM3 21h8v-8H3v8zm2-6h4v4H5v-4zm13-2h-2v3h-3v2h3v3h2v-3h3v-2h-3v-3z"/>
      </svg>
    </div>
    <div class="card-content">
      <h3 class="card-title">QR Code Generator</h3>
      <p class="card-description">Generate QR codes for URLs, social media, contacts, payments, and more</p>
    </div>
    <div class="card-arrow">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M10 17l5-5-5-5v10z"/>
      </svg>
    </div>
  </div>
</template>

<script setup>
// const emit = defineEmits(['open']);

// const handleCardClick = () => {
//   emit('open');
// };
</script>

<style scoped>
.feature-card {
  display: flex;
  align-items: center;
  padding: 16px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 16px;
  border: 1px solid #eaeaea;
}

.feature-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: #4f46e5;
}

.card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background-color: #eef2ff;
  border-radius: 10px;
  margin-right: 16px;
  color: #4f46e5;
  flex-shrink: 0;
}

.card-icon svg {
  width: 24px;
  height: 24px;
}

.card-content {
  flex: 1;
  min-width: 0;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px 0;
}

.card-description {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
  line-height: 1.4;
}

.card-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  flex-shrink: 0;
}

.card-arrow svg {
  width: 20px;
  height: 20px;
}
</style>