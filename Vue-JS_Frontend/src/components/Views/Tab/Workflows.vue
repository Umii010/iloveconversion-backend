<script setup>
import { ref } from 'vue'

import Merge_PDF from '../cards/Merge_PDF.vue'
import Split_PDF from '../cards/Split_PDF.vue'
import Compress_PDF from '../cards/Compress_PDF.vue'

import Merge_popup from '../Card_pop/Merge_popup.vue';
import Split_popup from '../Card_pop/Split_popup.vue';

const CardComponent = ref(null)

const components = {
  Merge_popup,
    Split_popup
}
</script>
<template>
  <div class="all__page">
    <div class="card--section">
      <!-- Merge Card -->
      <!-- <Merge_PDF @click="CardComponent = 'Merge_popup'"/> -->
      <!-- Split Card -->
      <Split_PDF @click="CardComponent = 'Split_popup'"/>
      <!-- Compress Card -->
      <Compress_PDF @click="CardComponent = 'Merge_popup'"/>
    </div>
    <div class="popup--section" v-if="CardComponent">
  <div class="popup-overlay" @click="CardComponent = null"></div>

  <div class="popup-box">
    <!-- Close Button -->
    <button class="popup-close" @click="CardComponent = null">×</button>

    <!-- Dynamic Popup Component -->
    <component :is="components[CardComponent]" />
  </div>
</div>
  </div>

  
</template>
<style scoped>
.card--section {
    display: flex;
    gap: 20px;
    justify-content: center;
}

.card {
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 20px;
    width: 320px;
    text-align: center;
    box-shadow: 2px 2px 12px rgba(0, 0, 0, 0.1);
    background-color: #ffffff;
    cursor: pointer;
    transition: all 0.3s ease;
}

.card:hover {
    background: radial-gradient(
        ellipse at right top,
        #107667ed 30%,
        #ffffff 79%,
        #ffffff 90%
    );
    transform: translateY(-6px);
    box-shadow: 4px 8px 20px rgba(0,0,0,0.25);
}

.card:active {
    transform: scale(0.97);
}

.popup--section {
  position: fixed;
  inset: 0;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Dark Background */
.popup-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
}

/* Popup Box */
.popup-box {
  position: relative;
  z-index: 10;
  width: 520px;
  max-width: 90%;
  background: #ffffff;
  border-radius: 14px;
  padding: 30px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  animation: popupScale 0.3s ease;
}

/* Close Button */
.popup-close {
  position: absolute;
  top: 12px;
  right: 14px;
  background: none;
  border: none;
  font-size: 26px;
  cursor: pointer;
  color: #555;
}

.popup-close:hover {
  color: #000;
}

/* Animation */
@keyframes popupScale {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
@media (max-width: 1024px){
    .card--section {
        width: 100%;
        flex-wrap: wrap;
    }
    .all__page {
        justify-content: center;
    display: flex;
    }
}
@media (max-width: 540px){
  .card{
    width: auto;
  }
}
</style>