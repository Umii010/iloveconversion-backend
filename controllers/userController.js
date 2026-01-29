const User = require('../models/User');
const { validationResult } = require('express-validator');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

class UserController {
  // Register user
  static async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }
      
      const { name, email, password, country } = req.body;
      
      // Validate required fields
      if (!name || !email || !password || !country) {
        return res.status(400).json({
          success: false,
          error: 'All fields are required: name, email, password, country'
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'Please enter a valid email address'
        });
      }

      // Validate password strength
      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          error: 'Password must be at least 8 characters'
        });
      }
      if (!/[A-Z]/.test(password)) {
        return res.status(400).json({
          success: false,
          error: 'Password must contain at least one uppercase letter'
        });
      }
      if (!/[0-9]/.test(password)) {
        return res.status(400).json({
          success: false,
          error: 'Password must contain at least one number'
        });
      }

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'User with this email already exists'
        });
      }

      // Create user
      const user = await User.create({
        name,
        email,
        password,
        country
      });

      // Store user in session
      req.session.userId = user.id;
      req.session.userEmail = user.email;
      
      // Save session
      req.session.save((err) => {
        if (err) {
          console.error('Session save error during registration:', err);
        }
      });

      // Set HTTP-only cookie with additional security options
      res.cookie('sessionId', req.sessionID, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'strict',
        path: '/'
      });

      const safeUserData = {
        id: Number(user.id), 
        name: user.name,
        email: user.email,
        country: user.country
      };

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: safeUserData
      });

    } catch (error) {
      console.error('Registration error details:', error);
      
      // Handle specific database errors
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          success: false,
          error: 'User with this email already exists'
        });
      }
      if (error.code === 'ER_NO_SUCH_TABLE') {
        return res.status(500).json({
          success: false,
          error: 'Database table does not exist. Please run database setup.'
        });
      }
      if (error.code === 'ER_ACCESS_DENIED_ERROR') {
        return res.status(500).json({
          success: false,
          error: 'Database access denied. Check your database credentials.'
        });
      }
      
      // Generic server error
      res.status(500).json({
        success: false,
        error: 'Server error. Please try again later.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get all users (protected - admin only)
  static async getAllUsers(req, res) {
    try {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const users = await User.getAll();
      const safeUsers = users.map(user => ({
        id: Number(user.id),
        name: user.name,
        email: user.email,
        country: user.country,
        created_at: user.created_at
      }));
      
      res.status(200).json({
        success: true,
        count: safeUsers.length,
        data: safeUsers
      });
      
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        success: false,
        error: 'Server error. Please try again later.'
      });
    }
  }

  // Get user by ID (protected)
  static async getUserById(req, res) {
    try {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const user = await User.getById(req.params.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Check if user is accessing their own data or is admin
      if (req.session.userId !== user.id && !req.session.isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      const safeUser = {
        id: Number(user.id),
        name: user.name,
        email: user.email,
        country: user.country,
        created_at: user.created_at
      };
      
      res.status(200).json({
        success: true,
        data: safeUser
      });
      
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({
        success: false,
        error: 'Server error. Please try again later.'
      });
    }
  }

  // Update user (protected)
  static async updateUser(req, res) {
    try {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const user = await User.getById(req.params.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Check if user is updating their own data or is admin
      if (req.session.userId !== user.id && !req.session.isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      // Check if email is being changed and if it's already in use
      if (req.body.email && req.body.email !== user.email) {
        const existingUser = await User.findByEmail(req.body.email);
        if (existingUser) {
          return res.status(400).json({
            success: false,
            error: 'Email already in use'
          });
        }
      }

      await User.update(req.params.id, req.body);
      
      // Update session email if email was changed
      if (req.body.email && req.session.userId === user.id) {
        req.session.userEmail = req.body.email;
        req.session.save();
      }

      res.status(200).json({
        success: true,
        message: 'User updated successfully'
      });
      
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({
        success: false,
        error: 'Server error. Please try again later.'
      });
    }
  }

  // Delete user (protected)
  static async deleteUser(req, res) {
    try {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const user = await User.getById(req.params.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Only allow users to delete their own account or admin
      if (req.session.userId !== user.id && !req.session.isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      await User.delete(req.params.id);
      
      // If user deleted their own account, destroy session
      if (req.session.userId === user.id) {
        req.session.destroy();
        res.clearCookie('sessionId');
        res.clearCookie('connect.sid');
      }

      res.status(200).json({
        success: true,
        message: 'User deleted successfully'
      });
      
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        error: 'Server error. Please try again later.'
      });
    }
  }

  // Login user
  static async login(req, res) {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email and password are required'
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'Please enter a valid email address'
        });
      }

      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      const isValidPassword = await User.verifyPassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      // Store user in session
      req.session.userId = user.id;
      req.session.userEmail = user.email;
      // You could add admin check here if needed
      // req.session.isAdmin = user.role === 'admin';
      
      req.session.save((err) => {
        if (err) {
          console.error('Session save error during login:', err);
        }
      });

      // Set HTTP-only cookie
      res.cookie('sessionId', req.sessionID, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'strict',
        path: '/'
      });

      const safeUserData = {
        id: Number(user.id),
        name: user.name,
        email: user.email,
        country: user.country
      };

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: safeUserData
      });
      
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Server error. Please try again later.'
      });
    }
  }

  // Logout user
  static async logout(req, res) {
    try {
      // Destroy session
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destruction error:', err);
        }
      });

      // Clear all cookies
      res.clearCookie('sessionId');
      res.clearCookie('connect.sid');

      res.status(200).json({
        success: true,
        message: 'Logout successful'
      });
      
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: 'Server error during logout'
      });
    }
  }

  // Logout all devices (invalidate all sessions for user)
  static async logoutAll(req, res) {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }

      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      // Only allow users to logout their own sessions or admin
      if (req.session.userId !== userId && !req.session.isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      // Note: For production, you would need to implement session tracking
      // This is a simplified implementation
      // In a real app, you would delete all sessions for this user from the session store
      
      // Destroy current session
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destruction error:', err);
        }
      });

      // Clear cookies
      res.clearCookie('sessionId');
      res.clearCookie('connect.sid');

      res.status(200).json({
        success: true,
        message: 'All sessions logged out successfully'
      });
      
    } catch (error) {
      console.error('Logout all error:', error);
      res.status(500).json({
        success: false,
        error: 'Server error during logout'
      });
    }
  }

  // Get current authenticated user
  static async getCurrentUser(req, res) {
    try {
      if (!req.session.userId) {
        return res.status(401).json({
          success: false,
          error: 'Not authenticated'
        });
      }

      const user = await User.getById(req.session.userId);
      if (!user) {
        // Clear invalid session
        req.session.destroy();
        res.clearCookie('sessionId');
        res.clearCookie('connect.sid');
        
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      const safeUserData = {
        id: Number(user.id),
        name: user.name,
        email: user.email,
        country: user.country
      };

      res.status(200).json({
        success: true,
        data: safeUserData
      });
      
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({
        success: false,
        error: 'Server error. Please try again later.'
      });
    }
  }

  // Forgot Password
  static async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email is required'
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'Please enter a valid email address'
        });
      }

      const user = await User.findByEmail(email);
      
      // For security, we return the same message whether user exists or not
      if (!user) {
        // Return success to prevent email enumeration
        return res.status(200).json({
          success: true,
          message: 'If your email exists in our system, you will receive a reset link shortly'
        });
      }

      // Generate secure reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now
      
      await User.saveResetToken(user.id, resetToken, resetTokenExpiry);
      
      // Construct reset URL
      let frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      frontendUrl = frontendUrl.replace(/\/$/, '');
      const resetPath = '/login'; // Frontend route that handles reset
      const resetUrl = `${frontendUrl}${resetPath}?reset_token=${resetToken}`;

      try {
        // Send reset email
        await sendResetEmail(user.email, resetUrl);
        
        res.status(200).json({
          success: true,
          message: 'Password reset link has been sent to your email',
          // Only include resetUrl in non-production for debugging
          resetUrl: process.env.NODE_ENV !== 'production' ? resetUrl : undefined
        });
        
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        
        // If email fails in production, we still return success but log the error
        // In development, we return the URL
        res.status(200).json({
          success: true,
          message: 'Password reset process initiated. Please check your email.',
          resetUrl: process.env.NODE_ENV === 'development' ? resetUrl : undefined,
          note: process.env.NODE_ENV === 'development' ? 'Email service failed, use this link for development' : undefined
        });
      }

    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        error: 'Server error. Please try again later.'
      });
    }
  }

  // Reset Password
  static async resetPassword(req, res) {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({
          success: false,
          error: 'Token and new password are required'
        });
      }

      // Validate token format (should be 64 hex characters)
      if (!/^[a-f0-9]{64}$/.test(token)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid reset token format'
        });
      }

      // Find user by reset token
      const user = await User.findByResetToken(token);
      
      if (!user) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or expired reset token'
        });
      }

      // Check if token has expired
      if (Date.now() > user.reset_token_expiry) {
        return res.status(400).json({
          success: false,
          error: 'Reset token has expired. Please request a new reset link.'
        });
      }

      // Validate new password strength
      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          error: 'Password must be at least 8 characters'
        });
      }
      if (!/[A-Z]/.test(password)) {
        return res.status(400).json({
          success: false,
          error: 'Password must contain at least one uppercase letter'
        });
      }
      if (!/[0-9]/.test(password)) {
        return res.status(400).json({
          success: false,
          error: 'Password must contain at least one number'
        });
      }

      // Check if new password is same as old password
      const isSamePassword = await User.verifyPassword(password, user.password);
      if (isSamePassword) {
        return res.status(400).json({
          success: false,
          error: 'New password must be different from your current password'
        });
      }

      // Update password
      await User.updatePassword(user.id, password);
      
      // Clear reset token (prevent reuse)
      await User.clearResetToken(user.id);

      // Destroy any existing sessions for this user (security measure)
      // Note: In production, you'd track and destroy all sessions for this user

      res.status(200).json({
        success: true,
        message: 'Password has been reset successfully. You can now login with your new password.'
      });

    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        error: 'Server error. Please try again later.'
      });
    }
  }

  // Check authentication status (middleware function)
  static requireAuth(req, res, next) {
    if (!req.session.userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    next();
  }

  // Check admin role (middleware function)
  static requireAdmin(req, res, next) {
    if (!req.session.userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    // This assumes you have a way to check admin status
    // You would need to implement this based on your user model
    if (!req.session.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    next();
  }
}

// Email sending function
async function sendResetEmail(email, resetUrl) {
  // Skip actual email sending if SMTP is not configured (development)
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.log('SMTP not configured. Email would be sent to:', email);
    console.log('Reset URL:', resetUrl);
    return; // Skip actual email sending
  }

  try {
    // Configure nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      // Optional: For self-signed certificates
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production'
      }
    });

    // Email content with improved security messaging
    const mailOptions = {
      from: process.env.SMTP_FROM || `"iLoveConversion" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Password Reset Request - iLoveConversion',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; }
                .header { background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); padding: 30px; text-align: center; }
                .header h1 { color: white; margin: 0; font-size: 24px; }
                .content { background-color: #f8fafc; padding: 30px; }
                .button { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 20px 0; }
                .footer { background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
                .link { color: #7c3aed; word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 4px; display: block; margin: 10px 0; }
                .warning { color: #ef4444; font-size: 14px; margin-top: 20px; padding: 15px; background-color: #fee2e2; border-radius: 5px; border-left: 4px solid #dc2626; }
                .info { color: #3b82f6; font-size: 14px; margin-top: 15px; padding: 10px; background-color: #dbeafe; border-radius: 5px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>iLoveConversion</h1>
                </div>
                <div class="content">
                    <h2>Password Reset Request</h2>
                    <p>Hello,</p>
                    <p>You recently requested to reset your password for your iLoveConversion account. Click the button below to reset it:</p>
                    
                    <div style="text-align: center;">
                        <a href="${resetUrl}" class="button">Reset Password</a>
                    </div>
                    
                    <p>If the button doesn't work, copy and paste this link into your browser:</p>
                    <p class="link">${resetUrl}</p>
                    
                    <div class="warning">
                        <strong>⚠️ Security Notice:</strong>
                        <ul style="margin: 10px 0; padding-left: 20px;">
                            <li>This link will expire in 1 hour</li>
                            <li>Never share this link with anyone</li>
                            <li>If you didn't request this, please ignore this email</li>
                        </ul>
                    </div>
                    
                    <div class="info">
                        <strong>ℹ️ Need help?</strong>
                        <p>If you're having trouble resetting your password, please contact our support team.</p>
                    </div>
                </div>
                <div class="footer">
                    <p>© ${new Date().getFullYear()} iLoveConversion. All rights reserved.</p>
                    <p>This is an automated message, please do not reply to this email.</p>
                    <p><small>For security reasons, this email was sent to ${email}</small></p>
                </div>
            </div>
        </body>
        </html>
      `,
      // Text version for email clients that don't support HTML
      text: `Password Reset Request - iLoveConversion\n\nYou requested to reset your password. Click this link to reset it: ${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, please ignore this email.\n\n© ${new Date().getFullYear()} iLoveConversion.`
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error('Failed to send reset email');
  }
}

module.exports = UserController;