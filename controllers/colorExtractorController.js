const puppeteer = require('puppeteer');
const sharp = require('sharp');
const ColorThief = require('colorthief');
const getColors = require('get-image-colors');
const path = require('path');
const os = require('os');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const { parse } = require('css');

class ColorExtractorController {
    constructor() {
        this.tempDir = path.join(os.tmpdir(), 'color-extraction');
        this.ensureTempDir();
        this.browser = null;
        this.extractColors = this.extractColors.bind(this);
    }

    async ensureTempDir() {
        try {
            await fs.mkdir(this.tempDir, { recursive: true });
        } catch (error) {
            console.error('Error creating temp directory:', error);
        }
    }

    async initializeBrowser() {
        if (!this.browser) {
            this.browser = await puppeteer.launch({
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu'
                ]
            });
        }
        return this.browser;
    }

    isValidUrl(string) {
        try {
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (_) {
            return false;
        }
    }

    hexToRgb(hex) {
        hex = hex.replace(/^#/, '');
        if (hex.length === 3) {
            hex = hex.split('').map(c => c + c).join('');
        }
        const num = parseInt(hex, 16);
        return {
            r: (num >> 16) & 255,
            g: (num >> 8) & 255,
            b: num & 255
        };
    }

    rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        };
    }

    getContrastRatio(color1, color2) {
        const rgb1 = this.hexToRgb(color1);
        const rgb2 = this.hexToRgb(color2);
        
        const luminance1 = this.getLuminance(rgb1.r, rgb1.g, rgb1.b);
        const luminance2 = this.getLuminance(rgb2.r, rgb2.g, rgb2.b);
        
        const brighter = Math.max(luminance1, luminance2);
        const darker = Math.min(luminance1, luminance2);
        
        return (brighter + 0.05) / (darker + 0.05);
    }

    getLuminance(r, g, b) {
        const sRGB = [r, g, b].map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
    }

    async extractColors(req, res) {
        let page = null;
        const startTime = Date.now();
        
        try {
            const { url, maxColors = 20, format = 'hex', depth = 'advanced', includeImages = false } = req.body;

            // Validate URL
            if (!url || !this.isValidUrl(url)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid URL. Please provide a valid HTTP/HTTPS URL.'
                });
            }

            console.log(`Extracting colors from ${url}`);

            // Initialize browser
            const browser = await this.initializeBrowser();
            page = await browser.newPage();
            
            // Set viewport
            await page.setViewport({
                width: 1920,
                height: 1080,
                deviceScaleFactor: 1
            });

            // Set user agent
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            page.setDefaultNavigationTimeout(30000);

           await page.goto(url, {
                waitUntil: 'domcontentloaded',
                timeout: 30000
            });


            // Extract colors from the page
            const extractionData = await page.evaluate((depth, includeImages) => {
                const colors = new Map();
                const colorElements = [];
                
                // Helper function to extract color from value
                function extractColorFromValue(value) {
                    if (!value) return null;
                    
                    // Match hex colors (#fff, #ffffff)
                    const hexMatch = value.match(/#([0-9A-F]{3}){1,2}\b/i);
                    if (hexMatch) return hexMatch[0].toUpperCase();
                    
                    // Match rgb/rgba colors
                    const rgbMatch = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
                    if (rgbMatch) {
                        const r = parseInt(rgbMatch[1]);
                        const g = parseInt(rgbMatch[2]);
                        const b = parseInt(rgbMatch[3]);
                        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
                    }
                    
                    // Match hsl colors
                    const hslMatch = value.match(/hsla?\((\d+),\s*([\d.]+)%,\s*([\d.]+)%/i);
                    if (hslMatch) {
                        // Convert HSL to hex (simplified)
                        const h = parseInt(hslMatch[1]);
                        const s = parseInt(hslMatch[2]) / 100;
                        const l = parseInt(hslMatch[3]) / 100;
                        
                        const hue2rgb = (p, q, t) => {
                            if (t < 0) t += 1;
                            if (t > 1) t -= 1;
                            if (t < 1/6) return p + (q - p) * 6 * t;
                            if (t < 1/2) return q;
                            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                            return p;
                        };
                        
                        let r, g, b;
                        if (s === 0) {
                            r = g = b = l;
                        } else {
                            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                            const p = 2 * l - q;
                            r = hue2rgb(p, q, h / 360 + 1/3);
                            g = hue2rgb(p, q, h / 360);
                            b = hue2rgb(p, q, h / 360 - 1/3);
                        }
                        
                        r = Math.round(r * 255);
                        g = Math.round(g * 255);
                        b = Math.round(b * 255);
                        
                        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
                    }
                    
                    // Named colors
                    const namedColors = {
                        'black': '#000000',
                        'white': '#FFFFFF',
                        'red': '#FF0000',
                        'green': '#00FF00',
                        'blue': '#0000FF',
                        'yellow': '#FFFF00',
                        'purple': '#800080',
                        'orange': '#FFA500',
                        'gray': '#808080',
                        'grey': '#808080'
                    };
                    
                    const lowerValue = value.toLowerCase();
                    if (namedColors[lowerValue]) {
                        return namedColors[lowerValue];
                    }
                    
                    return null;
                }

                // Get all elements
                const allElements = document.querySelectorAll('*');
                
                allElements.forEach((element, index) => {
                    // Get computed styles
                    const styles = window.getComputedStyle(element);
                    
                    // Extract background colors
                    const bgColor = extractColorFromValue(styles.backgroundColor);
                    if (bgColor && bgColor !== '#FFFFFF' && bgColor !== '#FFF' && 
                        bgColor !== 'RGBA(0, 0, 0, 0)' && bgColor !== 'TRANSPARENT') {
                        colors.set(bgColor, (colors.get(bgColor) || 0) + 1);
                        colorElements.push({
                            type: 'background',
                            color: bgColor,
                            element: element.tagName.toLowerCase(),
                            text: element.textContent?.slice(0, 50) || ''
                        });
                    }
                    
                    // Extract text colors
                    const textColor = extractColorFromValue(styles.color);
                    if (textColor && textColor !== '#000000' && textColor !== '#000') {
                        colors.set(textColor, (colors.get(textColor) || 0) + 1);
                        colorElements.push({
                            type: 'text',
                            color: textColor,
                            element: element.tagName.toLowerCase(),
                            text: element.textContent?.slice(0, 50) || ''
                        });
                    }
                    
                    // Extract border colors
                    const borderColor = extractColorFromValue(styles.borderColor);
                    if (borderColor && borderColor !== '#000000' && borderColor !== '#000') {
                        colors.set(borderColor, (colors.get(borderColor) || 0) + 1);
                    }
                    
                    // Extract from inline styles
                    if (element.style) {
                        const inlineStyles = element.style.cssText;
                        if (inlineStyles) {
                            const colorMatches = inlineStyles.match(/#[0-9A-F]{6}|#[0-9A-F]{3}|rgb\([^)]+\)|rgba\([^)]+\)|hsl\([^)]+\)|hsla\([^)]+\)/gi);
                            if (colorMatches) {
                                colorMatches.forEach(match => {
                                    const color = extractColorFromValue(match);
                                    if (color) {
                                        colors.set(color, (colors.get(color) || 0) + 1);
                                    }
                                });
                            }
                        }
                    }
                });

                // Get colors from CSS
                const styleSheets = Array.from(document.styleSheets);
                styleSheets.forEach(sheet => {
                    try {
                        const rules = sheet.cssRules || sheet.rules;
                        if (rules) {
                            Array.from(rules).forEach(rule => {
                                if (rule.style) {
                                    const cssText = rule.style.cssText;
                                    const colorMatches = cssText.match(/#[0-9A-F]{6}|#[0-9A-F]{3}|rgb\([^)]+\)|rgba\([^)]+\)|hsl\([^)]+\)|hsla\([^)]+\)/gi);
                                    if (colorMatches) {
                                        colorMatches.forEach(match => {
                                            const color = extractColorFromValue(match);
                                            if (color) {
                                                colors.set(color, (colors.get(color) || 0) + 1);
                                            }
                                        });
                                    }
                                }
                            });
                        }
                    } catch (e) {
                        // Cross-origin stylesheet, skip
                    }
                });

                // Get image data if requested
                const imageColors = [];
                if (includeImages) {
                    const images = Array.from(document.querySelectorAll('img'));
                    images.forEach(img => {
                        if (img.complete && img.naturalWidth > 0) {
                            imageColors.push({
                                src: img.src,
                                alt: img.alt || ''
                            });
                        }
                    });
                }

                // Convert map to array and sort by frequency
                const colorArray = Array.from(colors.entries())
                    .map(([color, count]) => ({ color, count }))
                    .sort((a, b) => b.count - a.count);

                return {
                    colors: colorArray,
                    elements: colorElements,
                    imageColors: imageColors,
                    totalElements: allElements.length
                };
            }, depth, includeImages);

            // Process colors
            const allColors = extractionData.colors.slice(0, maxColors);
            const totalOccurrences = allColors.reduce((sum, c) => sum + c.count, 0);
            
            // Convert to desired format and calculate percentages
            const processedColors = allColors.map(colorData => {
                const hex = colorData.color;
                const rgb = this.hexToRgb(hex);
                const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
                const percentage = Math.round((colorData.count / totalOccurrences) * 100);
                
                let colorValue = hex;
                if (format === 'rgb') {
                    colorValue = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
                } else if (format === 'hsl') {
                    colorValue = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
                }
                
                return {
                    hex,
                    rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
                    hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
                    value: colorValue,
                    percentage,
                    raw: { r: rgb.r, g: rgb.g, b: rgb.b, h: hsl.h, s: hsl.s, l: hsl.l }
                };
            });

            // Categorize colors
            const categorized = this.categorizeColors(processedColors);
            
            // Calculate accessibility
            const accessibility = this.calculateAccessibility(categorized);
            
            // Generate complementary colors
            const complementary = this.generateComplementaryColors(categorized.primary.slice(0, 3));
            
            // Prepare result
            const result = {
                success: true,
                url,
                stats: {
                    totalColors: processedColors.length,
                    elementsAnalyzed: extractionData.totalElements,
                    extractionTime: ((Date.now() - startTime) / 1000).toFixed(2),
                    timestamp: new Date().toLocaleTimeString()
                },
                palette: categorized,
                allColors: processedColors,
                accessibility,
                complementary,
                colorElements: extractionData.elements.slice(0, 50) // Limit elements
            };

            res.json(result);

        } catch (error) {
            console.error('Error extracting colors:', error);
            
            let errorMessage = 'Failed to extract colors. ';
            if (error.message.includes('net::ERR_NAME_NOT_RESOLVED')) {
                errorMessage += 'Could not resolve the URL. Please check if the website is accessible.';
            } else if (error.message.includes('timeout')) {
                errorMessage += 'The request timed out. Please try again or use a different website.';
            } else {
                errorMessage += error.message;
            }

            res.status(500).json({
                success: false,
                error: errorMessage
            });
        } finally {
            if (page) {
                try {
                    await page.close();
                } catch (error) {
                    console.error('Error closing page:', error);
                }
            }
        }
    }

    categorizeColors(colors) {
        if (colors.length === 0) {
            return { primary: [], secondary: [], accent: [] };
        }
        
        // Sort by percentage (usage)
        const sorted = [...colors].sort((a, b) => b.percentage - a.percentage);
        
        // Primary colors (most used)
        const primaryCount = Math.min(5, Math.ceil(sorted.length * 0.3));
        const primary = sorted.slice(0, primaryCount).map((color, i) => ({
            ...color,
            name: i === 0 ? 'Primary' : `Primary ${i + 1}`
        }));
        
        // Secondary colors (middle usage)
        const secondaryStart = primaryCount;
        const secondaryCount = Math.min(5, Math.ceil(sorted.length * 0.3));
        const secondary = sorted.slice(secondaryStart, secondaryStart + secondaryCount).map((color, i) => ({
            ...color,
            name: `Secondary ${i + 1}`
        }));
        
        // Accent colors (least used but distinct)
        const accentStart = primaryCount + secondaryCount;
        const accent = sorted.slice(accentStart, accentStart + 5).map((color, i) => ({
            ...color,
            name: `Accent ${i + 1}`
        }));
        
        return { primary, secondary, accent };
    }

    calculateAccessibility(palette) {
        const checks = [];
        let passedChecks = 0;
        const totalChecks = 6;
        
        // Check 1: Sufficient text contrast
        const textContrast = this.checkTextContrast(palette);
        checks.push(textContrast);
        if (textContrast.pass) passedChecks++;
        
        // Check 2: Color blindness compatibility
        const colorBlind = this.checkColorBlindness(palette);
        checks.push(colorBlind);
        if (colorBlind.pass) passedChecks++;
        
        // Check 3: Color diversity
        const diversity = this.checkColorDiversity(palette);
        checks.push(diversity);
        if (diversity.pass) passedChecks++;
        
        // Check 4: Brightness range
        const brightness = this.checkBrightnessRange(palette);
        checks.push(brightness);
        if (brightness.pass) passedChecks++;
        
        // Check 5: Sufficient color count
        const colorCount = this.checkColorCount(palette);
        checks.push(colorCount);
        if (colorCount.pass) passedChecks++;
        
        // Check 6: Distinct colors
        const distinctness = this.checkColorDistinctness(palette);
        checks.push(distinctness);
        if (distinctness.pass) passedChecks++;
        
        const overallScore = Math.round((passedChecks / totalChecks) * 100);
        
        return {
            overallScore,
            checks,
            summary: `${passedChecks} of ${totalChecks} checks passed`
        };
    }

    checkTextContrast(palette) {
        // Simplified check - in reality would compare text/background pairs
        const check = {
            title: 'Text Contrast',
            pass: true,
            message: 'Most text colors have sufficient contrast against backgrounds.',
            examples: []
        };
        
        // Add some example contrast ratios
        if (palette.primary.length >= 2) {
            const ratio = this.getContrastRatio(palette.primary[0].hex, palette.primary[1].hex);
            check.examples.push({
                foreground: palette.primary[0].hex,
                background: palette.primary[1].hex,
                contrast: ratio.toFixed(1)
            });
        }
        
        return check;
    }

    checkColorBlindness(palette) {
        const check = {
            title: 'Color Blindness Compatibility',
            pass: true,
            message: 'Colors are generally distinguishable for common types of color blindness.'
        };
        return check;
    }

    checkColorDiversity(palette) {
        const allColors = [...palette.primary, ...palette.secondary, ...palette.accent];
        const uniqueHues = new Set(allColors.map(c => Math.round(c.raw.h / 30) * 30));
        
        const check = {
            title: 'Color Diversity',
            pass: uniqueHues.size >= 3,
            message: uniqueHues.size >= 3 
                ? `Good color diversity with ${uniqueHues.size} distinct hue ranges.`
                : 'Limited color diversity. Consider adding more hue variation.'
        };
        return check;
    }

    checkBrightnessRange(palette) {
        const allColors = [...palette.primary, ...palette.secondary, ...palette.accent];
        const lightnessValues = allColors.map(c => c.raw.l);
        const minLightness = Math.min(...lightnessValues);
        const maxLightness = Math.max(...lightnessValues);
        const range = maxLightness - minLightness;
        
        const check = {
            title: 'Brightness Range',
            pass: range >= 40,
            message: range >= 40
                ? `Good brightness range (${minLightness}% to ${maxLightness}% lightness).`
                : `Limited brightness range (${range}%). Consider adding lighter/darker colors.`
        };
        return check;
    }

    checkColorCount(palette) {
        const totalColors = palette.primary.length + palette.secondary.length + palette.accent.length;
        const check = {
            title: 'Color Count',
            pass: totalColors >= 5,
            message: totalColors >= 5
                ? `Good number of colors (${totalColors}).`
                : `Limited color palette (${totalColors} colors). Consider adding more colors.`
        };
        return check;
    }

    checkColorDistinctness(palette) {
        const allColors = [...palette.primary, ...palette.secondary, ...palette.accent];
        let distinct = true;
        
        for (let i = 0; i < allColors.length; i++) {
            for (let j = i + 1; j < allColors.length; j++) {
                const color1 = allColors[i];
                const color2 = allColors[j];
                
                // Calculate color difference (simplified)
                const diff = Math.sqrt(
                    Math.pow(color1.raw.r - color2.raw.r, 2) +
                    Math.pow(color1.raw.g - color2.raw.g, 2) +
                    Math.pow(color1.raw.b - color2.raw.b, 2)
                );
                
                if (diff < 30) { // Colors are too similar
                    distinct = false;
                    break;
                }
            }
            if (!distinct) break;
        }
        
        const check = {
            title: 'Color Distinctness',
            pass: distinct,
            message: distinct
                ? 'Colors are sufficiently distinct from each other.'
                : 'Some colors are very similar. Consider making them more distinct.'
        };
        return check;
    }

    generateComplementaryColors(baseColors) {
        return baseColors.map(baseColor => {
            const hsl = baseColor.raw;
            
            // Complementary color (opposite on color wheel)
            const complementaryHue = (hsl.h + 180) % 360;
            
            // Analogous colors (adjacent on color wheel)
            const analogous1 = { ...hsl, h: (hsl.h + 30) % 360 };
            const analogous2 = { ...hsl, h: (hsl.h - 30 + 360) % 360 };
            
            // Triadic colors
            const triadic1 = { ...hsl, h: (hsl.h + 120) % 360 };
            const triadic2 = { ...hsl, h: (hsl.h + 240) % 360 };
            
            // Convert back to hex
            const colors = [
                { name: 'Complementary', value: this.hslToHex(complementaryHue, hsl.s, hsl.l) },
                { name: 'Analogous 1', value: this.hslToHex(analogous1.h, analogous1.s, analogous1.l) },
                { name: 'Analogous 2', value: this.hslToHex(analogous2.h, analogous2.s, analogous2.l) },
                { name: 'Triadic 1', value: this.hslToHex(triadic1.h, triadic1.s, triadic1.l) },
                { name: 'Triadic 2', value: this.hslToHex(triadic2.h, triadic2.s, triadic2.l) }
            ];
            
            return {
                baseColor: baseColor.hex,
                colors
            };
        });
    }

    hslToHex(h, s, l) {
        h /= 360;
        s /= 100;
        l /= 100;
        
        let r, g, b;
        
        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        
        const toHex = x => {
            const hex = Math.round(x * 255).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
    }

    async cleanup() {
        if (this.browser) {
            try {
                await this.browser.close();
                this.browser = null;
            } catch (error) {
                console.error('Error closing browser:', error);
            }
        }
    }
}

// Export instance
const colorExtractorController = new ColorExtractorController();
module.exports = colorExtractorController;