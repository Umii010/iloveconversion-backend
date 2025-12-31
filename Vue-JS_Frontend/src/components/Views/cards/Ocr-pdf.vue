<template>
    <div class="card">
        <div class="icon-container">
            <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 64 64">
                <!-- Main Document Background -->
                <path fill="#4A90E2" d="M45 10H19c-1.657 0-3 1.343-3 3v38c0 1.657 1.343 3 3 3h26c1.657 0 3-1.343 3-3V13c0-1.657-1.343-3-3-3z"/>
                
                <!-- Document Fold -->
                <path fill="#357ABD" d="M45 10v5c0 1.657 1.343 3 3 3h5v-3c0-1.657-1.343-3-3-3h-5z"/>
                
                <!-- Text Lines -->
                <g fill="#FFFFFF">
                    <!-- First text line (scanned text representation) -->
                    <path d="M22 25h20v4H22z" opacity="0.8"/>
                    <path d="M22 30h24v3H22z" opacity="0.9"/>
                    <path d="M22 35h18v3H22z" opacity="0.7"/>
                    <path d="M22 40h22v3H22z" opacity="0.8"/>
                    
                    <!-- OCR extracted text (clear text) -->
                    <path d="M22 48h24v2H22z" opacity="1"/>
                    <path d="M22 51h20v2H22z" opacity="1"/>
                    <path d="M22 54h18v2H22z" opacity="1"/>
                </g>
                
                <!-- OCR Lens/Magnifying Glass -->
                <g transform="translate(40, 20)">
                    <circle cx="8" cy="8" r="7" fill="#FF6B6B" opacity="0.9"/>
                    <circle cx="8" cy="8" r="5" fill="#FFFFFF"/>
                    
                    <!-- Lens lines representing scanning -->
                    <path d="M8 3v2M8 13v2M3 8h2M13 8h2" stroke="#FF6B6B" stroke-width="1" stroke-linecap="round"/>
                    
                    <!-- Handle -->
                    <path d="M12 12l5 5" stroke="#FF6B6B" stroke-width="2" stroke-linecap="round"/>
                </g>
                
                <!-- Text recognition waves -->
                <g transform="translate(25, 25)">
                    <path d="M0 0q2 4 4 0" stroke="#4CAF50" stroke-width="1" fill="none"/>
                    <path d="M4 0q2 4 4 0" stroke="#4CAF50" stroke-width="1" fill="none" opacity="0.7"/>
                    <path d="M8 0q2 4 4 0" stroke="#4CAF50" stroke-width="1" fill="none" opacity="0.5"/>
                </g>
                
                <!-- AI/OCR indicator -->
                <g transform="translate(12, 48)">
                    <circle cx="2" cy="0" r="1.5" fill="#9C27B0"/>
                    <circle cx="6" cy="0" r="1.5" fill="#2196F3"/>
                    <circle cx="10" cy="0" r="1.5" fill="#4CAF50"/>
                    <path d="M2 -2v4M6 -2v4M10 -2v4" stroke="#FFFFFF" stroke-width="0.5" stroke-linecap="round"/>
                </g>
            </svg>
        </div>
        <h2>OCR PDF</h2>
        <p>Extract text from scanned PDFs and images using Optical Character Recognition.</p>
    </div>
</template>
