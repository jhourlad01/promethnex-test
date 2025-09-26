<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Product Catalog - Home</title>

    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Bootstrap Icons -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css" rel="stylesheet">
    <!-- Custom CSS (compiled from SCSS) -->
    <link href="assets/css/style.css" rel="stylesheet">
</head>

<body>
    <!-- Navigation -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
        <div class="container">
            <a class="navbar-brand fw-bold" href="index.html">
                <i class="bi bi-shop me-2"></i>Product Catalog
            </a>

            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>

            <div class="collapse navbar-collapse" id="navbarNav">
                <div class="d-flex ms-auto">
                    <button class="btn btn-outline-light" type="button" id="refreshProducts">
                        <i class="bi bi-arrow-clockwise me-1"></i>Refresh
                    </button>
                </div>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <section class="hero-section">
        <div class="container">
            <div class="row justify-content-center">
                <div class="col-lg-8 text-center">
                    <h1 class="display-4 fw-bold text-primary mb-3">Product Catalog</h1>
                    <p class="lead text-muted mb-4">
                        Browse and manage your product inventory with our simple and intuitive catalog system.
                        Built with REST API and GraphQL support.
                    </p>
                    <div class="d-flex justify-content-center gap-3">
                        <button class="btn btn-primary btn-lg" data-bs-toggle="modal" data-bs-target="#addProductModal">
                            <i class="bi bi-plus-circle me-2"></i>Add New Product
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Search and Filter Section -->
    <section class="py-4 bg-white border-bottom">
        <div class="container">
            <div class="row">
                <div class="col-lg-8">
                    <div class="input-group">
                        <span class="input-group-text">
                            <i class="bi bi-search"></i>
                        </span>
                        <input type="text" class="form-control" id="searchInput"
                            placeholder="Search products by name...">
                        <button class="btn btn-outline-secondary" type="button" id="searchBtn">
                            Search
                        </button>
                    </div>
                </div>
                <div class="col-lg-4">
                    <div class="d-flex gap-2">
                        <select class="form-select" id="sortSelect">
                            <option value="">Sort by...</option>
                            <option value="name-asc">Name (A-Z)</option>
                            <option value="name-desc">Name (Z-A)</option>
                            <option value="price-asc">Price (Low to High)</option>
                            <option value="price-desc">Price (High to Low)</option>
                        </select>
                        <button class="btn btn-outline-secondary" type="button" id="clearFilters">
                            <i class="bi bi-x-circle"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Products Section -->
    <section class="py-5">
        <div class="container">
            <!-- Loading Spinner -->
            <div class="text-center py-5" id="loadingSpinner" style="display: none;">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-3 text-muted">Loading products...</p>
            </div>

            <!-- Products Grid -->
            <div class="row" id="productsGrid">
                <!-- Products will be loaded here dynamically -->
            </div>

            <!-- Empty State -->
            <div class="text-center py-5" id="emptyState" style="display: none;">
                <i class="bi bi-inbox display-1 text-muted mb-3"></i>
                <h3 class="text-muted">No Products Found</h3>
                <p class="text-muted mb-4">Start by adding your first product to the catalog.</p>
                <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addProductModal">
                    <i class="bi bi-plus-circle me-2"></i>Add First Product
                </button>
            </div>

            <!-- Error State -->
            <div class="text-center py-5" id="errorState" style="display: none;">
                <i class="bi bi-exclamation-triangle display-1 text-danger mb-3"></i>
                <h3 class="text-danger">Error Loading Products</h3>
                <p class="text-muted mb-4" id="errorMessage">Something went wrong while loading the products.</p>
                <button class="btn btn-primary" id="retryLoad">
                    <i class="bi bi-arrow-clockwise me-2"></i>Try Again
                </button>
            </div>
        </div>
    </section>

    <!-- Add Product Modal -->
    <div class="modal fade" id="addProductModal" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        <i class="bi bi-plus-circle me-2"></i>Add New Product
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form id="addProductForm">
                        <div class="mb-3">
                            <label for="productName" class="form-label">Product Name</label>
                            <input type="text" class="form-control" id="productName" required>
                            <div class="invalid-feedback" id="nameError"></div>
                        </div>
                        <div class="mb-3">
                            <label for="productPrice" class="form-label">Price</label>
                            <div class="input-group">
                                <span class="input-group-text">$</span>
                                <input type="number" class="form-control" id="productPrice" step="0.01" min="0"
                                    required>
                                <div class="invalid-feedback" id="priceError"></div>
                            </div>
                        </div>
                        <div class="mb-3">
                            <label for="productDescription" class="form-label">Description (Optional)</label>
                            <textarea class="form-control" id="productDescription" rows="3"></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-primary" id="saveProduct">
                        <i class="bi bi-check-circle me-2"></i>Save Product
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- GraphQL Modal -->
    <div class="modal fade" id="graphqlModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        <i class="bi bi-diagram-3 me-2"></i>GraphQL Playground
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="mb-3">
                        <label for="graphqlQuery" class="form-label">GraphQL Query</label>
                        <textarea class="form-control font-monospace" id="graphqlQuery" rows="8"
                            placeholder="Enter your GraphQL query here...">query {
  products {
    id
    name
    price
  }
}</textarea>
                    </div>
                    <button class="btn btn-primary" id="executeGraphQL">
                        <i class="bi bi-play-circle me-2"></i>Execute Query
                    </button>
                </div>
                <div class="modal-footer">
                    <pre class="text-start" id="graphqlResult" style="display: none;"></pre>
                </div>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <footer class="bg-dark text-light py-4 mt-5">
        <div class="container">
            <div class="row">
                <div class="col-md-6">
                    <h5><i class="bi bi-shop me-2"></i>Product Catalog</h5>
                    <p class="text-muted">Simple product management with REST API and GraphQL support.</p>
                </div>
                <div class="col-md-6 text-md-end">
                    <p class="text-muted mb-0">
                        Built with Bootstrap 5, jQuery, and PHP<br>
                        <small>&copy; 2024 Product Catalog. All rights reserved.</small>
                    </p>
                </div>
            </div>
        </div>
    </footer>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    <!-- jQuery -->
    <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
</body>

</html>