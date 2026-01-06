const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

async function getCountryFromIP(ip) {
  if (!ip || 
      ip === '127.0.0.1' || 
      ip === '::1' || 
      ip === '::ffff:127.0.0.1' ||
      ip.startsWith('192.168.') || 
      ip.startsWith('10.') ||
      ip.startsWith('172.16.') ||
      ip.startsWith('172.17.') ||
      ip.startsWith('172.18.') ||
      ip.startsWith('172.19.') ||
      ip.startsWith('172.20.') ||
      ip.startsWith('172.21.') ||
      ip.startsWith('172.22.') ||
      ip.startsWith('172.23.') ||
      ip.startsWith('172.24.') ||
      ip.startsWith('172.25.') ||
      ip.startsWith('172.26.') ||
      ip.startsWith('172.27.') ||
      ip.startsWith('172.28.') ||
      ip.startsWith('172.29.') ||
      ip.startsWith('172.30.') ||
      ip.startsWith('172.31.')) {
    console.log(`📡 Local/Private IP detected: ${ip}, returning 'local'`);
    return 'local';
  }
  
  try {
    console.log(`🌍 Fetching country for IP: ${ip}`);
    const res = await axios.get(
      `https://api.ipinfo.io/lite/${ip}?token=1a1b05e1fa42b0`,
      { timeout: 3000 }
    );
    
    console.log(`✅ IPInfo response for ${ip}:`, res.data);
    if (res.data && typeof res.data === 'string') {
      const lines = res.data.split('\n');
      return lines[0] || 'unknown'; 
    }
    
    return res.data?.country || 'unknown';
  } catch (err) {
    console.error('IPinfo Lite error:', err.message);
    if (err.response) {
      console.error('Response status:', err.response.status);
      console.error('Response data:', err.response.data);
    }
    return 'unknown';
  }
}

const userTracker = async (req, res, next) => {
  try {
    let userId = req.cookies?.user_id;
    let isNewUser = false;
    
    if (!userId) {
      userId = `user_${uuidv4()}`;
      isNewUser = true;
      
      res.cookie('user_id', userId, {
        maxAge: 30 * 24 * 60 * 60 * 1000, 
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production', 
        domain: process.env.NODE_ENV === 'production' ? 'yourdomain.com' : 'localhost'
      });
    }
    
    const userAgent = req.headers['user-agent'] || '';
    let deviceType = 'desktop';
    if (/tablet/i.test(userAgent)) deviceType = 'tablet';
    else if (/mobile/i.test(userAgent)) deviceType = 'mobile';
    
    // DEBUG: Log all IP sources
    console.log('🔍 IP Detection Debug:');
    console.log('  - req.headers:', req.headers);
    console.log('  - x-forwarded-for:', req.headers['x-forwarded-for']);
    console.log('  - req.socket.remoteAddress:', req.socket?.remoteAddress);
    console.log('  - req.ip:', req.ip);
    console.log('  - req.connection.remoteAddress:', req.connection?.remoteAddress);
    
    let ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || 
             req.socket?.remoteAddress || 
             req.ip ||
             req.connection?.remoteAddress;
    
    console.log(`📡 Original IP: ${ip}`);
    
    if (ip?.startsWith('::ffff:')) {
      ip = ip.replace('::ffff:', '');
      console.log(`📡 Cleaned IP: ${ip}`);
    }
    
    const country = await getCountryFromIP(ip);
    console.log(`📍 Country result for ${ip}: ${country}`);
    
    req.userInfo = {
      user_id: userId,
      device_type: deviceType,
      country,
      ip_address: ip,
      is_new_user: isNewUser,
      first_seen: isNewUser ? new Date().toISOString() : null
    };
    
    req.startTime = Date.now();
    next();
  } catch (err) {
    console.error('UserTracker error:', err);
    req.userInfo = {
      user_id: `error_${Date.now()}`,
      device_type: 'unknown',
      country: 'unknown',
      ip_address: 'unknown',
      is_new_user: false
    };
    req.startTime = Date.now();
    next();
  }
};
module.exports = userTracker;