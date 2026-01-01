<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import QRCode from './QRGeneratorPage.vue';

const router = useRouter()

// const openQRCodePage = () => {
//   // Navigate to a separate QR code page
//   router.push('/qr-generator')
// }
</script>
<template>
  <div class="all__page">
    <div class="card--section">
      <!-- Change click handler to navigate to a new page -->
      <QRCode @click="openQRCodePage"/>
    </div>
  </div>
</template>

<style scoped>
/* Keep all your existing styles */
.card--section {
    display: flex;
    gap: 20px;
    justify-content: center;
    flex-wrap: wrap;
}

.card {
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 20px;
    width: 300px;
    text-align: center;
    box-shadow: 2px 2px 12px rgba(0, 0, 0, 0.1);
    background-color: #ffffff;
    cursor: pointer;
    transition: all 0.3s ease;
}

.card:hover {
    transform: translateY(-6px);
    box-shadow: 4px 8px 20px rgba(0,0,0,0.25);
}

.card:active {
    transform: scale(0.97);
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