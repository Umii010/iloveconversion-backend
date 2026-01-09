const puppeteer = require('puppeteer');
const sharp = require('sharp');
const path = require('path');
const os = require('os');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

class ScreenshotController {
    constructor() {
        this.screenshotDir = path.join(os.tmpdir(), 'screenshots');
        this.ensureScreenshotDir();
        this.browser = null;
          this.captureScreenshot = this.captureScreenshot.bind(this);
    }

    async ensureScreenshotDir() {
        try {
            await fs.mkdir(this.screenshotDir, { recursive: true });
        } catch (error) {
            console.error('Error creating screenshot directory:', error);
        }
    }

    async disableAnimations(page) {
    await page.addStyleTag({
        content: `
            *,
            *::before,
            *::after {
                animation: none !important;
                transition: none !important;
                scroll-behavior: auto !important;
            }
        `
    });
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
                    '--window-size=1920,1080'
                ],
                defaultViewport: null
            });
        }
        return this.browser;
    }

    // Fix: Make isValidUrl a regular method, not an arrow function
    isValidUrl(string) {
        try {
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (_) {
            return false;
        }
    }

    async captureScreenshot(req, res) {
        let page = null;
        let screenshotPath = null;
        
        try {
            const { url, viewport, delay = 2, format = 'png', quality = 85 } = req.body;

            // Validate URL - FIXED: Use this.isValidUrl
            if (!url || !this.isValidUrl(url)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid URL. Please provide a valid HTTP/HTTPS URL.'
                });
            }

            // Validate viewport
            if (!viewport || !viewport.width || !viewport.height) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid viewport dimensions.'
                });
            }

            // Validate format
            const validFormats = ['png', 'jpeg', 'jpg'];
            const formatLower = format.toLowerCase();
            if (!validFormats.includes(formatLower)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid format. Only PNG and JPEG are supported.'
                });
            }

            // Validate quality for JPEG
            if ((formatLower === 'jpeg' || formatLower === 'jpg') && (quality < 10 || quality > 100)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid quality. Quality must be between 10 and 100 for JPEG.'
                });
            }

            console.log(`Capturing screenshot of ${url} with viewport ${viewport.width}x${viewport.height}`);

            // Initialize browser if needed
            const browser = await this.initializeBrowser();
            
            // Create a new page
            page = await browser.newPage();
            
            // Set viewport
            await page.setViewport({
                width: parseInt(viewport.width),
                height: parseInt(viewport.height),
                deviceScaleFactor: 1
            });

            // Set user agent
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

            // Set timeout for navigation
            page.setDefaultNavigationTimeout(30000);

            // Navigate to URL
            await page.goto(url, {
                waitUntil: ['networkidle0', 'domcontentloaded'],
                timeout: 30000
            });

            // Wait for additional delay if specified
            if (delay > 0) {
await new Promise(resolve => setTimeout(resolve, delay * 1000));
            }

            // Scroll through the page to trigger lazy loading
            await this.autoScroll(page);

            // Generate unique filename
            const timestamp = Date.now();
            const randomId = uuidv4().slice(0, 8);
            const domain = new URL(url).hostname.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const actualFormat = formatLower === 'jpg' ? 'jpeg' : formatLower;
            const filename = `screenshot_${domain}_${timestamp}_${randomId}.${actualFormat}`;
            screenshotPath = path.join(this.screenshotDir, filename);

            // Take full page screenshot
            const screenshotOptions = {
                path: screenshotPath,
                fullPage: true,
                type: actualFormat
            };

            if (actualFormat === 'jpeg') {
                screenshotOptions.quality = parseInt(quality);
            }

            await page.screenshot(screenshotOptions);

            // Read the file
            const screenshotBuffer = await fs.readFile(screenshotPath);

            // Clean up the temporary file
            await fs.unlink(screenshotPath).catch(() => {});
            screenshotPath = null;

            // Set appropriate headers
            const contentType = actualFormat === 'png' ? 'image/png' : 'image/jpeg';
            const contentDisposition = `attachment; filename="${filename}"`;

            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', contentDisposition);
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');

            // Send the screenshot
            res.send(screenshotBuffer);

            console.log(`Successfully captured screenshot of ${url}`);

        } catch (error) {
            console.error('Error capturing screenshot:', error);
            
            // Clean up temporary file if it exists
            if (screenshotPath) {
                try {
                    await fs.unlink(screenshotPath);
                } catch (unlinkError) {
                    console.error('Error cleaning up screenshot file:', unlinkError);
                }
            }

            // Close page if it exists
            if (page) {
                try {
                    await page.close();
                } catch (pageError) {
                    console.error('Error closing page:', pageError);
                }
            }

            // Determine appropriate error message
            let errorMessage = 'Failed to capture screenshot. ';
            
            if (error.message.includes('net::ERR_NAME_NOT_RESOLVED') || 
                error.message.includes('net::ERR_CONNECTION_REFUSED')) {
                errorMessage += 'Could not connect to the URL. Please check if the website is accessible.';
            } else if (error.message.includes('timeout')) {
                errorMessage += 'The request timed out. Please try a smaller page or increase the timeout.';
            } else if (error.message.includes('Navigation failed')) {
                errorMessage += 'Failed to navigate to the URL. Please check the URL and try again.';
            } else {
                errorMessage += error.message;
            }

            res.status(500).json({
                success: false,
                error: errorMessage
            });
        } finally {
            // Close page if it still exists
            if (page) {
                try {
                    await page.close();
                } catch (error) {
                    console.error('Error closing page:', error);
                }
            }
        }
    }

  async autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 300;

            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 150);
        });
    });
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

        // Clean up old screenshot files (older than 1 hour)
        try {
            const files = await fs.readdir(this.screenshotDir);
            const now = Date.now();
            
            for (const file of files) {
                const filePath = path.join(this.screenshotDir, file);
                const stats = await fs.stat(filePath);
                const fileAge = now - stats.mtimeMs;
                
                if (fileAge > 3600000) { // 1 hour in milliseconds
                    await fs.unlink(filePath);
                }
            }
        } catch (error) {
            console.error('Error cleaning up old screenshot files:', error);
        }
    }
}

const screenshotController = new ScreenshotController();
module.exports = screenshotController;