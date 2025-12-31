<template>
    <div class="card">
        <div>
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 50 50">
                <!-- PDF Document -->
                <path fill="#FF6B6B" d="M14 10h12v24H14z"/>
                <path fill="#D32F2F" d="M14 10l6 3 6-3v21H14z"/>
                
                <!-- PDF text lines -->
                <rect x="17" y="16" width="6" height="1" fill="#FFFFFF" opacity="0.8"/>
                <rect x="17" y="19" width="8" height="1" fill="#FFFFFF" opacity="0.8"/>
                <rect x="17" y="22" width="7" height="1" fill="#FFFFFF" opacity="0.8"/>
                
                <!-- PDF label -->
                <text x="20" y="32" font-family="Arial" font-size="6" fill="white" text-anchor="middle" font-weight="bold">PDF</text>
                
                <!-- Excel Spreadsheet -->
                <rect x="26" y="12" width="14" height="20" fill="#217346" rx="1"/>
                
                <!-- Excel grid cells -->
                <!-- Column headers -->
                <rect x="27" y="13" width="12" height="3" fill="#1B5E38" rx="0.5"/>
                <!-- Rows -->
                <rect x="27" y="17" width="12" height="2" fill="#2E7D57" rx="0.5"/>
                <rect x="27" y="20" width="12" height="2" fill="#2E7D57" rx="0.5"/>
                <rect x="27" y="23" width="12" height="2" fill="#2E7D57" rx="0.5"/>
                <rect x="27" y="26" width="12" height="2" fill="#2E7D57" rx="0.5"/>
                
                <!-- Cell dividers -->
                <!-- Vertical lines -->
                <line x1="30" y1="13" x2="30" y2="30" stroke="#1B5E38" stroke-width="0.5"/>
                <line x1="33" y1="13" x2="33" y2="30" stroke="#1B5E38" stroke-width="0.5"/>
                <line x1="36" y1="13" x2="36" y2="30" stroke="#1B5E38" stroke-width="0.5"/>
                <!-- Horizontal lines -->
                <line x1="27" y1="16" x2="39" y2="16" stroke="#1B5E38" stroke-width="0.5"/>
                <line x1="27" y1="19" x2="39" y2="19" stroke="#1B5E38" stroke-width="0.5"/>
                <line x1="27" y1="22" x2="39" y2="22" stroke="#1B5E38" stroke-width="0.5"/>
                <line x1="27" y1="25" x2="39" y2="25" stroke="#1B5E38" stroke-width="0.5"/>
                <line x1="27" y1="28" x2="39" y2="28" stroke="#1B5E38" stroke-width="0.5"/>
                
                <!-- Excel label -->
                <text x="33" y="35" font-family="Arial" font-size="5" fill="white" text-anchor="middle" font-weight="bold">XLS</text>
                
                <!-- Data extraction/table conversion lines -->
                <g fill="#4CAF50" opacity="0.8">
                    <!-- Data flowing from PDF to Excel -->
                    <rect x="22" y="16" width="2" height="1"/>
                    <rect x="22" y="19" width="2" height="1"/>
                    <rect x="22" y="22" width="2" height="1"/>
                </g>
                
                <!-- Conversion arrow -->
                <path d="M26 23l4-4M30 19v8M26 27l4 4" stroke="#FF9800" stroke-width="1.5" stroke-linecap="round" fill="none"/>
                
                <!-- Table data icon -->
                <rect x="29" y="15" width="1" height="1" fill="#FFFFFF"/>
                <rect x="32" y="15" width="1" height="1" fill="#FFFFFF"/>
                <rect x="35" y="15" width="1" height="1" fill="#FFFFFF"/>
            </svg>
        </div>
        <h2>PDF to Excel</h2>
        <p>Extract tables and data from PDFs to editable Excel spreadsheets.</p>
    </div>
</template>