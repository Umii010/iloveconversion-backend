const puppeteer = require('puppeteer');
const path = require('path');
const os = require('os');
const fs = require('fs').promises;

class DesignExtractorController {
    constructor() {
        this.tempDir = path.join(os.tmpdir(), 'design-extraction');
        this.ensureTempDir();
        this.browser = null;
        this.maxTimeout = 45000; // 45 seconds
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
                    '--disable-gpu',
                    '--window-size=1920,1080',
                    '--disable-features=IsolateOrigins,site-per-process',
                    '--disable-web-security',
                    '--disable-features=BlockInsecurePrivateNetworkRequests'
                ],
                defaultViewport: {
                    width: 1920,
                    height: 1080
                },
                timeout: this.maxTimeout
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

    async extractDesign(req, res) {
        let page = null;
        const startTime = Date.now();
        
        try {
            const { url } = req.body;

            // Validate URL
            if (!url || !this.isValidUrl(url)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid URL. Please provide a valid HTTP/HTTPS URL.'
                });
            }

            console.log(`Extracting design from ${url}`);

            // Initialize browser
            const browser = await this.initializeBrowser();
            page = await browser.newPage();
            
            // Set timeouts
            page.setDefaultNavigationTimeout(this.maxTimeout);
            page.setDefaultTimeout(this.maxTimeout);

            // Block unnecessary resources but allow images for analysis
            await page.setRequestInterception(true);
            page.on('request', (req) => {
                const resourceType = req.resourceType();
                // Allow images, block other heavy resources
                if (resourceType === 'image') {
                    req.continue();
                } else if (['font', 'media', 'stylesheet'].includes(resourceType)) {
                    req.abort();
                } else {
                    req.continue();
                }
            });

            // Set user agent
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

            console.log(`Navigating to ${url}...`);
            
            // Navigate with fallback
            try {
                await page.goto(url, {
                    waitUntil: 'domcontentloaded',
                    timeout: this.maxTimeout
                });
            } catch (navError) {
                console.warn(`Navigation attempt failed: ${navError.message}`);
                // Continue even if navigation fails partially
            }

            console.log(`Page loaded, extracting data...`);

            // Wait for images to load
            await page.waitForTimeout(3000);

