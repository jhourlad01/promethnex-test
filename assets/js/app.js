// Product Catalog JavaScript
/* global JustValidate */
$(document).ready(function () {
  'use strict';

  // Initialize app
  initializeApp();

  function initializeApp() {
    setupEventListeners();
    setupFormValidation();
    loadProducts();
  }

  function setupEventListeners() {

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

  function setupFormValidation() {
    const validation = new JustValidate('#addProductForm', {
      errorFieldCssClass: 'is-invalid',
      errorLabelCssClass: 'invalid-feedback',
      successFieldCssClass: 'is-valid',
    });

    validation
      .addField('#productName', [
        {
          rule: 'required',
          errorMessage: 'Product name is required'
        },
        {
          rule: 'minLength',
          value: 3,
          errorMessage: 'Product name must be at least 3 characters'
        },
        {
          rule: 'maxLength',
          value: 50,
          errorMessage: 'Product name must be less than 50 characters'
        }
      ])
      .addField('#productPrice', [
        {
          rule: 'required',
          errorMessage: 'Price is required'
        },
        {
          rule: 'minNumber',
          value: 0.01,
          errorMessage: 'Price must be at least $0.01'
        },
        {
          rule: 'maxNumber',
          value: 10000,
          errorMessage: 'Price cannot exceed $10,000'
        }
      ])
      .addField('#productImage', [
        {
          rule: 'required',
          errorMessage: 'Product image is required'
        }
      ])
      .onSuccess((event) => {
        event.preventDefault();
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
      case 'price-asc': {
        const priceA = parseFloat(cardA.find('.h4').text().replace('$', '').replace(',', ''));
        const priceB = parseFloat(cardB.find('.h4').text().replace('$', '').replace(',', ''));
        return priceA - priceB;
      }
      case 'price-desc': {
        const priceA2 = parseFloat(cardA.find('.h4').text().replace('$', '').replace(',', ''));
        const priceB2 = parseFloat(cardB.find('.h4').text().replace('$', '').replace(',', ''));
        return priceB2 - priceA2;
      }
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
    const name = $('#productName').val().trim();
    const price = parseFloat($('#productPrice').val());
    const imageFile = $('#productImage')[0].files[0];
    
    // Show loading state
    const saveBtn = $('#saveProduct');
    const originalText = saveBtn.html();
    saveBtn.prop('disabled', true).html('<i class="bi bi-hourglass-split me-2"></i>Saving...');
    
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('name', name);
    formData.append('price', price);
    formData.append('image', imageFile);
    
    // Send request
    $.ajax({
      url: 'api/add-product.php',
      method: 'POST',
      processData: false,
      contentType: false,
      data: formData,
      success: function(response) {
        if (response.success) {
          // Close modal
          $('#addProductModal').modal('hide');
          
          // Clear form
          $('#addProductForm')[0].reset();
          
          // Show success message
          showSuccessMessage('Product added successfully!');
          
          // Reload products (in a real app, you'd add the new product to the DOM)
          setTimeout(() => {
            location.reload();
          }, 1000);
        } else {
          showErrorMessage(response.error || 'Failed to save product');
        }
      },
      error: function(xhr) {
        let errorMessage = 'Failed to save product';
        try {
          const response = JSON.parse(xhr.responseText);
          errorMessage = response.error || errorMessage;
        } catch (e) {
          // Use default error message
        }
        showErrorMessage(errorMessage);
      },
      complete: function() {
        // Restore button state
        saveBtn.prop('disabled', false).html(originalText);
      }
    });
  }
  
  function showSuccessMessage(message) {
    // Create and show success alert
    const alert = $(`
      <div class="alert alert-success alert-dismissible fade show position-fixed" 
           style="top: 20px; right: 20px; z-index: 9999; min-width: 300px;">
        <i class="bi bi-check-circle me-2"></i>${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>
    `);
    
    $('body').append(alert);
    
    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      alert.alert('close');
    }, 3000);
  }
  
  function showErrorMessage(message) {
    // Create and show error alert
    const alert = $(`
      <div class="alert alert-danger alert-dismissible fade show position-fixed" 
           style="top: 20px; right: 20px; z-index: 9999; min-width: 300px;">
        <i class="bi bi-exclamation-triangle me-2"></i>${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>
    `);
    
    $('body').append(alert);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      alert.alert('close');
    }, 5000);
  }
});
