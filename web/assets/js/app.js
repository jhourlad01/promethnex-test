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
    
    $('#sortSelect').on('change', function () {
      sortProducts();
    });
    
    $('#clearFilters').on('click', function () {
      clearFilters();
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
  
  function sortProducts() {
    const sortValue = $('#sortSelect').val();
    const productCards = $('.col-xl-3').toArray();
    
    productCards.sort(function(a, b) {
      const cardA = $(a);
      const cardB = $(b);
      
      switch(sortValue) {
        case 'name-asc':
          return cardA.find('.card-title').text().localeCompare(cardB.find('.card-title').text());
        case 'name-desc':
          return cardB.find('.card-title').text().localeCompare(cardA.find('.card-title').text());
        case 'price-asc':
          const priceA = parseFloat(cardA.find('.h4').text().replace('$', '').replace(',', ''));
          const priceB = parseFloat(cardB.find('.h4').text().replace('$', '').replace(',', ''));
          return priceA - priceB;
        case 'price-desc':
          const priceA2 = parseFloat(cardA.find('.h4').text().replace('$', '').replace(',', ''));
          const priceB2 = parseFloat(cardB.find('.h4').text().replace('$', '').replace(',', ''));
          return priceB2 - priceA2;
        default:
          return 0;
      }
    });
    
    // Re-append sorted cards
    $('#productsGrid').empty().append(productCards);
  }
  
  function clearFilters() {
    $('#filterProducts').val('');
    $('#sortSelect').val('');
    $('.col-xl-3').show();
    hideNoResultsMessage();
  }

  function saveProduct() {
    // TODO: Implement product saving
  }
});
