const { exec, spawn } = require('child_process');
const axios = require('axios');
const archiver = require('archiver');

// ✅ Full path to yt-dlp installed via Winget
const YTDLP_PATH = 'C:\\Users\\Admin\\AppData\\Local\\Microsoft\\WinGet\\Packages\\yt-dlp.yt-dlp_Microsoft.Winget.Source_8wekyb3d8bbwe\\yt-dlp.exe';

class VideoDownloaderController {

    constructor() {
        // 🔐 Bind ALL methods that use `this`
        this.getVideoInfo = this.getVideoInfo.bind(this);
        this.downloadVideo = this.downloadVideo.bind(this);
        this.downloadAllFormats = this.downloadAllFormats.bind(this);

        this.detectPlatform = this.detectPlatform.bind(this);
        this.getYouTubeInfo = this.getYouTubeInfo.bind(this);
        this.getInstagramInfo = this.getInstagramInfo.bind(this);
        this.getFacebookInfo = this.getFacebookInfo.bind(this);
        this.getTikTokInfo = this.getTikTokInfo.bind(this);
        this.getTwitterInfo = this.getTwitterInfo.bind(this);
        this.getGenericVideoInfo = this.getGenericVideoInfo.bind(this);

        this.downloadYouTubeVideo = this.downloadYouTubeVideo.bind(this);
        this.downloadInstagramVideo = this.downloadInstagramVideo.bind(this);
        this.downloadFacebookVideo = this.downloadFacebookVideo.bind(this);
        this.downloadTikTokVideo = this.downloadTikTokVideo.bind(this);
        this.downloadTwitterVideo = this.downloadTwitterVideo.bind(this);
        this.downloadGenericVideo = this.downloadGenericVideo.bind(this);

        this.formatBytes = this.formatBytes.bind(this);
        this.getExtensionFromContentType = this.getExtensionFromContentType.bind(this);
        this.filterQualityFormats = this.filterQualityFormats.bind(this);
        
        // Active processes tracking
        this.activeProcesses = new Map();
    }

    /* =============================
       VIDEO INFO
    ============================== */

    async getVideoInfo(req, res) {
        try {
            const { url, platform } = req.body;
            if (!url) {
                return res.status(400).json({ success: false, error: 'Video URL is required' });
            }

            const detectedPlatform = platform || this.detectPlatform(url);
            let videoInfo;

            console.log(`Fetching info for ${detectedPlatform} URL: ${url}`);

            switch (detectedPlatform.toLowerCase()) {
                case 'youtube':
                    videoInfo = await this.getYouTubeInfo(url);
                    break;
                case 'instagram':
                    videoInfo = await this.getInstagramInfo(url);
                    break;
                case 'facebook':
                    videoInfo = await this.getFacebookInfo(url);
                    break;
                case 'tiktok':
                    videoInfo = await this.getTikTokInfo(url);
                    break;
                case 'twitter':
                    videoInfo = await this.getTwitterInfo(url);
                    break;
                default:
                    videoInfo = await this.getGenericVideoInfo(url);
            }

            console.log(`Successfully fetched info for: ${videoInfo.title}`);

            return res.json({
                success: true,
                videoInfo: { ...videoInfo, platform: detectedPlatform }
            });

        } catch (err) {
            console.error('Error in getVideoInfo:', err.message);
            
            // Special handling for private/restricted videos
            if (err.message.includes('private') || err.message.includes('restricted') || 
                err.message.includes('unavailable') || err.message.includes('login')) {
                return res.status(403).json({ 
                    success: false, 
                    error: 'This video is private or restricted. It requires login or special permissions.' 
                });
            }
            
            res.status(500).json({ 
                success: false, 
                error: err.message || 'Unable to fetch video information' 
            });
        }
    }

    /* =============================
       DOWNLOAD
    ============================== */

