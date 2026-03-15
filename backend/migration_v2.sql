-- v2.0 Migration: Language, Function Types, Typists, Settings, Receipt Support
-- Run: mysql -u root -p123456 wedding_gifts < migration_v2.sql

USE wedding_gifts;

-- =============================================
-- 1. function_types table
-- =============================================
CREATE TABLE IF NOT EXISTS function_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nameEn VARCHAR(255) NOT NULL,
  nameTa VARCHAR(255) NOT NULL,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed default function types
INSERT IGNORE INTO function_types (id, nameEn, nameTa) VALUES
  (1, 'Marriage', 'திருமணம்'),
  (2, 'Engagement', 'நிச்சயதார்த்தம்'),
  (3, 'Baby Shower', 'வளைகாப்பு'),
  (4, 'Birthday', 'பிறந்தநாள்'),
  (5, 'House Warming', 'கிரகப்பிரவேசம்');

-- =============================================
-- 2. typists table
-- =============================================
CREATE TABLE IF NOT EXISTS typists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  eventId INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (eventId) REFERENCES weddings(id) ON DELETE CASCADE
);

-- =============================================
-- 3. settings table
-- =============================================
CREATE TABLE IF NOT EXISTS settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  settingKey VARCHAR(100) NOT NULL UNIQUE,
  settingValue TEXT,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Seed default settings
INSERT IGNORE INTO settings (settingKey, settingValue) VALUES
  ('phone', '+91 98765 43210'),
  ('brandName', 'Moi Application'),
  ('brandContact', 'www.moiapp.com | support@moiapp.com'),
  ('receiptAdditionalText', 'Thank you for your generous contribution!'),
  ('logoUrl', '');

-- =============================================
-- 4. ALTER weddings table
-- =============================================
ALTER TABLE weddings ADD COLUMN functionTypeId INT DEFAULT 1 AFTER id;
ALTER TABLE weddings ADD COLUMN phoneNumber VARCHAR(20) DEFAULT '' AFTER location;

-- =============================================
-- 5. ALTER gifts table
-- =============================================
ALTER TABLE gifts ADD COLUMN typistId INT DEFAULT NULL AFTER weddingId;
ALTER TABLE gifts ADD COLUMN denominations JSON DEFAULT NULL AFTER amount;
ALTER TABLE gifts ADD COLUMN receiptNumber VARCHAR(50) DEFAULT NULL AFTER denominations;
