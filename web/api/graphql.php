<?php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config.php';
require_once '../models/Product.php';

// Simple GraphQL endpoint for fetching products
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['query'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid GraphQL query']);
    exit;
}

$query = $input['query'];

try {
    $productModel = new \App\Models\Product($pdo);
    
    // Simple GraphQL query parser for products
    if (strpos($query, 'products') !== false) {
        $products = $productModel->all();
        
        // Format response based on requested fields
        $response = [
            'data' => [
                'products' => array_map(function($product) {
                    return [
                        'id' => (int)$product['id'],
                        'name' => $product['name'],
                        'price' => (float)$product['price'],
                        'description' => $product['description'] ?? null,
                        'image' => $product['image'] ?? null
                    ];
                }, $products)
            ]
        ];
        
        echo json_encode($response);
    } else {
        throw new Exception('Unknown query');
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'error' => $e->getMessage()
    ]);
}
