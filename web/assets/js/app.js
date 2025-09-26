// Product Catalog JavaScript
$(document).ready(function () {
  'use strict';

  // Initialize app
  initializeApp();

  function initializeApp() {
    setupEventListeners();
    loadProducts();
  }

  function setupEventListeners() {
    $('#refreshProducts').on('click', function () {
      loadProducts();
    });

    $('#filterProducts').on('input', function () {
      searchProducts();
    });
    
    // Clear search on Escape key
    $('#filterProducts').on('keydown', function (e) {
      if (e.key === 'Escape') {
        $(this).val('');
        searchProducts();
      }
    });

    $('#saveProduct').on('click', function () {
      saveProduct();
    });
  }

  function loadProducts() {
    // TODO: Implement product loading
  }

  function searchProducts() {
    const searchTerm = $('#filterProducts').val().toLowerCase();
    const productCards = $('.col-xl-3');
    
    let visibleCount = 0;
    
    productCards.each(function() {
      const card = $(this);
      const productName = card.find('.card-title').text().toLowerCase();
      
      if (productName.includes(searchTerm)) {
        card.show();
        visibleCount++;
      } else {
        card.hide();
      }
    });
    
    // Show/hide no results message
    if (searchTerm && visibleCount === 0) {
      showNoResultsMessage();
    } else {
      hideNoResultsMessage();
    }
  }
  
  function showNoResultsMessage() {
    if ($('#noResultsMessage').length === 0) {
      $('#productsGrid').after(`
        <div id="noResultsMessage" class="col-12 text-center py-5">
          <i class="bi bi-search display-1 text-muted"></i>
          <h3 class="text-muted mt-3">No products found</h3>
          <p class="text-muted">Try adjusting your search terms</p>
        </div>
      `);
    }
  }
  
  function hideNoResultsMessage() {
    $('#noResultsMessage').remove();
  }

  function saveProduct() {
    // TODO: Implement product saving
  }
});
