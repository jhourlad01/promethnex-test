<?php

require_once __DIR__ . '/BaseModel.php';

class Product extends BaseModel
{
    protected string $table = 'products';
    
    public function findByPriceRange(float $min, float $max): array
    {
        $sql = "SELECT * FROM {$this->table} WHERE price BETWEEN ? AND ? ORDER BY price ASC";
        return $this->query($sql, [$min, $max]);
    }
    
    public function findByCategory(string $category): array
    {
        $sql = "SELECT * FROM {$this->table} WHERE category = ? ORDER BY {$this->createdAt} DESC";
        return $this->query($sql, [$category]);
    }
    
    public function getExpensiveProducts(float $minPrice = 500): array
    {
        $sql = "SELECT * FROM {$this->table} WHERE price >= ? ORDER BY price DESC";
        return $this->query($sql, [$minPrice]);
    }
}
