const User = require('../models/User');

async function checkSubscription(req, res, next) {
  try {
    if (!req.session.userId) {
      req.isProUser = false;
      req.maxFiles = 7;
      return next();
    }

    const user = await User.getById(req.session.userId);
    if (user && user.is_pro === 1) {
      req.isProUser = true;
      req.maxFiles = 20;
    } else {
      req.isProUser = false;
      req.maxFiles = 7;
    }

    next();
  } catch (error) {
    console.error('Subscription check error:', error);
    req.isProUser = false;
    req.maxFiles = 7;
    next();
  }
}

module.exports = checkSubscription;