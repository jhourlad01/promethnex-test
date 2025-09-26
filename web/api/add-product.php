<?php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

require_once '../config.php';
require_once '../models/Product.php';

try {
    // Validate required fields
    if (empty($_POST['name'])) {
        throw new Exception('Product name is required');
    }
    
    if (!isset($_POST['price']) || $_POST['price'] < 0) {
        throw new Exception('Valid price is required');
    }
    
    if (empty($_FILES['image']['name'])) {
        throw new Exception('Product image is required');
    }
    
    if (empty($_POST['description']) || strlen(trim($_POST['description'])) < 10) {
        throw new Exception('Description is required and must be at least 10 characters');
    }
    
    // Sanitize input
    $name = trim($_POST['name']);
    $price = floatval($_POST['price']);
    $description = trim($_POST['description']);
    $imageFile = $_FILES['image'];
    
    // Validate image file
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!in_array($imageFile['type'], $allowedTypes)) {
        throw new Exception('Invalid image type. Only JPG, PNG, and GIF are allowed.');
    }
    
    // Create upload directory if it doesn't exist
    $uploadDir = '../assets/images/products/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    
    // Generate unique filename
    $fileExtension = pathinfo($imageFile['name'], PATHINFO_EXTENSION);
    $baseName = strtolower(str_replace([' ', '"'], ['-', ''], $name));
    $fileName = $baseName . '-' . uniqid() . '.' . $fileExtension;
    $filePath = $uploadDir . $fileName;
    
    // Move uploaded file
    if (!move_uploaded_file($imageFile['tmp_name'], $filePath)) {
        throw new Exception('Failed to upload image');
    }
    
    // Create product model and save
    $productModel = new \App\Models\Product($pdo);
    
    $productData = [
        'name' => $name,
        'price' => $price,
        'description' => $description,
        'image' => $fileName
    ];
    
    $success = $productModel->store($productData);
    
    if ($success) {
        // Get the newly created product
        $newProduct = $productModel->getLatest(1)[0];
        
        echo json_encode([
            'success' => true,
            'message' => 'Product added successfully',
            'product' => $newProduct
        ]);
    } else {
        throw new Exception('Failed to save product');
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