            // Extract comprehensive design information with focus on media
            const extractionData = await page.evaluate(() => {
                const result = {
                    typography: {
                        fontFamilies: new Map(),
                        fontSizes: new Map(),
                        fontWeights: new Map(),
                        lineHeights: new Map(),
                    },
                    colors: {
                        backgrounds: new Map(),
                        textColors: new Map(),
                        accents: new Map(),
                    },
                    spacing: {
                        margins: new Map(),
                        paddings: new Map(),
                    },
                    layout: {
                        containerWidths: new Set(),
                        breakpoints: new Set(),
                    },
                    media: {
                        images: [],
                        videos: [],
                        iframes: [],
                        audio: [],
                        embeds: [],
                    },
                    components: {
                        buttons: [],
                        inputs: [],
                        forms: [],
                        navigation: [],
                    },
                    meta: {
                        title: document.title,
                        description: document.querySelector('meta[name="description"]')?.content || '',
                        keywords: document.querySelector('meta[name="keywords"]')?.content || '',
                        viewport: document.querySelector('meta[name="viewport"]')?.content || '',
                        ogImage: document.querySelector('meta[property="og:image"]')?.content || '',
                        twitterImage: document.querySelector('meta[name="twitter:image"]')?.content || '',
                        favicon: document.querySelector('link[rel="icon"]')?.href || 
                                 document.querySelector('link[rel="shortcut icon"]')?.href || 
                                 document.querySelector('link[rel="apple-touch-icon"]')?.href || '',
                        canonical: document.querySelector('link[rel="canonical"]')?.href || '',
                    },
                    performance: {
                        totalElements: document.querySelectorAll('*').length,
                        imageCount: 0,
                        videoCount: 0,
                    }
                };

                // Helper function to extract color
                const extractColor = (value) => {
                    if (!value) return null;
                    
                    const hexMatch = value.match(/#([0-9A-F]{3}){1,2}\b/i);
                    if (hexMatch) return hexMatch[0].toUpperCase();
                    
                    const rgbMatch = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
                    if (rgbMatch) {
                        const r = parseInt(rgbMatch[1]);
                        const g = parseInt(rgbMatch[2]);
                        const b = parseInt(rgbMatch[3]);
                        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
                    }
                    
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
                        'grey': '#808080',
                        'transparent': 'transparent'
                    };
                    
                    const lowerValue = value.toLowerCase();
                    return namedColors[lowerValue] || null;
                };

                // ========== IMAGE EXTRACTION ==========
                const images = document.querySelectorAll('img');
                result.performance.imageCount = images.length;
                
                images.forEach(img => {
                    if (img.src) {
                        const imageInfo = {
                            src: img.src,
                            alt: img.alt || '',
                            title: img.title || '',
                            width: img.naturalWidth || img.width || 0,
                            height: img.naturalHeight || img.height || 0,
                            loading: img.loading || 'eager',
                            crossorigin: img.crossOrigin || 'anonymous',
                            isLazy: img.loading === 'lazy',
                            isDecorative: (img.alt === '' && img.role === 'presentation') || img.alt === '',
                            fileExtension: img.src.split('.').pop().toLowerCase().split('?')[0],
                            srcset: img.srcset || '',
                            sizes: img.sizes || '',
                            className: img.className || '',
                            id: img.id || '',
                        };
                        
                        // Check if it's a data URL
                        if (img.src.startsWith('data:')) {
                            imageInfo.isDataUrl = true;
                            imageInfo.dataUrlType = img.src.split(';')[0].replace('data:', '');
                            imageInfo.dataSize = img.src.length;
                        }
                        
                        // Check if it's a background image from CSS
                        const styles = window.getComputedStyle(img);
                        if (styles.backgroundImage && styles.backgroundImage !== 'none') {
                            imageInfo.hasBackgroundImage = true;
                            imageInfo.backgroundImage = styles.backgroundImage;
                        }
                        
                        result.media.images.push(imageInfo);
                    }
                });

                // Also check for background images in other elements
                const elementsWithBackground = document.querySelectorAll('*');
                elementsWithBackground.forEach(el => {
                    const styles = window.getComputedStyle(el);
                    if (styles.backgroundImage && styles.backgroundImage !== 'none') {
                        const bgMatch = styles.backgroundImage.match(/url\(["']?([^"')]+)["']?\)/);
                        if (bgMatch && bgMatch[1]) {
                            result.media.images.push({
                                src: bgMatch[1],
                                alt: 'Background image',
                                isBackground: true,
                                element: el.tagName.toLowerCase(),
                                className: el.className || '',
                                width: el.offsetWidth || 0,
                                height: el.offsetHeight || 0,
                            });
                        }
                    }
                });

                // ========== VIDEO EXTRACTION ==========
                const videos = document.querySelectorAll('video');
                result.performance.videoCount = videos.length;
                
                videos.forEach(video => {
                    const videoInfo = {
                        src: video.src || '',
                        poster: video.poster || '',
                        width: video.width || video.offsetWidth || 0,
                        height: video.height || video.offsetHeight || 0,
                        controls: video.controls,
                        autoplay: video.autoplay,
                        loop: video.loop,
                        muted: video.muted,
                        preload: video.preload || 'auto',
                        className: video.className || '',
                        id: video.id || '',
                        sources: [],
                    };
                    
                    // Extract video sources
                    const sources = video.querySelectorAll('source');
                    sources.forEach(source => {
                        if (source.src) {
                            videoInfo.sources.push({
                                src: source.src,
                                type: source.type || '',
                                media: source.media || '',
                            });
                        }
                    });
                    
                    result.media.videos.push(videoInfo);
                });

                // Check for video links/embeds
                const videoLinks = document.querySelectorAll('a[href*="youtube"], a[href*="youtu.be"], a[href*="vimeo"], a[href*=".mp4"], a[href*=".webm"], a[href*=".ogg"]');
                videoLinks.forEach(link => {
                    result.media.videos.push({
                        src: link.href,
                        isLink: true,
                        linkText: link.textContent?.trim().slice(0, 50) || '',
                        className: link.className || '',
                    });
                });

                // ========== IFRAME EXTRACTION (often used for embeds) ==========
                const iframes = document.querySelectorAll('iframe');
                iframes.forEach(iframe => {
                    if (iframe.src) {
                        result.media.iframes.push({
                            src: iframe.src,
                            width: iframe.width || iframe.offsetWidth || 0,
                            height: iframe.height || iframe.offsetHeight || 0,
                            title: iframe.title || '',
                            sandbox: iframe.sandbox || '',
                            allow: iframe.allow || '',
                            className: iframe.className || '',
                        });
                    }
                });

                // ========== AUDIO EXTRACTION ==========
                const audioElements = document.querySelectorAll('audio');
                audioElements.forEach(audio => {
                    if (audio.src) {
                        result.media.audio.push({
                            src: audio.src,
                            controls: audio.controls,
                            autoplay: audio.autoplay,
                            loop: audio.loop,
                            muted: audio.muted,
                            preload: audio.preload || 'auto',
                            className: audio.className || '',
                        });
                    }
                    
                    // Extract audio sources
                    const sources = audio.querySelectorAll('source');
                    sources.forEach(source => {
                        if (source.src) {
                            result.media.audio.push({
                                src: source.src,
                                type: source.type || '',
                                fromSourceElement: true,
                            });
                        }
                    });
                });

                // ========== EMBED/OBJECT EXTRACTION ==========
                const embeds = document.querySelectorAll('embed, object');
                embeds.forEach(embed => {
                    const src = embed.src || embed.data;
                    if (src) {
                        result.media.embeds.push({
                            src: src,
                            type: embed.type || '',
                            width: embed.width || embed.offsetWidth || 0,
                            height: embed.height || embed.offsetHeight || 0,
                            tagName: embed.tagName.toLowerCase(),
                            className: embed.className || '',
                        });
                    }
                });

                // ========== TYPOGRAPHY ANALYSIS ==========
                const textElements = document.querySelectorAll('body, h1, h2, h3, h4, h5, h6, p, span, a, li, div');
                const limit = Math.min(textElements.length, 500);
                
                for (let i = 0; i < limit; i++) {
                    const element = textElements[i];
                    try {
                        const styles = window.getComputedStyle(element);

                        // Font analysis
                        const fontFamily = styles.fontFamily;
                        if (fontFamily && fontFamily !== 'initial') {
                            const normalized = fontFamily.split(',')[0].replace(/['"]/g, '').trim();
                            result.typography.fontFamilies.set(normalized, (result.typography.fontFamilies.get(normalized) || 0) + 1);
                        }

                        const fontSize = styles.fontSize;
                        if (fontSize && fontSize !== 'initial') {
                            result.typography.fontSizes.set(fontSize, (result.typography.fontSizes.get(fontSize) || 0) + 1);
                        }

                        const fontWeight = styles.fontWeight;
                        if (fontWeight && fontWeight !== 'initial') {
                            result.typography.fontWeights.set(fontWeight, (result.typography.fontWeights.get(fontWeight) || 0) + 1);
                        }

                        const lineHeight = styles.lineHeight;
                        if (lineHeight && lineHeight !== 'normal' && lineHeight !== 'initial') {
                            result.typography.lineHeights.set(lineHeight, (result.typography.lineHeights.get(lineHeight) || 0) + 1);
                        }

                        // Color analysis
                        const bgColor = extractColor(styles.backgroundColor);
                        if (bgColor && bgColor !== '#FFFFFF' && bgColor !== '#FFF' && bgColor !== 'transparent') {
                            result.colors.backgrounds.set(bgColor, (result.colors.backgrounds.get(bgColor) || 0) + 1);
                        }

                        const textColor = extractColor(styles.color);
                        if (textColor && textColor !== '#000000' && textColor !== '#000') {
                            result.colors.textColors.set(textColor, (result.colors.textColors.get(textColor) || 0) + 1);
                        }

                        // Spacing
                        const margin = styles.margin;
                        const padding = styles.padding;
                        
                        if (margin && margin !== '0px') {
                            result.spacing.margins.set(margin, (result.spacing.margins.get(margin) || 0) + 1);
                        }
                        
                        if (padding && padding !== '0px') {
                            result.spacing.paddings.set(padding, (result.spacing.paddings.get(padding) || 0) + 1);
                        }

                    } catch (e) {
                        continue;
                    }
                }

                // ========== COMPONENT ANALYSIS ==========
                // Buttons
                const buttons = document.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"]');
                buttons.forEach(btn => {
                    result.components.buttons.push({
                        text: btn.textContent?.trim().slice(0, 30) || btn.value || '',
                        tagName: btn.tagName.toLowerCase(),
                        type: btn.type || '',
                        className: btn.className || '',
                        id: btn.id || '',
                    });
                });

                // Inputs
                const inputs = document.querySelectorAll('input, textarea, select');
                inputs.forEach(input => {
                    result.components.inputs.push({
                        type: input.type || input.tagName.toLowerCase(),
                        placeholder: input.placeholder || '',
                        className: input.className || '',
                        id: input.id || '',
                    });
                });

                // Forms
                const forms = document.querySelectorAll('form');
                forms.forEach(form => {
                    result.components.forms.push({
                        action: form.action || '',
                        method: form.method || 'get',
                        className: form.className || '',
                        id: form.id || '',
                        inputCount: form.querySelectorAll('input, textarea, select').length,
                    });
                });

                // Navigation
                const navs = document.querySelectorAll('nav, [role="navigation"], header, [class*="nav"], [class*="menu"]');
                navs.forEach(nav => {
                    result.components.navigation.push({
                        tagName: nav.tagName.toLowerCase(),
                        className: nav.className || '',
                        id: nav.id || '',
                        linkCount: nav.querySelectorAll('a').length,
                    });
                });

                // Convert Maps to sorted arrays
                const sortMapByValue = (map) => {
                    return Array.from(map.entries())
                        .map(([key, count]) => ({ value: key, count }))
                        .sort((a, b) => b.count - a.count);
                };

                return {
                    typography: {
                        fontFamilies: sortMapByValue(result.typography.fontFamilies),
                        fontSizes: sortMapByValue(result.typography.fontSizes),
                        fontWeights: sortMapByValue(result.typography.fontWeights),
                        lineHeights: sortMapByValue(result.typography.lineHeights),
                    },
                    colors: {
                        backgrounds: sortMapByValue(result.colors.backgrounds),
                        textColors: sortMapByValue(result.colors.textColors),
                        accents: sortMapByValue(result.colors.accents),
                    },
                    spacing: {
                        margins: sortMapByValue(result.spacing.margins),
                        paddings: sortMapByValue(result.spacing.paddings),
                    },
                    layout: {
                        containerWidths: Array.from(result.layout.containerWidths),
                        breakpoints: Array.from(result.layout.breakpoints),
                    },
                    media: {
                        images: result.media.images,
                        videos: result.media.videos,
                        iframes: result.media.iframes,
                        audio: result.media.audio,
                        embeds: result.media.embeds,
                    },
                    components: {
                        buttons: result.components.buttons,
                        inputs: result.components.inputs,
                        forms: result.components.forms,
                        navigation: result.components.navigation,
                    },
                    meta: result.meta,
                    performance: result.performance
                };
            });

            console.log(`Data extracted successfully in ${Date.now() - startTime}ms`);

            // Process and categorize the data
            const processedData = this.processExtractionData(extractionData);

            // Prepare result
            const result = {
                success: true,
                url,
                stats: {
                    extractionTime: ((Date.now() - startTime) / 1000).toFixed(2),
                    timestamp: new Date().toISOString(),
                    totalElements: extractionData.performance.totalElements,
                    imagesFound: extractionData.performance.imageCount,
                    videosFound: extractionData.performance.videoCount,
                },
                designSystem: processedData,
                rawData: extractionData,
            };

            res.json(result);

        } catch (error) {
            console.error('Error extracting design:', error);
            
            let errorMessage = 'Failed to extract design information. ';
            if (error.message.includes('timeout') || error.message.includes('Timeout')) {
                errorMessage += 'The website took too long to load. Try a different website or try again later.';
            } else if (error.message.includes('net::ERR_NAME_NOT_RESOLVED')) {
                errorMessage += 'Could not resolve the URL. Please check if the website is accessible.';
            } else if (error.message.includes('net::ERR_CONNECTION_REFUSED')) {
                errorMessage += 'Connection was refused. The website may be blocking our request.';
            } else {
                errorMessage += error.message;
            }

            res.status(500).json({
                success: false,
                error: errorMessage,
                suggestion: 'Try a simpler website or check if the URL is correct'
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

    processExtractionData(data) {
        return {
            typography: {
                primaryFont: data.typography.fontFamilies[0]?.value || 'sans-serif',
                commonSizes: this.extractTopValues(data.typography.fontSizes, 5),
                commonWeights: this.extractTopValues(data.typography.fontWeights, 4),
                commonLineHeights: this.extractTopValues(data.typography.lineHeights, 3),
            },
            colors: {
                primaryBackground: data.colors.backgrounds[0]?.value || '#FFFFFF',
                primaryText: data.colors.textColors[0]?.value || '#000000',
                accentColors: this.extractAccentColors(data.colors),
                colorPalette: {
                    backgrounds: data.colors.backgrounds.slice(0, 8).map(c => ({
                        color: c.value,
                        usage: `${Math.round((c.count / data.colors.backgrounds.reduce((sum, bg) => sum + bg.count, 0)) * 100)}%`
                    })),
                    textColors: data.colors.textColors.slice(0, 8).map(c => ({
                        color: c.value,
                        usage: `${Math.round((c.count / data.colors.textColors.reduce((sum, tc) => sum + tc.count, 0)) * 100)}%`
                    })),
                }
            },
            spacing: {
                commonMargins: this.extractTopValues(data.spacing.margins, 5),
                commonPaddings: this.extractTopValues(data.spacing.paddings, 5),
            },
            layout: {
                containerSizes: data.layout.containerWidths.slice(0, 5).map(width => ({
                    value: width,
                    type: width.includes('%') ? 'fluid' : 'fixed'
                })),
            },
            media: {
                images: {
                    total: data.media.images.length,
                    byType: this.groupImagesByType(data.media.images),
                    sample: data.media.images.slice(0, 10).map(img => ({
                        src: img.src,
                        alt: img.alt,
                        dimensions: `${img.width || 0}×${img.height || 0}`,
                        type: img.fileExtension || 'unknown',
                        isLazy: img.isLazy || false,
                        isBackground: img.isBackground || false,
                    })),
                    stats: {
                        totalImages: data.media.images.length,
                        lazyLoaded: data.media.images.filter(img => img.isLazy).length,
                        backgroundImages: data.media.images.filter(img => img.isBackground).length,
                        dataUrls: data.media.images.filter(img => img.isDataUrl).length,
                        withAltText: data.media.images.filter(img => img.alt && img.alt !== '').length,
                    }
                },
                videos: {
                    total: data.media.videos.length,
                    embedded: data.media.videos.filter(v => !v.isLink).length,
                    links: data.media.videos.filter(v => v.isLink).length,
                    sample: data.media.videos.slice(0, 5).map(video => ({
                        src: video.src,
                        isLink: video.isLink || false,
                        sources: video.sources || [],
                        dimensions: `${video.width || 0}×${video.height || 0}`,
                        poster: video.poster || '',
                    })),
                },
                iframes: {
                    total: data.media.iframes.length,
                    sample: data.media.iframes.slice(0, 3).map(iframe => ({
                        src: iframe.src,
                        dimensions: `${iframe.width || 0}×${iframe.height || 0}`,
                    })),
                },
                audio: {
                    total: data.media.audio.length,
                    sample: data.media.audio.slice(0, 3),
                },
                embeds: {
                    total: data.media.embeds.length,
                    sample: data.media.embeds.slice(0, 3),
                },
            },
            components: {
                buttons: {
                    total: data.components.buttons.length,
                    byType: this.groupByProperty(data.components.buttons, 'tagName'),
                    sample: data.components.buttons.slice(0, 5),
                },
                inputs: {
                    total: data.components.inputs.length,
                    byType: this.groupByProperty(data.components.inputs, 'type'),
                    sample: data.components.inputs.slice(0, 5),
                },
                forms: {
                    total: data.components.forms.length,
                    sample: data.components.forms.slice(0, 3),
                },
                navigation: {
                    total: data.components.navigation.length,
                    sample: data.components.navigation.slice(0, 3),
                },
            },
            meta: data.meta
        };
    }

    extractTopValues(items, count) {
        const result = {};
        items.slice(0, count).forEach((item, index) => {
            result[`value-${index + 1}`] = {
                value: item.value,
                usage: `${Math.round((item.count / items.reduce((sum, i) => sum + i.count, 0)) * 100)}%`
            };
        });
        return result;
    }

    extractAccentColors(colors) {
        const accents = [];
        
        // Combine all colors except common ones
        const allColors = [
            ...colors.textColors.filter(c => c.value !== '#000000' && c.value !== '#000'),
            ...colors.backgrounds.filter(c => c.value !== '#FFFFFF' && c.value !== '#FFF' && c.value !== 'transparent')
        ];
        
        // Group by similar colors
        const colorGroups = {};
        allColors.forEach(color => {
            const hex = color.value;
            if (!colorGroups[hex]) {
                colorGroups[hex] = {
                    value: hex,
                    count: 0,
                };
            }
            colorGroups[hex].count += color.count;
        });
        
        // Convert to array and sort
        return Object.values(colorGroups)
            .sort((a, b) => b.count - a.count)
            .slice(0, 8);
    }

    groupImagesByType(images) {
        const types = {};
        images.forEach(img => {
            const type = img.fileExtension || 'unknown';
            types[type] = (types[type] || 0) + 1;
        });
        return types;
    }

    groupByProperty(items, property) {
        const groups = {};
        items.forEach(item => {
            const value = item[property] || 'unknown';
            groups[value] = (groups[value] || 0) + 1;
        });
        return groups;
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

// Create instance
const designExtractorController = new DesignExtractorController();

// Export the extractDesign method as a standalone function
const extractDesign = (req, res) => {
    designExtractorController.extractDesign(req, res);
};

module.exports = {
    designExtractorController,
    extractDesign
};