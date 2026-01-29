const mariadb = require('mariadb');
require('dotenv').config();

// Create connection pool
const pool = mariadb.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'iloveconversion_db',
  connectionLimit: 5,
  allowPublicKeyRetrieval: true
});

// Test database connection
const testConnection = async () => {
  let conn;
  try {
    conn = await pool.getConnection();
    console.log('✅ Database connected successfully');
    
    // Create users table if it doesn't exist
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        country VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ Users table ready');
    
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
  } finally {
    if (conn) conn.release();
  }
};

module.exports = {
  pool,
  testConnection
};