-- Create products table if it doesn't exist
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Clear existing data
DELETE FROM products;
INSERT INTO products (id, name, price, description, created_at, updated_at) VALUES
(1, 'iPhone 15 Pro', 999.00, 'Latest Apple smartphone with titanium design and A17 Pro chip', NOW(), NOW()),
(2, 'MacBook Air M3', 1299.00, 'Ultra-thin laptop with M3 chip performance and all-day battery', NOW(), NOW()),
(3, 'Samsung Galaxy S24', 799.99, 'AI-powered Android flagship smartphone with advanced camera system', NOW(), NOW()),
(4, 'Dell XPS 13', 1199.00, 'Premium Windows laptop with stunning InfinityEdge display', NOW(), NOW()),
(5, 'iPad Pro 12.9"', 1099.00, 'Professional tablet with M2 chip and Apple Pencil support', NOW(), NOW()),
(6, 'Sony WH-1000XM5', 399.99, 'Industry-leading noise canceling wireless headphones', NOW(), NOW()),
(7, 'Apple AirPods Pro', 249.00, 'Active noise cancellation with spatial audio', NOW(), NOW()),
(8, 'Samsung Galaxy Tab S9', 799.99, 'Premium Android tablet with S Pen included', NOW(), NOW()),
(9, 'Microsoft Surface Laptop 5', 999.99, 'Elegant Windows laptop with touch screen and premium build', NOW(), NOW()),
(10, 'OnePlus 11', 699.99, 'Flagship Android phone with fast charging and smooth performance', NOW(), NOW()),
(11, 'iPad Air 5th Gen', 599.00, 'Powerful tablet with M1 chip and colorful design options', NOW(), NOW()),
(12, 'Bose QuietComfort 45', 329.00, 'Premium noise-canceling headphones with superior sound quality', NOW(), NOW()),
(13, 'MacBook Pro 14"', 1999.00, 'Professional laptop with M3 Pro chip and Liquid Retina XDR display', NOW(), NOW()),
(14, 'Google Pixel 8', 699.99, 'AI-powered smartphone with exceptional camera and Google services', NOW(), NOW()),
(15, 'Microsoft Surface Pro 9', 999.99, 'Versatile 2-in-1 device that works as tablet and laptop', NOW(), NOW()),
(16, 'Sennheiser HD 660S', 499.99, 'High-end open-back headphones for audiophiles', NOW(), NOW()),
(17, 'Lenovo ThinkPad X1 Carbon', 1399.99, 'Business laptop with legendary ThinkPad reliability', NOW(), NOW()),
(18, 'Nothing Phone 2', 599.99, 'Unique Android phone with transparent design and Glyph interface', NOW(), NOW()),
(19, 'Samsung Galaxy Book3 Pro', 1249.99, 'Premium Windows laptop with AMOLED display', NOW(), NOW()),
(20, 'Apple Magic Keyboard', 99.00, 'Wireless keyboard with scissor mechanism and built-in battery', NOW(), NOW());

-- Set auto increment to continue from the last inserted ID
ALTER TABLE products AUTO_INCREMENT = 21;

-- Display summary
SELECT 
    'Products' as table_name, 
    COUNT(*) as record_count 
FROM products;
