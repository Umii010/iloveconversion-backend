const { v4: uuidv4 } = require('uuid');
const userTracker = (req, res, next) => {
  let userId = req.cookies?.user_id;
  if (!userId) {
    userId = `user_${uuidv4()}`;
    res.cookie('user_id', userId, {
      maxAge: 30 * 24 * 60 * 60 * 1000, 
      httpOnly: true,
      sameSite: 'lax'
    });
  }
  const userAgent = req.headers['user-agent'] || '';
  let deviceType = 'desktop';
  if (/mobile/i.test(userAgent)) deviceType = 'mobile';
  if (/tablet/i.test(userAgent)) deviceType = 'tablet';

  req.userInfo = {
    user_id: userId,
    device_type: deviceType,
    country: 'unknown' 
  };

  req.startTime = Date.now();

  next();
};

module.exports = userTracker;