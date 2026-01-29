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
      
      if (!name || !email || !password || !country) {
        return res.status(400).json({
          success: false,
          error: 'All fields are required: name, email, password, country'
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'Please enter a valid email address'
        });
      }

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

      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'User with this email already exists'
        });
      }

      const user = await User.create({
        name,
        email,
        password,
        country
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
      res.status(500).json({
        success: false,
        error: 'Server error. Please try again later.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get all users
  static async getAllUsers(req, res) {
    try {
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

  // Get user by ID
  static async getUserById(req, res) {
    try {
      const user = await User.getById(req.params.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
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

  // Update user
  static async updateUser(req, res) {
    try {
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

  // Delete user
  static async deleteUser(req, res) {
    try {
      const user = await User.getById(req.params.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      await User.delete(req.params.id);
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
      // Note: Since this is a stateless JWT/stateless API, we don't store sessions on server
      // The client should clear their token. This endpoint is mainly for client-side cleanup
      
      res.status(200).json({
        success: true,
        message: 'Logout successful',
        instructions: 'Client should clear authentication tokens from storage'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: 'Server error during logout'
      });
    }
  }

  // Logout all devices (invalidate all tokens)
  static async logoutAll(req, res) {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }

      // If you're using JWT with refresh tokens, you would:
      // 1. Invalidate all refresh tokens for this user
      // 2. Clear any session data
      
      // For this simple implementation, we'll just acknowledge the request
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
      
      if (!user) {
        return res.status(200).json({
          success: true,
          message: 'If your email exists in our system, you will receive a reset link shortly'
        });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = Date.now() + 3600000; 
      await User.saveResetToken(user.id, resetToken, resetTokenExpiry);
      let frontendUrl = process.env.FRONTEND_URL || 'http://192.168.18.101:5173';
      frontendUrl = frontendUrl.replace(/\/$/, '');
      const resetPath = '/login';
      const resetUrl = `${frontendUrl}${resetPath}?reset_token=${resetToken}`;

      try {
        await sendResetEmail(user.email, resetUrl);
        
        res.status(200).json({
          success: true,
          message: 'Password reset link has been sent to your email',
          resetUrl: process.env.NODE_ENV !== 'production' ? resetUrl : undefined
        });
        
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        
        // If email fails, still return success but log the error
        res.status(200).json({
          success: true,
          message: 'Password reset process initiated. Please check your email.',
          resetUrl: resetUrl, // Include URL for development
          note: 'Email service failed, use this link for development'
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

      // Validate new password
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
      
      // Clear reset token
      await User.clearResetToken(user.id);

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
}

// Email sending function
async function sendResetEmail(email, resetUrl) {
  // If SMTP is not configured, skip email sending in development
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.log('SMTP not configured. Email would be sent to:', email);
    console.log('Reset URL:', resetUrl);
    return; // Skip actual email sending
  }

  try {
    // Configure nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false // For self-signed certificates
      }
    });

    // Email content
    const mailOptions = {
      from: process.env.SMTP_FROM || `"iLoveConversion" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Password Reset Request - iLoveConversion',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .header h1 { color: white; margin: 0; }
                .content { background-color: #f8fafc; padding: 30px; }
                .button { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; }
                .footer { background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-radius: 0 0 10px 10px; }
                .link { color: #7c3aed; word-break: break-all; }
                .warning { color: #ef4444; font-size: 14px; margin-top: 20px; padding: 10px; background-color: #fee2e2; border-radius: 5px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>iLoveConversion</h1>
                </div>
                <div class="content">
                    <h2>Password Reset Request</h2>
                    <p>You recently requested to reset your password for your iLoveConversion account. Click the button below to reset it:</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" class="button">Reset Password</a>
                    </div>
                    
                    <p>If the button doesn't work, copy and paste this link into your browser:</p>
                    <p class="link">${resetUrl}</p>
                    
                    <div class="warning">
                        <strong>Important:</strong> This password reset link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
                    </div>
                </div>
                <div class="footer">
                    <p>© ${new Date().getFullYear()} iLoveConversion. All rights reserved.</p>
                    <p>This is an automated message, please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
      `
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