<script setup>
import Header from './components/Header.vue'
import Footer from './components/Footer.vue'
import CookieConsent from './components/Views/CookieConsent.vue';
</script>

<template>
  <div class="layout">
    <header class="header">
      <Header />
    </header>

    <main class="content">
      <router-view />
       <CookieConsent /> 
    </main>

    <footer class="footer">
      <Footer />
    </footer>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* TOP */
.header {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: #fff;
  border-radius: 50px;
  margin-inline: 20px;
}

.content {
  flex: 1;
  padding: 8px;
  overflow-y: auto;
}

.footer {
  position: sticky;
  bottom: 0;
  background: #fff;
}
</style>
