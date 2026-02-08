const User = require('../models/User');

async function checkSubscription(req, res, next) {
  try {
    // Check if user is authenticated via session
    if (!req.session.userId) {
      // For unauthenticated users, apply free limits
      req.isProUser = false;
      req.maxFiles = 7;
      return next();
    }
    
    // Get user from database
    const user = await User.getById(req.session.userId);
    
    if (user && user.is_pro === 1) {
      req.isProUser = true;
      req.maxFiles = 999; // Unlimited for Pro
    } else {
      req.isProUser = false;
      req.maxFiles = 7; // Free limit
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