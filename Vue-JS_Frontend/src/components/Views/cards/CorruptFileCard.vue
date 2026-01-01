<!-- CorruptFileCard.vue -->
<template>
    <div class="card" @click="openPopup">
        <div class="card-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 50 50">
                <!-- File with warning signs -->
                <rect x="12" y="14" width="26" height="20" fill="#f8f9fa" stroke="#ff6b6b" stroke-width="2" rx="2"/>
                
                <!-- File lines -->
                <rect x="15" y="18" width="20" height="2" fill="#adb5bd"/>
                <rect x="15" y="22" width="15" height="2" fill="#adb5bd"/>
                <rect x="15" y="26" width="18" height="2" fill="#adb5bd"/>
                
                <!-- Warning symbols -->
                <g transform="translate(30, 20)">
                    <!-- Skull -->
                    <circle cx="0" cy="0" r="3" fill="#343a40"/>
                    <ellipse cx="-1.2" cy="-1" rx="0.5" ry="1" fill="white"/>
                    <ellipse cx="1.2" cy="-1" rx="0.5" ry="1" fill="white"/>
                    <path d="M-1.5 1 Q0 2.5 1.5 1" stroke="white" stroke-width="0.8" fill="none"/>
                    
                    <!-- Crossbones -->
                    <g transform="rotate(45)">
                        <rect x="-3.5" y="-0.3" width="7" height="0.6" fill="#fff"/>
                    </g>
                    <g transform="rotate(-45)">
                        <rect x="-3.5" y="-0.3" width="7" height="0.6" fill="#fff"/>
                    </g>
                </g>
                
                <!-- Cracked file corner -->
                <path d="M32 14 L38 14 L38 20" stroke="#ff6b6b" stroke-width="1.5" fill="none"/>
                <path d="M34 16 L36 18" stroke="#ff6b6b" stroke-width="1" stroke-dasharray="1,1"/>
                
                <!-- Danger icons around file -->
                <g transform="translate(15, 35)">
                    <!-- Biohazard symbol -->
                    <circle cx="0" cy="0" r="2" fill="none" stroke="#dc3545" stroke-width="0.5"/>
                    <circle cx="0" cy="0" r="3.5" fill="none" stroke="#dc3545" stroke-width="0.3"/>
                    <g transform="rotate(60)">
                        <path d="M0 -3 L0 3" stroke="#dc3545" stroke-width="0.8"/>
                        <path d="M-2.5 -1.5 L2.5 1.5" stroke="#dc3545" stroke-width="0.8"/>
                        <path d="M-2.5 1.5 L2.5 -1.5" stroke="#dc3545" stroke-width="0.8"/>
                    </g>
                    <g transform="rotate(-60)">
                        <path d="M0 -3 L0 3" stroke="#dc3545" stroke-width="0.8"/>
                        <path d="M-2.5 -1.5 L2.5 1.5" stroke="#dc3545" stroke-width="0.8"/>
                        <path d="M-2.5 1.5 L2.5 -1.5" stroke="#dc3545" stroke-width="0.8"/>
                    </g>
                </g>
                
                <g transform="translate(35, 35)">
                    <!-- Warning triangle -->
                    <path d="M-3 2 L0 -2 L3 2 Z" fill="#ffc107" stroke="#fd7e14" stroke-width="0.5"/>
                    <path d="M0 -1 L0 0.5" stroke="#000" stroke-width="0.3"/>
                    <circle cx="0" cy="1" r="0.3" fill="#000"/>
                </g>
                
                <!-- Floating corruption effects -->
                <circle cx="10" cy="30" r="1" fill="#ff6b6b" opacity="0.6">
                    <animate attributeName="cy" values="30;25;30" dur="2s" repeatCount="indefinite"/>
                </circle>
                <circle cx="40" cy="25" r="0.8" fill="#dc3545" opacity="0.7">
                    <animate attributeName="cx" values="40;42;40" dur="1.5s" repeatCount="indefinite"/>
                </circle>
                <circle cx="20" cy="40" r="0.6" fill="#6f42c1" opacity="0.8">
                    <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite"/>
                </circle>
                
                <!-- Radiation symbol -->
                <g transform="translate(25, 10)">
                    <circle r="1.5" fill="#28a745" opacity="0.7"/>
                    <g transform="rotate(30)">
                        <rect x="-0.2" y="-2" width="0.4" height="4" fill="#20c997"/>
                    </g>
                    <g transform="rotate(90)">
                        <rect x="-0.2" y="-2" width="0.4" height="4" fill="#20c997"/>
                    </g>
                    <g transform="rotate(150)">
                        <rect x="-0.2" y="-2" width="0.4" height="4" fill="#20c997"/>
                    </g>
                </g>
                
                <!-- Broken chain -->
                <g transform="translate(8, 10)">
                    <circle cx="0" cy="0" r="0.8" fill="#6c757d"/>
                    <circle cx="2" cy="0" r="0.8" fill="#6c757d"/>
                    <path d="M0.8 0 L1.2 0" stroke="#6c757d" stroke-width="0.3"/>
                    <path d="M2.8 0 L3.5 0.5" stroke="#ff6b6b" stroke-width="0.5" stroke-dasharray="0.5,0.5"/>
                </g>
            </svg>
        </div>
        <h2>Corrupt File</h2>
        <p>Intentionally damage files for testing or demonstration purposes</p>
        <div class="card-tags">
            <span class="tag warning"> DANGER</span>
            <span class="tag formats">20+ Formats</span>
            <span class="tag destructive">💀 Destructive</span>
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