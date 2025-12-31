<template>
    <div class="card">
        <div>
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 50 50">
                <!-- PPT presentation (slide with content) -->
                <rect x="10" y="12" width="16" height="20" fill="#2196F3" rx="1"/>
                
                <!-- Slide title bar -->
                <rect x="10" y="12" width="16" height="4" fill="#1976D2" rx="1"/>
                
                <!-- Slide content -->
                <rect x="14" y="18" width="8" height="1.5" fill="#FFFFFF" opacity="0.9"/>
                <rect x="13" y="22" width="3" height="1" fill="#FFFFFF" opacity="0.7"/>
                <rect x="17" y="22" width="7" height="1" fill="#FFFFFF" opacity="0.7"/>
                <rect x="13" y="25" width="3" height="1" fill="#FFFFFF" opacity="0.7"/>
                <rect x="17" y="25" width="9" height="1" fill="#FFFFFF" opacity="0.7"/>
                
                <!-- Chart in slide -->
                <g fill="#4CAF50" opacity="0.8">
                    <rect x="14" y="29" width="2" height="5"/>
                    <rect x="17" y="27" width="2" height="7"/>
                    <rect x="20" y="30" width="2" height="4"/>
                </g>
                
                <!-- PDF document -->
                <rect x="24" y="16" width="16" height="16" fill="#FF6B6B" rx="1"/>
                
                <!-- PDF corner fold -->
                <path fill="#D32F2F" d="M24 16v4c0 1.1.9 2 2 2h4v-2c0-1.1-.9-2-2-2h-4z"/>
                
                <!-- PDF text content -->
                <rect x="28" y="22" width="8" height="1" fill="#FFFFFF" opacity="0.8"/>
                <rect x="28" y="25" width="10" height="1" fill="#FFFFFF" opacity="0.8"/>
                <rect x="28" y="28" width="7" height="1" fill="#FFFFFF" opacity="0.8"/>
                
                <!-- Conversion arrow from PPT to PDF -->
                <path d="M26 24l4-4M30 20v8M26 28l4 4" stroke="#FF9800" stroke-width="2" stroke-linecap="round" fill="none"/>
                
                <!-- Plus sign on PPT (editable) -->
                <path d="M18 14h1M17.5 13.5v1" stroke="#FFFFFF" stroke-width="0.5" stroke-linecap="round"/>
                
                <!-- Lock/locked icon on PDF (final/secure) -->
                <path d="M34 19h2v2h-2z" fill="#FFFFFF" opacity="0.6"/>
                <circle cx="35" cy="18" r="1" fill="#FFFFFF" opacity="0.6"/>
            </svg>
        </div>
        <h2>PPT to PDF</h2>
        <p>Convert PowerPoint presentations (PPT, PPTX) to high-quality PDF documents.</p>
    </div>
</template>