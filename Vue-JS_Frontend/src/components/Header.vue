<script setup>
import { ref } from 'vue'

const isMenuOpen = ref(false)

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}
</script>

<template>
    <header class="app-header">
        <div class="header__section">
            <div class="site__logo">
                <img src="../assets/images/logo-converter.png" alt="Logo" class="app-logo" />
            </div>
            <div class="mobile_menu__section">
    <button
      class="mobile-button"
      @click="toggleMenu"
      aria-label="Toggle Menu"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="55" height="55" viewBox="0 0 24 24" fill="none">
        <path d="M5 17H13M5 12H19M11 7H19"
          stroke="#000"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"/>
      </svg>
    </button>
  </div>
  <div class="overlay" v-if="isMenuOpen" @click="toggleMenu"></div>

  <!-- Right Side Menu -->
  <div class="mobile__menu__section" :class="{ open: isMenuOpen }">
    <ul class="menu">
  <li>
    <router-link to="/" class="menu-item">
      <span class="icon">
        <img src="@/assets/images/icons8-home-24.gif" class="menu-icon" />
      </span>
      Home
    </router-link>
  </li>

  <li>
    <router-link to="/developer-tools" class="menu-item">
      <span class="icon">
        <img src="@/assets/images/icons8-service-50.gif" class="menu-icon" />
      </span>
      Developer Tools
    </router-link>
  </li>

  <li>
    <router-link to="/pdf" class="menu-item">
      <span class="icon">
        <img src="@/assets/images/icons8-pdf-48.gif" class="menu-icon" />
      </span>
      Convert PDF
    </router-link>
  </li>

  <li>
    <router-link to="/features" class="menu-item">
      <span class="icon">⭐</span>
      QR Code
    </router-link>
  </li>
</ul>
  </div>
            <div class="menu__section">
                <ul class="menu">
  <li>
    <router-link to="/" class="menu-item">
      <span class="icon">
        <img src="@/assets/images/icons8-home-24.gif" class="menu-icon" />
      </span>
      Home
    </router-link>
  </li>

  <li>
    <router-link to="/service" class="menu-item">
      <span class="icon">
        <img src="@/assets/images/icons8-service-50.gif" class="menu-icon" />
      </span>
      Services
    </router-link>
  </li>

  <li>
    <router-link to="/pdf" class="menu-item">
      <span class="icon">
        <img src="@/assets/images/icons8-pdf-48.gif" class="menu-icon" />
      </span>
      Convert PDF
    </router-link>
  </li>

  <li>
    <router-link to="/features" class="menu-item">
      <span class="icon">⭐</span>
      QR Code
    </router-link>
  </li>
</ul>


            </div>
            <div class="login__section">
                <div class="cta-wrapper">
  <button class="cta-btn">
    Open Account
  </button>
<div>
    <span class="arrow">
      ↗
    </span>
</div></div>
            </div>
        </div>
    </header>
</template>
<style scoped>
  .mobile__menu__section{
    display: none;
  }
.app-header {
    background-color: #ffffff;
    padding: 10px;
    color: white;
    text-align: center;
    margin-inline: 10px;
    border-radius: 50px;
}
.header__section {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.site__logo {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 20%;
}
.site__logo .app-logo {
    width: 70%;
    height: 70%;
    border-radius: 40px;
}
/* ---- secondary menu style ---- */
.menu__section {
    width: 60%;
    display: flex;
    justify-content: center;
}
.menu {
  display: flex;
  gap: 12px;
  background: #f5f6f7;
  padding: 8px;
  border-radius: 40px;
  list-style: none;
  margin: 0;
}

.menu li {
  list-style: none;
}

/* router-link full pill */
.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px;
  border-radius: 30px;
  font-size: 14px;
  color: #555;
  text-decoration: none;
  transition: all 0.3s ease;
}

/* icon wrapper */
.icon {
  width: 26px;
  height: 26px;
  background: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* gif icon */
.menu-icon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
}

/* hover */
.menu-item:hover {
  background: #e9eaec;
}

/* ACTIVE ROUTE (AUTO) */
.router-link-active,
.router-link-exact-active {
  background: #ffffff;
  color: #000;
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
}

/* ---- thrid login style ---- */
.login__section {
    width: 20%;
    display: flex;
    justify-content: flex-end;
    padding-right: 20px;
}
.cta-wrapper{
    display: flex;
    align-items: center;
    gap: 4px;
}
.cta-btn {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 20px;
  background: #d9f25f;
  border: none;
  border-radius: 40px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  color: #000;
}

.arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  cursor: pointer;
  background: #000;
  color: #fff;
  border-radius: 50%;
  font-size: 22px;
  padding-bottom: 2px;
}

.cta-btn:hover {
  opacity: 0.9;
}
.mobile_menu__section {
  display: none;
}

/* Show on mobile screens */
@media (max-width: 1024px) { 
  .mobile_menu__section {
    display: block;
  }
  .menu__section, .login__section {
    display: none;
  }
  .mobile-button{
    background: none;
    border: none;
    cursor: pointer;
    padding-right: 20px;
  }
  .site__logo {
    width: auto;
    justify-content: left;
    align-items: center;
    padding-left: 10px;
  }
  .site__logo .app-logo {
    width: 50%;
    height: 50%;
    border-radius: 40px;
}
.mobile-button svg{
    width: 35px;
    height: 35px;
  }
  /* Menu container */
  .mobile__menu__section{
    display: block;
  }
.mobile__menu__section {
  position: fixed;
  top: 0;
  right: -340px;
  width: 260px;
  height: 100%;
  background: #fff;
  box-shadow: -5px 0 15px rgba(0,0,0,0.1);
  transition: right 0.3s ease;
  z-index: 1001;
  padding: 10px;
}

/* Open state */
.mobile__menu__section.open {
  right: 0;
}

/* Menu list */
.menu {
  flex-direction: column;
  gap: 20px;
  padding-block: 20px;
}
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  z-index: 1000;
}
.menu-item{
  font-size: 18px;}
}
</style>