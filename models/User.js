const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  // Create new user
  static async create(userData) {
    let conn;
    try {
      conn = await pool.getConnection();
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      const result = await conn.query(
        'INSERT INTO users (name, email, password, country) VALUES (?, ?, ?, ?)',
        [userData.name, userData.email, hashedPassword, userData.country]
      );
      
      // Convert BigInt to Number
      const userId = Number(result.insertId);
      
      return {
        id: userId,
        name: userData.name,
        email: userData.email,
        country: userData.country
      };
      
    } catch (error) {
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }

  // Find user by email
  static async findByEmail(email) {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(
        'SELECT * FROM users WHERE email = ?',
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
  static async getById(id) {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(
        'SELECT id, name, email, country, created_at FROM users WHERE id = ?',
        [id]
      );
      
      if (rows[0] && rows[0].id) {
        // Convert BigInt to Number
        rows[0].id = Number(rows[0].id);
      }
      
      return rows[0];
    } catch (error) {
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }

  // Update user
  static async update(id, userData) {
    let conn;
    try {
      conn = await pool.getConnection();
      
      let query = 'UPDATE users SET ';
      const values = [];
      const updates = [];
      
      if (userData.name) {
        updates.push('name = ?');
        values.push(userData.name);
      }
      
      if (userData.email) {
        updates.push('email = ?');
        values.push(userData.email);
      }
      
      if (userData.password) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);
        updates.push('password = ?');
        values.push(hashedPassword);
      }
      
      if (userData.country) {
        updates.push('country = ?');
        values.push(userData.country);
      }
      
      if (updates.length === 0) {
        throw new Error('No fields to update');
      }
      
      query += updates.join(', ') + ' WHERE id = ?';
      values.push(id);
      
      await conn.query(query, values);
      return true;
      
    } catch (error) {
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
}

module.exports = User;