<script setup>
import { ref } from 'vue'

const isMenuOpen = ref(false)
const isServicesOpen = ref(false)

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const toggleServices = () => {
  isServicesOpen.value = !isServicesOpen.value
}

const closeMenu = () => {
  isMenuOpen.value = false
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

            <!-- Right Side Menu for Mobile -->
            <div class="mobile__menu__section" :class="{ open: isMenuOpen }">
                <ul class="menu">
                    <li>
                        <router-link to="/" class="menu-item" @click="closeMenu">
                            <span class="icon">
                                <img src="@/assets/images/icons8-home-24.gif" class="menu-icon" />
                            </span>
                            Home
                        </router-link>
                    </li>

                    <li class="has-submenu">
                        <div class="menu-item submenu-trigger" @click="toggleServices">
                            <span class="icon">
                                <img src="@/assets/images/icons8-service-50.gif" class="menu-icon" />
                            </span>
                            Services
                            <span class="submenu-arrow">{{ isServicesOpen ? '▲' : '▼' }}</span>
                        </div>
                        <ul class="submenu" :class="{ open: isServicesOpen }">
                            <li>
                                <router-link to="/developer-tools" class="submenu-item" @click="closeMenu">
                                    <span class="submenu-icon">⚙️</span>
                                    Developer Tools
                                </router-link>
                            </li>
                            <li>
                                <router-link to="/code-difference" class="submenu-item" @click="closeMenu">
                                    <span class="submenu-icon">📄</span>
                                    Code Diff
                                </router-link>
                            </li>
                            <li>
                                <router-link to="/video-downloader" class="submenu-item" @click="closeMenu">
                                    <span class="submenu-icon">{} </span>
                                    Video Downloader
                                </router-link>
                            </li>
                            <li>
                                <router-link to="/base64-encoder" class="submenu-item" @click="closeMenu">
                                    <span class="submenu-icon">🔤</span>
                                    Base64 Encoder
                                </router-link>
                            </li>
                            <li>
                                <router-link to="/html-formatter" class="submenu-item" @click="closeMenu">
                                    <span class="submenu-icon">🌐</span>
                                    HTML Formatter
                                </router-link>
                            </li>
                        </ul>
                    </li>

                    <li>
                        <router-link to="/qr-code" class="menu-item" @click="closeMenu">
                            <span class="icon">⭐</span>
                            QR Code
                        </router-link>
                    </li>
                </ul>
            </div>

            <!-- Desktop Menu -->
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

                    <li class="has-submenu desktop">
                        <div class="menu-item submenu-trigger">
                            <span class="icon">
                                <img src="@/assets/images/icons8-service-50.gif" class="menu-icon" />
                            </span>
                            Services
                            <span class="submenu-arrow">▼</span>
                        </div>
                        <ul class="submenu desktop-submenu">
                            <li>
                                <router-link to="/developer-tools" class="submenu-item">
                                    <span class="submenu-icon">⚙️</span>
                                    Developer Tools
                                </router-link>
                            </li>
                            <li>
                                <router-link to="/code-difference" class="submenu-item">
                                    <span class="submenu-icon">📄</span>
                                    Code Diff
                                </router-link>
                            </li>
                            <li>
                                <router-link to="/video-downloader" class="submenu-item">
                                    <span class="submenu-icon">{} </span>
                                    Video Downloader
                                </router-link>
                            </li>
                            <li>
                                <router-link to="/base64-encoder" class="submenu-item">
                                    <span class="submenu-icon">🔤</span>
                                    Base64 Encoder
                                </router-link>
                            </li>
                            <li>
                                <router-link to="/html-formatter" class="submenu-item">
                                    <span class="submenu-icon">🌐</span>
                                    HTML Formatter
                                </router-link>
                            </li>
                        </ul>
                    </li>

                    <li>
                        <router-link to="/qr-code" class="menu-item">
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
                    </div>
                </div>
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
    position: relative;
}
.header__section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
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

/* ---- Desktop menu style ---- */
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
    position: relative;
}

.menu li {
    list-style: none;
    position: relative;
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
    cursor: pointer;
    user-select: none;
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

/* ---- Submenu Styles ---- */
.has-submenu {
    position: relative;
}

.submenu-trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.submenu-arrow {
    margin-left: 8px;
    font-size: 10px;
    transition: transform 0.3s ease;
}

.submenu {
    list-style: none;
    margin: 0;
    padding: 0;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    width: 220px;
    z-index: 100;
    opacity: 0;
    visibility: hidden;
    transform: translateY(-10px);
    transition: all 0.3s ease;
    overflow: hidden;
}

.desktop-submenu {
    display: none;
}

.has-submenu.desktop:hover .desktop-submenu {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
    display: block;
}

.submenu.open {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
    display: block;
}

.submenu-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    color: #333;
    text-decoration: none;
    font-size: 14px;
    border-bottom: 1px solid #f0f0f0;
    transition: all 0.2s ease;
}

.submenu-item:last-child {
    border-bottom: none;
}

.submenu-item:hover {
    background: #f8f9fa;
    padding-left: 20px;
}

.submenu-icon {
    font-size: 16px;
    width: 20px;
    text-align: center;
}

/* ---- Login section style ---- */
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

/* Mobile Styles */
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
    
    /* Mobile Menu container */
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
        padding: 20px;
        overflow-y: auto;
    }

    /* Open state */
    .mobile__menu__section.open {
        right: 0;
    }

    /* Mobile Menu list */
    .menu {
        flex-direction: column;
        gap: 0;
        padding: 0;
        background: transparent;
    }
    
    .overlay {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.4);
        z-index: 1000;
    }
    
    .menu-item{
        font-size: 16px;
        padding: 12px 16px;
        border-radius: 8px;
        margin-bottom: 4px;
    }
    
    /* Mobile Submenu Styles */
    .submenu {
        position: static;
        width: 100%;
        box-shadow: none;
        opacity: 1;
        visibility: visible;
        transform: none;
        background: #f8f9fa;
        border-radius: 8px;
        margin-top: 4px;
        margin-left: 20px;
        max-height: 0;
        overflow: hidden;
        transition: max-height 0.3s ease;
    }
    
    .submenu.open {
        max-height: 500px;
    }
    
    .submenu-item {
        padding: 10px 16px;
        font-size: 14px;
        border-bottom: 1px solid #e9ecef;
    }
    
    .submenu-item:last-child {
        border-bottom: none;
    }
    
    .has-submenu .menu-item {
        margin-bottom: 0;
    }
}
</style>