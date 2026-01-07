// const { v4: uuidv4 } = require('uuid');
// const axios = require('axios');

// async function getCountryFromIP(ip) {
//   if (!ip || 
//       ip === '127.0.0.1' || 
//       ip === '::1' || 
//       ip === '::ffff:127.0.0.1' ||
//       ip.startsWith('192.168.') || 
//       ip.startsWith('10.') ||
//       ip.startsWith('172.16.') ||
//       ip.startsWith('172.17.') ||
//       ip.startsWith('172.18.') ||
//       ip.startsWith('172.19.') ||
//       ip.startsWith('172.20.') ||
//       ip.startsWith('172.21.') ||
//       ip.startsWith('172.22.') ||
//       ip.startsWith('172.23.') ||
//       ip.startsWith('172.24.') ||
//       ip.startsWith('172.25.') ||
//       ip.startsWith('172.26.') ||
//       ip.startsWith('172.27.') ||
//       ip.startsWith('172.28.') ||
//       ip.startsWith('172.29.') ||
//       ip.startsWith('172.30.') ||
//       ip.startsWith('172.31.')) {
//     console.log(`📡 Local/Private IP detected: ${ip}, returning 'local'`);
//     return 'local';
//   }
  
//   try {
//     console.log(`Fetching country for IP: ${ip}`);
//     const res = await axios.get(
//       `https://api.ipinfo.io/lite/${ip}?token=1a1b05e1fa42b0`,
//       { timeout: 3000 }
//     );
    
//     if (res.data && typeof res.data === 'string') {
//       const lines = res.data.split('\n');
//       return lines[0] || 'unknown'; 
//     }
    
//     return res.data?.country || 'unknown';
//   } catch (err) {
//     console.error('IPinfo Lite error:', err.message);
//     if (err.response) {
//       console.error('Response status:', err.response.status);
//       console.error('Response data:', err.response.data);
//     }
//     return 'unknown';
//   }
// }

// const userTracker = async (req, res, next) => {
//   try {
//     console.log(' UserTracker middleware called for:', req.path);
//     console.log(' All cookies:', req.cookies);
//       const consentId = req.cookies?.consent_id;
//     const cookieConsent = req.cookies?.cookieConsent;
//     let userId;
//     let isNewUser = false;
    
//     let consentData = null;
//     if (cookieConsent) {
//       try {
//         consentData = JSON.parse(cookieConsent);
//       } catch (e) {
//         console.error('Error parsing cookieConsent:', e);
//       }
//     }
    
//     const hasGivenConsent = !!cookieConsent && consentData?.preferences;
    
//     if (hasGivenConsent) {
//       if (consentId) {
//         userId = consentId;
//         console.log('👤 Returning user with consent ID:', userId);
//       } else {
//         userId = req.cookies?.user_id || `user_${uuidv4()}`;
//         isNewUser = !req.cookies?.user_id;
//         console.log('👤 User consented but no consent ID, using:', userId);
//       }
//     } else {
//       userId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
//       console.log('👤 Non-consented temporary user:', userId);
//     }
    
//     if (!req.cookies?.user_id) {
//       res.cookie('user_id', userId, {
//         maxAge: 30 * 24 * 60 * 60 * 1000,
//         httpOnly: false,
//         sameSite: 'lax',
//         secure: false,
//         path: '/'
//       });
//       isNewUser = true;
//     }
    
//     req.user_id = userId;
//     req.consent_id = consentId;
//     req.has_given_consent = hasGivenConsent;
//     req.consent_data = consentData;
    
//     const userAgent = req.headers['user-agent'] || '';
//     let deviceType = 'desktop';
//     if (/tablet/i.test(userAgent)) deviceType = 'tablet';
//     else if (/mobile/i.test(userAgent)) deviceType = 'mobile';
    
//     let ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || 
//              req.socket?.remoteAddress || 
//              req.ip ||
//              req.connection?.remoteAddress;
    
//     if (ip?.startsWith('::ffff:')) {
//       ip = ip.replace('::ffff:', '');
//     }
    
//     const country = await getCountryFromIP(ip);
    
//     req.userInfo = {
//       user_id: userId,
//       consent_id: consentId,
//       device_type: deviceType,
//       country,
//       ip_address: ip,
//       is_new_user: isNewUser,
//       has_given_consent: hasGivenConsent,
//       first_seen: isNewUser ? new Date().toISOString() : null
//     };
    
//     req.startTime = Date.now();
    
//     console.log('User info:', {
//       user_id: userId,
//       consent_id: consentId,
//       is_new_user: isNewUser,
//       has_given_consent: hasGivenConsent,
//       device_type: deviceType,
//       country
//     });
    
//     next();
//   } catch (err) {
//     console.error('UserTracker error:', err);
//     req.user_id = `error_${Date.now()}`;
//     req.consent_id = null;
//     req.has_given_consent = false;
//     req.userInfo = {
//       user_id: req.user_id,
//       device_type: 'unknown',
//       country: 'unknown',
//       ip_address: 'unknown',
//       is_new_user: true,
//       has_given_consent: false
//     };
//     req.startTime = Date.now();
//     next();
//   }
// };
// module.exports = userTracker;