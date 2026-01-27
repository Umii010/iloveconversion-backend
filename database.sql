-- Create database
CREATE DATABASE IF NOT EXISTS iloveconversion CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE iloveconversion;

-- Users table
CREATE TABLE IF NOT EXISTS Users (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    googleId VARCHAR(255) UNIQUE,
    githubId VARCHAR(255) UNIQUE,
    username VARCHAR(100) UNIQUE,
    role ENUM('free', 'premium', 'admin') DEFAULT 'free',
    maxFiles INT DEFAULT 20,
    maxFileSize BIGINT DEFAULT 104857600, -- 100MB
    lastLogin DATETIME,
    emailVerified BOOLEAN DEFAULT FALSE,
    avatar VARCHAR(500),
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_googleId (googleId),
    INDEX idx_githubId (githubId),
    INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Subscriptions table
CREATE TABLE IF NOT EXISTS Subscriptions (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    userId CHAR(36) NOT NULL,
    plan VARCHAR(50) NOT NULL DEFAULT 'free',
    status ENUM('active', 'canceled', 'expired', 'pending') DEFAULT 'active',
    maxFiles INT DEFAULT 20,
    currentPeriodStart DATETIME,
    currentPeriodEnd DATETIME,
    cancelAtPeriodEnd BOOLEAN DEFAULT FALSE,
    canceledAt DATETIME,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX idx_userId (userId),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payments table
CREATE TABLE IF NOT EXISTS Payments (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    userId CHAR(36) NOT NULL,
    orderId VARCHAR(255) NOT NULL,
    transactionId VARCHAR(255),
    plan VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    paidAt DATETIME,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX idx_userId (userId),
    INDEX idx_orderId (orderId),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Usage logs table
CREATE TABLE IF NOT EXISTS UsageLogs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId CHAR(36),
    tool VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    fileCount INT,
    totalSize BIGINT,
    success BOOLEAN DEFAULT TRUE,
    ipAddress VARCHAR(45),
    userAgent TEXT,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE SET NULL,
    INDEX idx_userId (userId),
    INDEX idx_tool (tool),
    INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert free subscription for existing users if any
INSERT IGNORE INTO Subscriptions (userId, plan, status, maxFiles)
SELECT id, 'free', 'active', 20 FROM Users WHERE id NOT IN (SELECT userId FROM Subscriptions);