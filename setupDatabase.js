const mariadb = require('mariadb');
require('dotenv').config();

async function setupDatabase() {
  let conn;
  try {
    // Connect to MySQL/MariaDB (without specifying database)
    conn = await mariadb.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    console.log('Connected to MySQL/MariaDB server');

    // Create database if it doesn't exist
    await conn.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'iloveconversion_db'}`);
    console.log(`Database ${process.env.DB_NAME || 'iloveconversion_db'} created or already exists`);

    // Use the database
    await conn.query(`USE ${process.env.DB_NAME || 'iloveconversion_db'}`);

    // Create users table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        country VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email)
      )
    `);
    
    console.log('Users table created or already exists');

    // Insert sample data (optional)
    try {
      await conn.query(`
        INSERT IGNORE INTO users (name, email, password, country) VALUES
        ('John Doe', 'john@example.com', '$2a$10$YourHashedPasswordHere', 'United States'),
        ('Jane Smith', 'jane@example.com', '$2a$10$YourHashedPasswordHere', 'Canada')
      `);
      console.log('Sample data inserted');
    } catch (err) {
      console.log('Sample data already exists or error:', err.message);
    }

    console.log('✅ Database setup completed successfully!');

  } catch (error) {
    console.error('❌ Database setup error:', error.message);
  } finally {
    if (conn) {
      await conn.end();
      console.log('Database connection closed');
    }
    process.exit();
  }
}

setupDatabase();