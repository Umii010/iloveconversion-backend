<!-- MinifyCard.vue -->
<template>
    <div class="card" @click="openPopup">
        <div class="card-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 50 50">
                <!-- CSS/JS Icons -->
                <g transform="translate(10, 10)">
                    <!-- CSS Icon -->
                    <rect x="0" y="0" width="14" height="14" fill="#264de4" rx="2"/>
                    <rect x="2" y="2" width="10" height="3" fill="#fff"/>
                    <rect x="2" y="6" width="8" height="2" fill="#fff"/>
                    <rect x="2" y="9" width="6" height="2" fill="#fff"/>
                    
                    <!-- JS Icon -->
                    <rect x="18" y="0" width="14" height="14" fill="#f7df1e" rx="2"/>
                    <path d="M21 3L25 10L29 3" stroke="#000" stroke-width="1" fill="none"/>
                    <rect x="21" y="9" width="8" height="2" fill="#000"/>
                </g>
                
                <!-- Minify/Unminify Arrows -->
                <g transform="translate(25, 30)">
                    <!-- Minify arrow (compress) -->
                    <g transform="translate(-15, 0)">
                        <rect x="-8" y="-2" width="16" height="4" fill="#28a745" rx="2"/>
                        <polygon points="0,-8 -4,-4 4,-4" fill="#28a745"/>
                        <polygon points="0,8 -4,4 4,4" fill="#28a745"/>
                    </g>
                    
                    <!-- Unminify arrow (expand) -->
                    <g transform="translate(15, 0)">
                        <rect x="-8" y="-2" width="16" height="4" fill="#17a2b8" rx="2"/>
                        <polygon points="-8,0 -4,-4 -4,4" fill="#17a2b8"/>
                        <polygon points="8,0 4,-4 4,4" fill="#17a2b8"/>
                    </g>
                </g>
                
                <!-- Code lines -->
                <g transform="translate(10, 35)">
                    <!-- Minified code -->
                    <rect x="0" y="0" width="30" height="2" fill="#6c757d"/>
                    <rect x="0" y="4" width="25" height="2" fill="#6c757d"/>
                    <rect x="0" y="8" width="28" height="2" fill="#6c757d"/>
                    
                    <!-- Unminified code -->
                    <g transform="translate(35, 0)">
                        <rect x="0" y="0" width="8" height="2" fill="#007bff"/>
                        <rect x="10" y="0" width="15" height="2" fill="#007bff"/>
                        <rect x="27" y="0" width="3" height="2" fill="#007bff"/>
                        
                        <rect x="2" y="4" width="6" height="2" fill="#007bff"/>
                        <rect x="12" y="4" width="10" height="2" fill="#007bff"/>
                        <rect x="24" y="4" width="3" height="2" fill="#007bff"/>
                        
                        <rect x="4" y="8" width="4" height="2" fill="#007bff"/>
                        <rect x="14" y="8" width="8" height="2" fill="#007bff"/>
                        <rect x="24" y="8" width="3" height="2" fill="#007bff"/>
                    </g>
                </g>
                
                <!-- Auto-detect indicator -->
                <circle cx="40" cy="10" r="3" fill="#20c997"/>
                <text x="40" y="12" text-anchor="middle" font-size="8" fill="white">A</text>
                
                <!-- Copy icon -->
                <g transform="translate(40, 40)">
                    <rect x="-4" y="-4" width="8" height="8" fill="#6f42c1" rx="1"/>
                    <rect x="-2" y="-6" width="4" height="2" fill="#fff" rx="1"/>
                    <rect x="-2" y="4" width="4" height="2" fill="#fff" rx="1"/>
                </g>
                
                <!-- Animation effects -->
                <circle cx="15" cy="15" r="1" fill="#007bff" opacity="0.7">
                    <animate attributeName="r" values="1;2;1" dur="1.5s" repeatCount="indefinite"/>
                </circle>
                <circle cx="35" cy="15" r="1" fill="#f7df1e" opacity="0.7">
                    <animate attributeName="cy" values="15;13;15" dur="2s" repeatCount="indefinite"/>
                </circle>
            </svg>
        </div>
        <h2>Minify CSS/JS</h2>
        <p>Compress and optimize CSS & JavaScript code automatically</p>
        <div class="card-tags">
            <span class="tag css">CSS</span>
            <span class="tag js">JavaScript</span>
            <span class="tag copy">Copy</span>
        </div>
    </div>
</template>

<script setup>
import { defineEmits } from 'vue'

const emit = defineEmits(['open'])

const openPopup = () => {
    emit('open')
}
</script>

<style scoped>
.card {
    background: white;
    border-radius: 12px;
    padding: 25px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    border: 2px solid #f8f9fa;
    text-align: center;
    position: relative;
    overflow: hidden;
}

.card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #264de4, #f7df1e);
}

.card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(38, 77, 228, 0.2);
    border-color: #e9ecef;
}

.card:hover::before {
    animation: color-flow 2s linear infinite;
}

@keyframes color-flow {
    0% { background-position: 0% 50%; }
    100% { background-position: 200% 50%; }
}

.card-icon {
    margin-bottom: 15px;
    display: flex;
    justify-content: center;
}

.card h2 {
    font-size: 20px;
    margin-bottom: 10px;
    color: #2c3e50;
    font-weight: 600;
}

.card p {
    font-size: 14px;
    color: #6c757d;
    line-height: 1.5;
    margin-bottom: 15px;
}

.card-tags {
    display: flex;
    justify-content: center;
    gap: 8px;
    flex-wrap: wrap;
}

.tag {
    font-size: 11px;
    padding: 4px 10px;
    border-radius: 20px;
    font-weight: 600;
    letter-spacing: 0.3px;
}

.tag.css {
    background: #264de4;
    color: white;
}

.tag.js {
    background: #f7df1e;
    color: #000;
}

.tag.auto {
    background: #20c997;
    color: white;
}

.tag.copy {
    background: #6f42c1;
    color: white;
}
</style>