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
            // For YouTube, filter to show only standard quality formats (avoid HDR/HD)
            const seenResolutions = new Set();
            const filteredFormats = [];
            
            // Sort by resolution (medium first, avoid too high)
            formats.sort((a, b) => {
                const aRes = parseInt(a.resolution) || 0;
                const bRes = parseInt(b.resolution) || 0;
                // Prefer 720p, 480p, 360p over 1080p, 1440p, 2160p
                const aScore = aRes <= 720 ? aRes + 1000 : aRes; // Boost lower resolutions
                const bScore = bRes <= 720 ? bRes + 1000 : bRes;
                return bScore - aScore;
            });
            
            // Take only 2 best standard formats (avoid HDR)
            for (const format of formats) {
                const resolution = format.resolution;
                const quality = format.quality.toLowerCase();
                
                // Skip HDR formats (too high contrast/quality issues)
                if (quality.includes('hdr') || quality.includes('dolby')) {
                    continue;
                }
                
                // Skip 4K/1440p if we have lower options
                const resNum = parseInt(resolution) || 0;
                if (resNum > 1080 && filteredFormats.length >= 1) {
                    continue;
                }
                
                if (!seenResolutions.has(resolution) && filteredFormats.length < 2) {
                    seenResolutions.add(resolution);
                    
                    // Rename quality labels for better understanding
                    let qualityLabel = format.quality;
                    if (resNum <= 480) {
                        qualityLabel = 'Standard';
                    } else if (resNum <= 720) {
                        qualityLabel = 'Good';
                    } else if (resNum <= 1080) {
                        qualityLabel = 'HD';
                    }
                    
                    filteredFormats.push({
                        ...format,
                        quality: qualityLabel,
                        originalQuality: format.quality // Keep original for download
                    });
                }
            }
            
            // If no formats found, return at least one
            if (filteredFormats.length === 0 && formats.length > 0) {
                return [formats[0]];
            }
            
            return filteredFormats;
        }
        
        // For other platforms, return empty array if only "Unknown" is available
        const validFormats = formats.filter(f => 
            f.size !== 'Unknown' && 
            f.quality !== 'Unknown' && 
            f.quality !== 'Best Available'
        );
        
        return validFormats.length > 0 ? validFormats.slice(0, 1) : [];
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

                // Get all video formats (avoid HDR formats)
                const allFormats = (data.formats || [])
                    .filter(f => {
                        // Filter for standard MP4 videos (not HDR)
                        const isMP4 = f.ext === 'mp4';
                        const hasVideo = f.vcodec !== 'none';
                        const quality = (f.format_note || '').toLowerCase();
                        const isNotHDR = !quality.includes('hdr') && !quality.includes('dolby');
                        
                        return isMP4 && hasVideo && isNotHDR;
                    })
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
                        hasVideo: f.vcodec !== 'none',
                        originalFormatId: f.format_id
                    }));

                // Filter to show only standard quality options
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
                    
                    // For Instagram, return empty formats array (no download available)
                    return resolve({
                        title: 'Instagram Video',
                        thumbnail: '',
                        duration: 0,
                        author: '',
                        views: 0,
                        description: '',
                        formats: [], // Empty array = no download available
                        url: url,
                        note: 'Download not available for this Instagram video. Try a different URL.'
                    });
                }

                try {
                    const data = JSON.parse(stdout);
                    
                    // Only return format if we have actual data
                    if (data.filesize || data.url) {
                        const formats = [{
                            quality: 'Available',
                            type: 'video',
                            size: data.filesize ? this.formatBytes(data.filesize) : 'Standard',
                            resolution: data.height ? `${data.height}p` : 'Standard',
                            formatId: 'best',
                            hasAudio: true,
                            hasVideo: true,
                            originalFormatId: 'best'
                        }];

                        return resolve({
                            title: data.title || 'Instagram Video',
                            thumbnail: data.thumbnail || data.thumbnails?.[0]?.url,
                            duration: data.duration,
                            author: data.uploader || data.creator,
                            views: data.view_count,
                            description: data.description?.slice(0, 200) || '',
                            formats,
                            url: url
                        });
                    } else {
                        // No valid format data
                        return resolve({
                            title: 'Instagram Video',
                            thumbnail: '',
                            duration: 0,
                            author: '',
                            views: 0,
                            description: '',
                            formats: [],
                            url: url,
                            note: 'Download not available for this Instagram video.'
                        });
                    }
                } catch (e) {
                    console.error('Instagram JSON parse error:', e);
                    resolve({
                        title: 'Instagram Video',
                        thumbnail: '',
                        duration: 0,
                        author: '',
                        views: 0,
                        description: '',
                        formats: [],
                        url: url,
                        note: 'Download not available for this Instagram video.'
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
                    
                    // Return empty formats for Facebook
                    return resolve({
                        title: 'Facebook Video',
                        thumbnail: '',
                        duration: 0,
                        author: '',
                        views: 0,
                        description: '',
                        formats: [],
                        url: url,
                        note: 'Facebook download requires login and may have restrictions.'
                    });
                }

                try {
                    const data = JSON.parse(stdout);
                    
                    if (data.filesize || data.url) {
                        const formats = [{
                            quality: 'Available',
                            type: 'video',
                            size: data.filesize ? this.formatBytes(data.filesize) : 'Standard',
                            resolution: data.height ? `${data.height}p` : 'Standard',
                            formatId: 'best',
                            hasAudio: true,
                            hasVideo: true,
                            originalFormatId: 'best'
                        }];

                        return resolve({
                            title: data.title || 'Facebook Video',
                            thumbnail: data.thumbnail,
                            duration: data.duration,
                            author: data.uploader,
                            views: data.view_count,
                            description: data.description?.slice(0, 200) || '',
                            formats,
                            url: url
                        });
                    } else {
                        return resolve({
                            title: 'Facebook Video',
                            thumbnail: '',
                            duration: 0,
                            author: '',
                            views: 0,
                            description: '',
                            formats: [],
                            url: url,
                            note: 'Download not available for this Facebook video.'
                        });
                    }
                } catch (e) {
                    console.error('Facebook JSON parse error:', e);
                    resolve({
                        title: 'Facebook Video',
                        thumbnail: '',
                        duration: 0,
                        author: '',
                        views: 0,
                        description: '',
                        formats: [],
                        url: url,
                        note: 'Download not available for this Facebook video.'
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
                        formats: [],
                        url: url,
                        note: 'TikTok download may require special handling.'
                    });
                }

                try {
                    const data = JSON.parse(stdout);
                    
                    if (data.filesize || data.url) {
                        const formats = [{
                            quality: 'Available',
                            type: 'video',
                            size: data.filesize ? this.formatBytes(data.filesize) : 'Standard',
                            resolution: data.height ? `${data.height}p` : 'Standard',
                            formatId: 'best',
                            hasAudio: true,
                            hasVideo: true,
                            originalFormatId: 'best'
                        }];

                        return resolve({
                            title: data.title || 'TikTok Video',
                            thumbnail: data.thumbnail,
                            duration: data.duration,
                            author: data.uploader,
                            views: data.view_count,
                            description: data.description?.slice(0, 200) || '',
                            formats,
                            url: url
                        });
                    } else {
                        return resolve({
                            title: 'TikTok Video',
                            thumbnail: '',
                            duration: 0,
                            author: '',
                            views: 0,
                            description: '',
                            formats: [],
                            url: url,
                            note: 'Download not available for this TikTok video.'
                        });
                    }
                } catch (e) {
                    console.error('TikTok JSON parse error:', e);
                    resolve({
                        title: 'TikTok Video',
                        thumbnail: '',
                        duration: 0,
                        author: '',
                        views: 0,
                        description: '',
                        formats: [],
                        url: url,
                        note: 'Download not available for this TikTok video.'
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
            formats: [],
            url: url,
            note: 'Download not available for this video URL.'
        };
    }

    async downloadYouTubeVideo(url, quality, formatId, res) {
        return new Promise((resolve, reject) => {
            try {
                const filename = `youtube_video_${Date.now()}.mp4`;
                
                // Use standard quality format (avoid HDR)
                // bv*[vcodec^=avc1] - Best video with standard H.264 codec
                // ba - Best audio
                let formatSpecifier = 'bv*[vcodec^=avc1][height<=720]+ba/b[height<=720]';
                
                // If specific formatId provided, use it
                if (formatId && formatId !== 'best') {
                    formatSpecifier = formatId;
                }

                res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
                res.setHeader('Content-Type', 'video/mp4');
                res.setHeader('Transfer-Encoding', 'chunked');

                const args = [
                    '-f', formatSpecifier,
                    '--merge-output-format', 'mp4',
                    '--no-warnings',
                    '--no-playlist',
                    '-o', '-',
                    url
                ];
                
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
            // Check if download is actually possible
            const info = await this.getInstagramInfo(url);
            
            if (!info.formats || info.formats.length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Download not available for this Instagram video. Try a different URL.' 
                });
            }

            const filename = `instagram_video_${Date.now()}.mp4`;
            
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Type', 'video/mp4');
            res.setHeader('Transfer-Encoding', 'chunked');

            const args = [
                '-f', 'best',
                '--no-warnings',
                '--no-playlist',
                '-o', '-',
                url
            ];
            
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
        res.json({ success: false, error: 'Facebook download not available. Try using YouTube or other platforms.' });
    }

    async downloadTikTokVideo(_, res) {
        res.json({ success: false, error: 'TikTok download not available. Try using YouTube or other platforms.' });
    }

    async downloadTwitterVideo(_, res) {
        res.json({ success: false, error: 'Twitter download not available. Try using YouTube or other platforms.' });
    }

    async downloadGenericVideo(url, res) {
        res.json({ success: false, error: 'Download not available for this video URL. Try YouTube for better support.' });
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