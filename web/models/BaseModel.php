<?php

abstract class BaseModel
{
    protected PDO $pdo;
    protected string $table;
    protected string $primaryKey = 'id';
    protected string $createdAt = 'created_at';
    protected string $updatedAt = 'updated_at';
    
    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }
    
    public function all(): array
    {
        $sql = "SELECT * FROM {$this->table} ORDER BY {$this->createdAt} DESC";
        return $this->pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC);
    }
    
    public function find(int $id): ?array
    {
        $sql = "SELECT * FROM {$this->table} WHERE {$this->primaryKey} = ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }
    
    public function destroy(int $id): bool
    {
        $sql = "DELETE FROM {$this->table} WHERE {$this->primaryKey} = ?";
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute([$id]);
    }
    
    public function count(): int
    {
        $sql = "SELECT COUNT(*) FROM {$this->table}";
        return (int) $this->pdo->query($sql)->fetchColumn();
    }
    
    public function exists(int $id): bool
    {
        $sql = "SELECT COUNT(*) FROM {$this->table} WHERE {$this->primaryKey} = ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$id]);
        return $stmt->fetchColumn() > 0;
    }
    
    public function paginate(int $page = 1, int $limit = 10): array
    {
        $offset = ($page - 1) * $limit;
        $sql = "SELECT * FROM {$this->table} ORDER BY {$this->createdAt} DESC LIMIT ? OFFSET ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$limit, $offset]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    public function totalPages(int $limit = 10): int
    {
        return (int) ceil($this->count() / $limit);
    }
    
    protected function execute(string $sql, array $params = []): bool
    {
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute($params);
    }
    
    protected function query(string $sql, array $params = []): array
    {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    public function store(array $data): bool
    {
        $columns = array_keys($data);
        $placeholders = array_fill(0, count($columns), '?');
        $sql = "INSERT INTO {$this->table} (" . implode(', ', $columns) . ") VALUES (" . implode(', ', $placeholders) . ")";
        return $this->execute($sql, array_values($data));
    }
    
    public function update(int $id, array $data): bool
    {
        $setClause = [];
        foreach (array_keys($data) as $column) {
            $setClause[] = "{$column} = ?";
        }
        $sql = "UPDATE {$this->table} SET " . implode(', ', $setClause) . ", {$this->updatedAt} = CURRENT_TIMESTAMP WHERE {$this->primaryKey} = ?";
        $params = array_values($data);
        $params[] = $id;
        return $this->execute($sql, $params);
    }
    
    public function search(string $query, array $columns = []): array
    {
        if (empty($columns)) {
            $columns = ['name', 'description'];
        }
        $searchConditions = [];
        $params = [];
        foreach ($columns as $column) {
            $searchConditions[] = "{$column} LIKE ?";
            $params[] = "%{$query}%";
        }
        $sql = "SELECT * FROM {$this->table} WHERE " . implode(' OR ', $searchConditions) . " ORDER BY {$this->createdAt} DESC";
        return $this->query($sql, $params);
    }
    
    public function getLatest(int $limit = 5): array
    {
        $sql = "SELECT * FROM {$this->table} ORDER BY {$this->createdAt} DESC LIMIT ?";
        return $this->query($sql, [$limit]);
    }
}
