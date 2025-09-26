-- Create products table if it doesn't exist
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    image VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Clear existing data
DELETE FROM products;

-- Add image column if it doesn't exist
INSERT INTO products (id, name, price, image, created_at, updated_at) VALUES
(1, 'iPhone 15 Pro', 999.00, 'iphone-15-pro.jpg', NOW(), NOW()),
(2, 'MacBook Air M3', 1299.00, 'macbook-air-m3.jpg', NOW(), NOW()),
(3, 'Samsung Galaxy S24', 799.99, 'samsung-galaxy-s24.jpg', NOW(), NOW()),
(4, 'Dell XPS 13', 1199.00, 'dell-xps-13.jpg', NOW(), NOW()),
(5, 'iPad Pro 12.9"', 1099.00, 'ipad-pro-12.9.jpg', NOW(), NOW()),
(6, 'Sony WH-1000XM5', 399.99, 'sony-wh-1000xm5.jpg', NOW(), NOW()),
(7, 'Apple AirPods Pro', 249.00, 'apple-airpods-pro.jpg', NOW(), NOW()),
(8, 'Samsung Galaxy Tab S9', 799.99, 'samsung-galaxy-tab-s9.jpg', NOW(), NOW()),
(9, 'Microsoft Surface Laptop 5', 999.99, 'microsoft-surface-laptop-5.jpg', NOW(), NOW()),
(10, 'OnePlus 11', 699.99, 'oneplus-11.jpg', NOW(), NOW()),
(11, 'iPad Air 5th Gen', 599.00, 'ipad-air-5th-gen.jpg', NOW(), NOW()),
(12, 'Bose QuietComfort 45', 329.00, 'bose-quietcomfort-45.jpg', NOW(), NOW()),
(13, 'MacBook Pro 14"', 1999.00, 'macbook-pro-14.jpg', NOW(), NOW()),
(14, 'Google Pixel 8', 699.99, 'google-pixel-8.jpg', NOW(), NOW()),
(15, 'Microsoft Surface Pro 9', 999.99, 'microsoft-surface-pro-9.jpg', NOW(), NOW()),
(16, 'Sennheiser HD 660S', 499.99, 'sennheiser-hd-660s.jpg', NOW(), NOW()),
(17, 'Lenovo ThinkPad X1 Carbon', 1399.99, 'lenovo-thinkpad-x1-carbon.jpg', NOW(), NOW()),
(18, 'Nothing Phone 2', 599.99, 'nothing-phone-2.jpg', NOW(), NOW()),
(19, 'Samsung Galaxy Book3 Pro', 1249.99, 'samsung-galaxy-book3-pro.jpg', NOW(), NOW()),
(20, 'Apple Magic Keyboard', 99.00, 'apple-magic-keyboard.jpg', NOW(), NOW());

-- Set auto increment to continue from the last inserted ID
ALTER TABLE products AUTO_INCREMENT = 21;

-- Display summary
SELECT 
    'Products' as table_name, 
    COUNT(*) as record_count 
FROM products;
