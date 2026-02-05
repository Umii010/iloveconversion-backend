const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  // Create new user
  // Create new user - UPDATED VERSION
static async create(userData) {
  let conn;
  try {
    conn = await pool.getConnection();
    
    // Hash password if provided
    let hashedPassword = userData.password;
    if (userData.password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(userData.password, salt);
    } else {
      // Generate random password if not provided
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(Math.random().toString(36).slice(-8), salt);
    }
    
    const result = await conn.query(
      `INSERT INTO users (
        name, email, password, country, 
        is_pro, subscription_plan, 
        stripe_customer_id, subscription_id, current_period_end, cancel_at_period_end, cancel_at,subscription_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userData.name || '',
        userData.email,
        hashedPassword,
        userData.country || 'US',
        userData.is_pro || 0,
        userData.subscription_plan || 'free',
        userData.stripe_customer_id || null,
        userData.subscription_id || null,
        userData.current_period_end || null,
        userData.cancel_at_period_end || false,
        userData.cancel_at || null, 
        userData.subscription_status || 'active'
      ]
    );
    
    const userId = Number(result.insertId);
    
    // Return full user object
    return {
      id: userId,
      name: userData.name || '',
      email: userData.email,
      country: userData.country || 'US',
      is_pro: userData.is_pro || 0,
      subscription_plan: userData.subscription_plan || 'free',
      stripe_customer_id: userData.stripe_customer_id || null,
      subscription_id: userData.subscription_id || null,
      current_period_end: userData.current_period_end || null
    };
    
  } catch (error) {
    console.error('❌ User.create() error:', error);
    throw error;
  } finally {
    if (conn) conn.release();
  }
}

// Add this method to your User model:
static async findBySubscriptionId(subscriptionId) {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(
      'SELECT * FROM users WHERE subscription_id = ?',
      [subscriptionId]
    );
    
    if (rows[0] && rows[0].id) {
      rows[0].id = Number(rows[0].id);
    }
    
    return rows[0];
  } catch (error) {
    throw error;
  } finally {
    if (conn) conn.release();
  }
}
  // Find user by email - FIXED VERSION
static async findByEmail(email) {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(
      `SELECT 
        id, name, email, password, country,
        is_pro, subscription_plan,
        stripe_customer_id, subscription_id, current_period_end,
        created_at, updated_at,
        reset_token, reset_token_expiry
      FROM users WHERE email = ?`,
      [email]
    );
    
    if (rows[0] && rows[0].id) {
      // Convert BigInt to Number
      rows[0].id = Number(rows[0].id);
      if (rows[0].reset_token_expiry) {
        rows[0].reset_token_expiry = Number(rows[0].reset_token_expiry);
      }
    }
    
    return rows[0];
  } catch (error) {
    throw error;
  } finally {
    if (conn) conn.release();
  }
}

  // Get all users
  static async getAll() {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(
        'SELECT id, name, email, country, created_at FROM users ORDER BY created_at DESC'
      );
      
      // Convert all BigInt IDs to Numbers
      return rows.map(row => ({
        ...row,
        id: Number(row.id)
      }));
      
    } catch (error) {
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }

  // Get user by ID
  // Get user by ID - FIXED VERSION
static async getById(id) {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(
      `SELECT 
        id, name, email, password, country,
        is_pro, subscription_plan,
        stripe_customer_id, subscription_id, current_period_end,
        created_at, updated_at,
        reset_token, reset_token_expiry
      FROM users WHERE id = ?`,
      [id]
    );
    
    if (rows[0] && rows[0].id) {
      // Convert BigInt to Number
      rows[0].id = Number(rows[0].id);
      if (rows[0].reset_token_expiry) {
        rows[0].reset_token_expiry = Number(rows[0].reset_token_expiry);
      }
    }
    
    return rows[0];
  } catch (error) {
    throw error;
  } finally {
    if (conn) conn.release();
  }
}

// Update user - FIXED VERSION
// In User.js, update the update method to include ALL subscription fields
static async update(id, userData) {
  let conn;
  try {
    conn = await pool.getConnection();
    
    let query = 'UPDATE users SET ';
    const values = [];
    const updates = [];
    
    // Add ALL subscription-related fields
    const subscriptionFields = [
      'is_pro', 'subscription_plan', 'stripe_customer_id', 
      'subscription_id', 'current_period_end', 'subscription_status',
      'cancel_at_period_end', 'cancel_at', 'last_payment_at',
      'last_payment_failed_at', 'subscription_cancelled_at'
    ];
    
    // Check each subscription field
    subscriptionFields.forEach(field => {
      if (userData[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(userData[field]);
        console.log(`📝 Adding ${field}:`, userData[field]);
      }
    });
    
    // Also include basic user fields
    const basicFields = ['name', 'email', 'password', 'country', 'reset_token', 'reset_token_expiry'];
    basicFields.forEach(field => {
      if (userData[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(userData[field]);
        console.log(`📝 Adding ${field}:`, userData[field]);
      }
    });
    
    if (updates.length === 0) {
      console.log('⚠️ No fields to update');
      return false;
    }
    
    query += updates.join(', ') + ' WHERE id = ?';
    values.push(id);
    
    console.log('📝 Final update query:', query);
    console.log('📝 With values:', values);
    
    const result = await conn.query(query, values);
    console.log('✅ Update affected rows:', result.affectedRows);
    
    return result.affectedRows > 0;
    
  } catch (error) {
    console.error('❌ User.update() error:', error);
    throw error;
  } finally {
    if (conn) conn.release();
  }
}

  // Delete user
  static async delete(id) {
    let conn;
    try {
      conn = await pool.getConnection();
      await conn.query('DELETE FROM users WHERE id = ?', [id]);
      return true;
    } catch (error) {
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }

  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Save reset token to database
  static async saveResetToken(userId, token, expiry) {
    let conn;
    try {
      conn = await pool.getConnection();
      
      await conn.query(
        'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?',
        [token, expiry, userId]
      );
      
      return true;
      
    } catch (error) {
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }

  // Find user by reset token
  static async findByResetToken(token) {
    let conn;
    try {
      conn = await pool.getConnection();
      
      const rows = await conn.query(
        'SELECT id, email, password, reset_token_expiry FROM users WHERE reset_token = ?',
        [token]
      );
      
      if (rows[0] && rows[0].id) {
        rows[0].id = Number(rows[0].id);
        if (rows[0].reset_token_expiry) {
          rows[0].reset_token_expiry = Number(rows[0].reset_token_expiry);
        }
      }
      
      return rows[0];
      
    } catch (error) {
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }

  // Update password (with hashing)
  static async updatePassword(userId, newPassword) {
    let conn;
    try {
      conn = await pool.getConnection();
      
      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      
      await conn.query(
        'UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?',
        [hashedPassword, userId]
      );
      
      return true;
      
    } catch (error) {
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }

  // Clear reset token after successful reset
  static async clearResetToken(userId) {
    let conn;
    try {
      conn = await pool.getConnection();
      
      await conn.query(
        'UPDATE users SET reset_token = NULL, reset_token_expiry = NULL WHERE id = ?',
        [userId]
      );
      
      return true;
      
    } catch (error) {
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }

  // Get user with password (for internal use)
  static async getUserWithPassword(email) {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(
        'SELECT id, email, password, reset_token, reset_token_expiry FROM users WHERE email = ?',
        [email]
      );
      
      if (rows[0] && rows[0].id) {
        rows[0].id = Number(rows[0].id);
        if (rows[0].reset_token_expiry) {
          rows[0].reset_token_expiry = Number(rows[0].reset_token_expiry);
        }
      }
      
      return rows[0];
    } catch (error) {
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }

// Add this method to User.js
static async findByStripeCustomerId(customerId) {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(
      'SELECT * FROM users WHERE stripe_customer_id = ?',
      [customerId]
    );
    
    if (rows[0] && rows[0].id) {
      rows[0].id = Number(rows[0].id);
    }
    
    return rows[0];
  } catch (error) {
    throw error;
  } finally {
    if (conn) conn.release();
  }
}

}

module.exports = User;