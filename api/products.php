<?php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config.php';
require_once '../models/Product.php';

$productModel = new \App\Models\Product($pdo);

try {
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            // GET /products - returns JSON list of products (id, name, price)
            $products = $productModel->all();
            
            // Format response to match requirements (id, name, price only)
            $response = array_map(function($product) {
                return [
                    'id' => (int)$product['id'],
                    'name' => $product['name'],
                    'price' => (float)$product['price']
                ];
            }, $products);
            
            echo json_encode($response);
            break;
            
        case 'POST':
            // POST /products - accepts JSON input (name, price) and adds to list
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                throw new Exception('Invalid JSON input');
            }
            
            // Validate required fields
            if (empty($input['name'])) {
                throw new Exception('Product name is required');
            }
            
            if (!isset($input['price']) || !is_numeric($input['price']) || $input['price'] < 0) {
                throw new Exception('Valid price is required');
            }
            
            // Sanitize input
            $name = trim($input['name']);
            $price = floatval($input['price']);
            
            // Create product data (only name and price as per requirements)
            $productData = [
                'name' => $name,
                'price' => $price
            ];
            
            $success = $productModel->store($productData);
            
            if ($success) {
                // Get the newly created product
                $newProduct = $productModel->getLatest(1)[0];
                
                // Return only id, name, price as per requirements
                $response = [
                    'id' => (int)$newProduct['id'],
                    'name' => $newProduct['name'],
                    'price' => (float)$newProduct['price']
                ];
                
                http_response_code(201);
                echo json_encode($response);
            } else {
                throw new Exception('Failed to save product');
            }
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'error' => $e->getMessage()
    ]);
}
