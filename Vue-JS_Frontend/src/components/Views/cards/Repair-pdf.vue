<template>
    <div class="card">
        <div>
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 50 50">
                <!-- Broken PDF (left side) -->
                <g opacity="0.7">
                    <rect x="12" y="14" width="12" height="18" fill="#FF6B6B" rx="1"/>
                    <!-- Crack lines -->
                    <path d="M15 18l2 1M17 22l-2 2M20 25l2-2" stroke="#FFFFFF" stroke-width="1" stroke-linecap="round"/>
                    <!-- Error icon -->
                    <circle cx="18" cy="22" r="1.5" fill="#FFFFFF"/>
                    <path d="M18 20.5v3M16.5 22h3" stroke="#FF6B6B" stroke-width="0.5" stroke-linecap="round"/>
                </g>
                
                <!-- Repair tools in middle -->
                <!-- Gear -->
                <circle cx="25" cy="25" r="4" fill="none" stroke="#2196F3" stroke-width="1.5"/>
                <path d="M25 21v1M29 25h-1M25 29v-1M21 25h1" stroke="#2196F3" stroke-width="1.5" stroke-linecap="round"/>
                <circle cx="25" cy="25" r="1" fill="#2196F3"/>
                
                <!-- Wrench -->
                <path d="M23 23l-2-2 2-2 2 2-2 2z" stroke="#4CAF50" stroke-width="1.5" fill="none"/>
                <path d="M21 21l-2 2" stroke="#4CAF50" stroke-width="1.5" stroke-linecap="round"/>
                
                <!-- Screwdriver -->
                <rect x="27" y="23" width="2" height="4" fill="#FF9800" rx="1"/>
                <rect x="26" y="27" width="4" height="1" fill="#FF9800" rx="0.5"/>
                
                <!-- Fixed PDF (right side) -->
                <g opacity="1">
                    <rect x="32" y="14" width="12" height="18" fill="#4CAF50" rx="1"/>
                    <!-- Checkmark -->
                    <path d="M35 22l3 3 5-5" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" fill="none"/>
                    <!-- Clean text lines -->
                    <rect x="35" y="28" width="6" height="1" fill="#FFFFFF" opacity="0.9"/>
                    <rect x="35" y="30" width="8" height="1" fill="#FFFFFF" opacity="0.9"/>
                </g>
                
                <!-- Repair arrows (broken -> tools -> fixed) -->
                <path d="M24 20l2-2M26 18v4M24 24l2 2" stroke="#9C27B0" stroke-width="1.5" stroke-linecap="round" fill="none"/>
                <path d="M26 30l2-2M28 28v4M26 34l2 2" stroke="#9C27B0" stroke-width="1.5" stroke-linecap="round" fill="none"/>
                
                <!-- Sparkle/repair effect -->
                <g fill="#FFD700">
                    <circle cx="22" cy="18" r="0.5"/>
                    <circle cx="28" cy="22" r="0.5"/>
                    <circle cx="24" cy="28" r="0.5"/>
                </g>
            </svg>
        </div>
        <h2>Repair PDF</h2>
        <p>Fix corrupted, damaged, or unreadable PDF files and restore their functionality.</p>
    </div>
</template>