    async downloadVideo(req, res) {
        try {
            const { url, quality, format, platform, formatId } = req.body;
            if (!url) {
                return res.status(400).json({ success: false, error: 'Video URL is required' });
            }

            const detectedPlatform = platform || this.detectPlatform(url);
            console.log(`Downloading from ${detectedPlatform}: ${url}, quality: ${quality}, formatId: ${formatId}`);

            switch (detectedPlatform.toLowerCase()) {
                case 'youtube':
                    return await this.downloadYouTubeVideo(url, quality, formatId, res);
                case 'instagram':
                    return await this.downloadInstagramVideo(url, res);
                case 'facebook':
                    return await this.downloadFacebookVideo(url, res);
                case 'tiktok':
                    return await this.downloadTikTokVideo(url, res);
                case 'twitter':
                    return await this.downloadTwitterVideo(url, res);
                default:
                    return await this.downloadGenericVideo(url, res);
            }

        } catch (err) {
            console.error('Error in downloadVideo:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    }

    async downloadAllFormats(req, res) {
        try {
            const { url } = req.body;
            if (!url) {
                return res.status(400).json({ success: false, error: 'Video URL is required' });
            }

            const videoInfo = await this.getYouTubeInfo(url);

            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', 'attachment; filename="video_formats.zip"');

            const archive = archiver('zip');
            archive.pipe(res);

            archive.append(
                `Title: ${videoInfo.title}\nFormats: ${videoInfo.formats.length}`,
                { name: 'info.txt' }
            );

            await archive.finalize();
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, error: err.message });
        }
    }

    /* =============================
       HELPERS
    ============================== */

    detectPlatform(url) {
        const u = url.toLowerCase();
        if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
        if (u.includes('instagram.com')) return 'instagram';
        if (u.includes('facebook.com')) return 'facebook';
        if (u.includes('tiktok.com')) return 'tiktok';
        if (u.includes('twitter.com') || u.includes('x.com')) return 'twitter';
        return 'other';
    }

    filterQualityFormats(formats, platform) {
        if (platform === 'youtube') {
            // For YouTube, filter to only show popular quality options
            const qualityOrder = ['2160p', '1440p', '1080p', '720p', '480p', '360p', '240p', '144p'];
            const seenResolutions = new Set();
            const filteredFormats = [];
            
            // Sort by resolution (highest first)
            formats.sort((a, b) => {
                const aRes = parseInt(a.resolution) || 0;
                const bRes = parseInt(b.resolution) || 0;
                return bRes - aRes;
            });
            
            // Take only 6-8 best formats
            for (const format of formats) {
                const resolution = format.resolution;
                if (!seenResolutions.has(resolution) && filteredFormats.length < 8) {
                    seenResolutions.add(resolution);
                    filteredFormats.push(format);
                }
            }
            
            return filteredFormats;
        }
        
        // For other platforms, just return top 3 formats
        return formats.slice(0, 3);
    }

    async getYouTubeInfo(url) {
        return new Promise((resolve, reject) => {
            const cmd = `"${YTDLP_PATH}" --no-warnings -j "${url}"`;

            exec(cmd, { maxBuffer: 1024 * 1024 * 20 }, (error, stdout, stderr) => {
                if (error) {
                    console.error('yt-dlp YouTube info error:', error.message);
                    
                    // Check for private/restricted videos
                    if (stderr.includes('Private video') || 
                        stderr.includes('This video is private') ||
                        stderr.includes('Sign in')) {
                        return reject(new Error('This video is private or restricted'));
                    }
                    
                    if (stderr.includes('Video unavailable')) {
                        return reject(new Error('Video is unavailable or removed'));
                    }
                    
                    return reject(new Error('Failed to fetch YouTube video info'));
                }

                let data;
                try {
                    data = JSON.parse(stdout);
                } catch (e) {
                    console.error('JSON parse error:', e.message);
                    return reject(new Error('Invalid response from video service'));
                }

                // Get all video formats
                const allFormats = (data.formats || [])
                    .filter(f => f.ext === 'mp4' && f.vcodec !== 'none')
                    .map(f => ({
                        quality: f.format_note || `${f.height || 'N/A'}p`,
                        type: 'video',
                        size: f.filesize ? this.formatBytes(f.filesize) : 'Unknown',
                        resolution: f.height ? `${f.height}p` : 'N/A',
                        fps: f.fps || 'N/A',
                        codec: f.vcodec,
                        bitrate: f.tbr ? `${Math.round(f.tbr)} kbps` : 'N/A',
                        formatId: f.format_id,
                        hasAudio: f.acodec !== 'none',
                        hasVideo: f.vcodec !== 'none'
                    }));

                // Filter to show only popular quality options
                const formats = this.filterQualityFormats(allFormats, 'youtube');

                resolve({
                    title: data.title || 'YouTube Video',
                    thumbnail: data.thumbnail,
                    duration: data.duration,
                    author: data.uploader,
                    views: data.view_count,
                    description: data.description?.slice(0, 200) || '',
                    formats,
                    url: data.webpage_url || url
                });
            });
        });
    }

    async getInstagramInfo(url) {
        return new Promise((resolve, reject) => {
            const cmd = `"${YTDLP_PATH}" --no-warnings -j "${url}"`;

            exec(cmd, { maxBuffer: 1024 * 1024 * 10, timeout: 15000 }, (error, stdout, stderr) => {
                if (error) {
                    console.error('Instagram yt-dlp error:', error.message);
                    
                    // Check for private/restricted Instagram content
                    if (stderr.includes('login_required') || 
                        stderr.includes('private') ||
                        stderr.includes('restricted')) {
                        return reject(new Error('This Instagram content is private or requires login'));
                    }
                    
                    // For Instagram, we'll show basic info even if we can't get details
                    return resolve({
                        title: 'Instagram Video',
                        thumbnail: '',
                        duration: 0,
                        author: '',
                        views: 0,
                        description: '',
                        formats: [{
                            quality: 'Best Available',
                            type: 'video',
                            size: 'Unknown',
                            resolution: 'N/A',
                            formatId: 'best',
                            hasAudio: true,
                            hasVideo: true
                        }],
                        url: url,
                        note: 'Instagram videos may have limited information available'
                    });
                }

                try {
                    const data = JSON.parse(stdout);
                    const formats = [];

                    // Add best format
                    if (data.format_id || data.url) {
                        formats.push({
                            quality: 'Best Available',
                            type: 'video',
                            size: data.filesize ? this.formatBytes(data.filesize) : 'Unknown',
                            resolution: data.height ? `${data.height}p` : 'N/A',
                            formatId: 'best',
                            hasAudio: true,
                            hasVideo: true
                        });
                    }

                    resolve({
                        title: data.title || 'Instagram Video',
                        thumbnail: data.thumbnail || data.thumbnails?.[0]?.url,
                        duration: data.duration,
                        author: data.uploader || data.creator,
                        views: data.view_count,
                        description: data.description?.slice(0, 200) || '',
                        formats: formats.length > 0 ? formats : [{
                            quality: 'Best Available',
                            type: 'video',
                            size: 'Unknown',
                            resolution: 'N/A',
                            formatId: 'best',
                            hasAudio: true,
                            hasVideo: true
                        }],
                        url: url
                    });
                } catch (e) {
                    console.error('Instagram JSON parse error:', e);
                    resolve({
                        title: 'Instagram Video',
                        thumbnail: '',
                        duration: 0,
                        author: '',
                        views: 0,
                        description: '',
                        formats: [{
                            quality: 'Best Available',
                            type: 'video',
                            size: 'Unknown',
                            resolution: 'N/A',
                            formatId: 'best',
                            hasAudio: true,
                            hasVideo: true
                        }],
                        url: url,
                        note: 'Limited information available'
                    });
                }
            });
        });
    }

    async getFacebookInfo(url) {
        return new Promise((resolve, reject) => {
            const cmd = `"${YTDLP_PATH}" --no-warnings -j "${url}"`;

            exec(cmd, { maxBuffer: 1024 * 1024 * 10, timeout: 15000 }, (error, stdout, stderr) => {
                if (error) {
                    console.error('Facebook yt-dlp error:', error.message);
                    
                    if (stderr.includes('login_required') || 
                        stderr.includes('private') ||
                        stderr.includes('restricted')) {
                        return reject(new Error('This Facebook video is private or requires login'));
                    }
                    
                    // Basic info for Facebook
                    return resolve({
                        title: 'Facebook Video',
                        thumbnail: '',
                        duration: 0,
                        author: '',
                        views: 0,
                        description: '',
                        formats: [{
                            quality: 'Best Available',
                            type: 'video',
                            size: 'Unknown',
                            resolution: 'N/A',
                            formatId: 'best',
                            hasAudio: true,
                            hasVideo: true
                        }],
                        url: url,
                        note: 'Facebook videos may have download restrictions'
                    });
                }

                try {
                    const data = JSON.parse(stdout);
                    const formats = [{
                        quality: 'Best Available',
                        type: 'video',
                        size: data.filesize ? this.formatBytes(data.filesize) : 'Unknown',
                        resolution: data.height ? `${data.height}p` : 'N/A',
                        formatId: 'best',
                        hasAudio: true,
                        hasVideo: true
                    }];

                    resolve({
                        title: data.title || 'Facebook Video',
                        thumbnail: data.thumbnail,
                        duration: data.duration,
                        author: data.uploader,
                        views: data.view_count,
                        description: data.description?.slice(0, 200) || '',
                        formats,
                        url: url
                    });
                } catch (e) {
                    console.error('Facebook JSON parse error:', e);
                    resolve({
                        title: 'Facebook Video',
                        thumbnail: '',
                        duration: 0,
                        author: '',
                        views: 0,
                        description: '',
                        formats: [{
                            quality: 'Best Available',
                            type: 'video',
                            size: 'Unknown',
                            resolution: 'N/A',
                            formatId: 'best',
                            hasAudio: true,
                            hasVideo: true
                        }],
                        url: url,
                        note: 'Limited information available'
                    });
                }
            });
        });
    }

    async getTikTokInfo(url) {
        return new Promise((resolve, reject) => {
            const cmd = `"${YTDLP_PATH}" --no-warnings -j "${url}"`;

            exec(cmd, { maxBuffer: 1024 * 1024 * 10, timeout: 15000 }, (error, stdout, stderr) => {
                if (error) {
                    console.error('TikTok yt-dlp error:', error.message);
                    
                    if (stderr.includes('private') || stderr.includes('restricted')) {
                        return reject(new Error('This TikTok video is private or restricted'));
                    }
                    
                    return resolve({
                        title: 'TikTok Video',
                        thumbnail: '',
                        duration: 0,
                        author: '',
                        views: 0,
                        description: '',
                        formats: [{
                            quality: 'Best Available',
                            type: 'video',
                            size: 'Unknown',
                            resolution: 'N/A',
                            formatId: 'best',
                            hasAudio: true,
                            hasVideo: true
                        }],
                        url: url,
                        note: 'TikTok videos may have limited information'
                    });
                }

                try {
                    const data = JSON.parse(stdout);
                    const formats = [{
                        quality: 'Best Available',
                        type: 'video',
                        size: data.filesize ? this.formatBytes(data.filesize) : 'Unknown',
                        resolution: data.height ? `${data.height}p` : 'N/A',
                        formatId: 'best',
                        hasAudio: true,
                        hasVideo: true
                    }];

                    resolve({
                        title: data.title || 'TikTok Video',
                        thumbnail: data.thumbnail,
                        duration: data.duration,
                        author: data.uploader,
                        views: data.view_count,
                        description: data.description?.slice(0, 200) || '',
                        formats,
                        url: url
                    });
                } catch (e) {
                    console.error('TikTok JSON parse error:', e);
                    resolve({
                        title: 'TikTok Video',
                        thumbnail: '',
                        duration: 0,
                        author: '',
                        views: 0,
                        description: '',
                        formats: [{
                            quality: 'Best Available',
                            type: 'video',
                            size: 'Unknown',
                            resolution: 'N/A',
                            formatId: 'best',
                            hasAudio: true,
                            hasVideo: true
                        }],
                        url: url,
                        note: 'Limited information available'
                    });
                }
            });
        });
    }

    async getTwitterInfo(url) {
        return this.getGenericVideoInfo(url);
    }

    async getGenericVideoInfo(url) {
        return {
            title: 'Video',
            thumbnail: '',
            duration: 0,
            author: '',
            views: 0,
            description: '',
            formats: [{
                quality: 'Best Available',
                type: 'video',
                size: 'Unknown',
                resolution: 'N/A',
                formatId: 'best',
                hasAudio: true,
                hasVideo: true
            }],
            url: url,
            note: 'Generic video - limited information available'
        };
    }

    async downloadYouTubeVideo(url, quality, formatId, res) {
        return new Promise((resolve, reject) => {
            try {
                const filename = `youtube_video_${Date.now()}.mp4`;
                let formatSpecifier = 'bestvideo[height<=1080]+bestaudio/best[height<=1080]';
                
                // Use formatId if provided
                if (formatId && formatId !== 'best') {
                    formatSpecifier = formatId;
                }

                res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
                res.setHeader('Content-Type', 'video/mp4');
                res.setHeader('Transfer-Encoding', 'chunked');

                const args = ['-f', formatSpecifier, '-o', '-', '--no-warnings', url];
                console.log('Running yt-dlp with args:', args);

                const ytProcess = spawn(YTDLP_PATH, args, { shell: true });

                // Store process for potential cleanup
                const processId = Date.now();
                this.activeProcesses.set(processId, ytProcess);

                ytProcess.stdout.pipe(res);

                ytProcess.stderr.on('data', data => {
                    const msg = data.toString();
                    console.log(`yt-dlp stderr: ${msg}`);
                });

                ytProcess.on('error', err => {
                    console.error('yt-dlp spawn error:', err);
                    this.activeProcesses.delete(processId);
                    if (!res.headersSent) {
                        res.status(500).json({ success: false, error: 'Download failed to start' });
                    }
                    reject(err);
                });

                ytProcess.on('close', (code) => {
                    this.activeProcesses.delete(processId);
                    console.log(`yt-dlp process closed with code ${code}`);
                    
                    if (code !== 0 && !res.headersSent) {
                        res.status(500).json({ success: false, error: `Download failed with code ${code}` });
                    }
                    resolve();
                });

                // Handle client disconnect
                res.on('close', () => {
                    if (ytProcess && !ytProcess.killed) {
                        ytProcess.kill('SIGKILL');
                        this.activeProcesses.delete(processId);
                    }
                });

            } catch (err) {
                console.error('Error in downloadYouTubeVideo:', err);
                if (!res.headersSent) {
                    res.status(500).json({ success: false, error: err.message });
                }
                reject(err);
            }
        });
    }

    async downloadInstagramVideo(url, res) {
        try {
            const filename = `instagram_video_${Date.now()}.mp4`;
            
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Type', 'video/mp4');
            res.setHeader('Transfer-Encoding', 'chunked');

            const args = ['-f', 'best', '-o', '-', '--no-warnings', url];
            const igProcess = spawn(YTDLP_PATH, args, { shell: true });

            igProcess.stdout.pipe(res);

            igProcess.stderr.on('data', data => {
                console.log(`Instagram download: ${data}`);
            });

            igProcess.on('error', err => {
                console.error('Instagram download error:', err);
                if (!res.headersSent) {
                    res.status(500).json({ success: false, error: 'Instagram download failed' });
                }
            });

        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, error: err.message });
        }
    }

    async downloadFacebookVideo(_, res) {
        res.json({ success: true, message: 'Facebook download requires additional setup' });
    }

    async downloadTikTokVideo(_, res) {
        res.json({ success: true, message: 'TikTok download requires additional setup' });
    }

    async downloadTwitterVideo(_, res) {
        res.json({ success: true, message: 'Twitter download requires additional setup' });
    }

    async downloadGenericVideo(url, res) {
        try {
            const response = await axios({
                url,
                method: 'GET',
                responseType: 'stream',
                timeout: 30000
            });

            const contentType = response.headers['content-type'] || 'video/mp4';
            const extension = this.getExtensionFromContentType(contentType);
            const filename = `video_${Date.now()}${extension}`;

            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Type', contentType);

            response.data.pipe(res);

            response.data.on('error', err => {
                console.error('Stream error:', err);
                if (!res.headersSent) {
                    res.status(500).json({ success: false, error: 'Download failed' });
                }
            });

        } catch (err) {
            console.error('Generic download error:', err);
            res.status(500).json({ success: false, error: 'Failed to download video' });
        }
    }

    formatBytes(bytes) {
        if (!bytes) return 'Unknown';
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
    }

    getExtensionFromContentType(type) {
        const extensions = {
            'video/mp4': '.mp4',
            'video/webm': '.webm',
            'video/quicktime': '.mov',
            'audio/mpeg': '.mp3',
            'audio/mp4': '.m4a',
            'audio/webm': '.weba'
        };
        return extensions[type] || '.mp4';
    }

    // Cleanup method to kill all active processes
    cleanup() {
        this.activeProcesses.forEach((process, id) => {
            if (!process.killed) {
                process.kill('SIGKILL');
            }
        });
        this.activeProcesses.clear();
    }
}

module.exports = new VideoDownloaderController();