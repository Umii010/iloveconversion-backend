<script setup>
import { ref } from 'vue'

import Merge_PDF from '../cards/Merge_PDF.vue'
import Split_PDF from '../cards/Split_PDF.vue'
import Compress_PDF from '../cards/Compress_PDF.vue'
import Pdf_to_word from '../cards/Pdf_to_word.vue'
import Word_to_pdf from '../cards/Word_to_pdf.vue'
import Pdf_to_Png from '../cards/Pdf_to_Png.vue'
import Images_to_pdf from '../cards/Images_to_pdf.vue'
import Protect_PDF from '../cards/Protect_PDF.vue'
import Unlock_PDF from '../cards/Unlock_PDF.vue'
import Rotate_PDF from '../cards/Rotate_pdf.vue'
import Crop_PDF from '../cards/Crop-pdf.vue'
import OCR_PDF from '../cards/Ocr-pdf.vue';
import Organize_PDF from '../cards/Organize-pdf.vue'
import PDFtoppt from '../cards/Pdf-to-ppt.vue'
import PPttopdf from '../cards/Ppt-to-pdf.vue'
import Pdftoexcel from '../cards/Pdf-to-excel.vue'
import Repairpdf from '../cards/Repair-pdf.vue'
import Signpdf from '../cards/Sign-pdf.vue'
import AddPageNumber from '../cards/Add-page-numbers.vue'
import SplitPdf from '../cards/Split-pdf.vue'
  

import Merge_popup from '../Card_pop/Merge_popup.vue'
import Split_popup from '../Card_pop/Split_popup.vue'
import Compress_popup from '../Card_pop/compress_popup.vue'

import Pdf_to_word_popup from '../Card_pop/pdf_to_word_popup.vue'
import Word_to_pdf_popup from '../Card_pop/word_to_pdf_popup.vue'
import Pdf_to_Png_popup from '../Card_pop/Pdf_to_Png_popup.vue'
import Images_to_pdf_popup from '../Card_pop/Images_to_Pdf_popup.vue'
import Protect_pdf_popup from '../Card_pop/Protect_PDF_popup.vue'
import Unlock_pdf_popup from '../Card_pop/Unlock_pdf_popup.vue'
import Rotate_PDF_popup from '../Card_pop/Rotate_pdf_popup.vue'
import CropPdfPopup from '../Card_pop/Crop-pdf-popup.vue'
import Ocrpdfpopup from '../Card_pop/Ocr-pdf-popup.vue'
import OrganizePdfPopup from '../Card_pop/Organize-pdf-popup.vue'
import Pdf_to_ppt_popup from '../Card_pop/Pdf-to-ppt-popup.vue'
import PPt_to_pdf_popup from '../Card_pop/Ppt-to-pdf-popup.vue'
import Pdf_to_excel_popup from '../Card_pop/Pdf-to-excel-popup.vue'
import Repair_pdf_popup from '../Card_pop/Repair-pdf-popup.vue'
import Sign_pdf_popup from '../Card_pop/Sign-pdf-popup.vue'
import Add_page_number_popup from '../Card_pop/Add-page-numbers-popup.vue'
import Split_pdf_popup from '../Card_pop/Split_popup.vue'

const CardComponent = ref(null)

const components = {
  Merge_popup,
    Split_popup,
    Compress_popup,
    Pdf_to_word_popup,
    Word_to_pdf_popup,
    Pdf_to_Png_popup,
    Images_to_pdf_popup,
    Protect_pdf_popup,
    Unlock_pdf_popup,
  Rotate_pdf_popup: Rotate_PDF_popup,
  CropPdfPopup,
  Ocrpdfpopup,
  OrganizePdfPopup,
  Pdf_to_ppt_popup,
  PPt_to_pdf_popup,
  Pdf_to_excel_popup,
  Repair_pdf_popup,
  Sign_pdf_popup,
  Add_page_number_popup,
  Split_pdf_popup
}

</script>
<template>
  <div class="all__page">
    <div class="card--section">
      <!-- Merge Card -->
      <Merge_PDF @click="CardComponent = 'Merge_popup'"/>
      <!-- Split Card -->
      <Split_PDF @click="CardComponent = 'Split_popup'"/>
      <!-- Compress Card -->
      <Compress_PDF @click="CardComponent = 'Compress_popup'"/>
      <!--Pdf To Word-->
      <Pdf_to_word  @click="CardComponent = 'Pdf_to_word_popup'"/>
      <!--Word to PDF-->
      <Word_to_pdf  @click="CardComponent = 'Word_to_pdf_popup'"/>
      <!--Pdf To Png Popup-->
      <Pdf_to_Png @click="CardComponent = 'Pdf_to_Png_popup'"/>

      <!--Jpg to PDF Popup-->
      <Images_to_pdf @click="CardComponent = 'Images_to_pdf_popup'"/>

      <!--Protect PDF-->
      <Protect_PDF @click="CardComponent = 'Protect_pdf_popup'"/>
      <!--Unlock PDF-->
      <Unlock_PDF @click="CardComponent = 'Unlock_pdf_popup'"/>

      <Rotate_PDF @click="CardComponent = 'Rotate_pdf_popup'"/>
      <Crop_PDF @click="CardComponent = 'CropPdfPopup'"/>
      <OCR_PDF @click="CardComponent = 'Ocrpdfpopup'"/>
      <Organize_PDF @click="CardComponent = 'OrganizePdfPopup'"/>
      <PDFtoppt @click="CardComponent = 'Pdf_to_ppt_popup'"/>
      <PPttopdf @click="CardComponent = 'PPt_to_pdf_popup'"/>
      <Pdftoexcel @click="CardComponent = 'Pdf_to_excel_popup'"/>
      <Repairpdf @click="CardComponent = 'Repair_pdf_popup'"/>
      <Signpdf @click="CardComponent = 'Sign_pdf_popup'"/>
      <AddPageNumber @click="CardComponent = 'Add_page_number_popup'"/>
      <SplitPdf @click="CardComponent = 'Split_pdf_popup'"/>










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