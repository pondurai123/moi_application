-- Wedding Gift Collection App - Database Schema
-- Run: mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS wedding_gifts CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE wedding_gifts;

CREATE TABLE IF NOT EXISTS weddings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  groomName VARCHAR(255) NOT NULL,
  brideName VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  weddingDate DATE NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gifts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  weddingId INT NOT NULL,
  donorName VARCHAR(255) NOT NULL,
  donorPlace VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (weddingId) REFERENCES weddings(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  passwordHash VARCHAR(255) NOT NULL,
  role ENUM('SUPER_ADMIN', 'ADMIN') DEFAULT 'ADMIN',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Default super admin: username=admin, password=admin123
INSERT IGNORE INTO admin_users (username, passwordHash, role)
VALUES ('admin', '$2a$10$JwoXrb3JVHoaX6EbH67J7uQDi4JlpGLD6THpIcLN543ypDDRv.IHa', 'SUPER_ADMIN');
