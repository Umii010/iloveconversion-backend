-- Run this SQL in your MySQL database
CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  country VARCHAR(100),
  is_pro TINYINT DEFAULT 0,
  subscription_plan ENUM('free', 'monthly', 'yearly') DEFAULT 'free',
  stripe_customer_id VARCHAR(255),
  subscription_id VARCHAR(255),
  current_period_end DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  reset_token VARCHAR(255),
  reset_token_expiry BIGINT,
  INDEX idx_email (email),
  INDEX idx_stripe_customer (stripe_customer_id)
);

-- Add subscription_plan column if table already exists
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS subscription_plan ENUM('free', 'monthly', 'yearly') DEFAULT 'free',
ADD COLUMN IF NOT EXISTS is_pro TINYINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS subscription_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS current_period_end DATETIME;
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS cancel_at DATETIME NULL,