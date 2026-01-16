// if (window.location.pathname === "/account/register") {
//   window.location.replace("https://kittly.com/pages/register");
//   console.log("URL Redirected");
// }

// Track selections
let selectedPrintingMethod = null;
const selectedDisplay = document.getElementById('selected-option');
const addButton = document.getElementById('add-to-cart-with-print');
const statusMessage = document.getElementById('status-message');
const multipleToggle = document.getElementById('multiple-toggle');

// Artwork upload elements
const artworkInput = document.getElementById('artwork-upload');
const fileNameDisplay = document.getElementById('file-name');
const previewContainer = document.getElementById('artwork-preview-container');
const previewImage = document.getElementById('artwork-preview');
const removeArtworkBtn = document.getElementById('remove-artwork');
const artworkFileInfo = document.getElementById('artwork-file-info');

let uploadedArtworkFile = null;
let artworkBase64 = null;

// Handle artwork file upload
artworkInput.addEventListener('change', function(e) {
  const file = e.target.files[0];
  
  if (!file) return;
  
  // Validate file size (10MB max)
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes
  if (file.size > maxSize) {
    alert('File size exceeds 10MB. Please choose a smaller file.');
    artworkInput.value = '';
    return;
  }
  
  // Validate file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'application/postscript', 'application/illustrator'];
  if (!validTypes.includes(file.type) && !file.name.match(/\.(ai|eps)$/i)) {
    alert('Invalid file type. Please upload JPG, PNG, PDF, AI, or EPS files.');
    artworkInput.value = '';
    return;
  }
  
  uploadedArtworkFile = file;
  fileNameDisplay.textContent = file.name;
  
  // Show file info
  const fileSizeKB = (file.size / 1024).toFixed(2);
  artworkFileInfo.textContent = `${file.name} (${fileSizeKB} KB)`;
  
  // Convert to base64 for storage
  const reader = new FileReader();
  reader.onload = function(event) {
    artworkBase64 = event.target.result;
    
    // Show preview only for images
    if (file.type.startsWith('image/')) {
      previewImage.src = event.target.result;
      previewImage.style.display = 'block';
    } else {
      previewImage.style.display = 'none';
    }
    
    previewContainer.style.display = 'block';
    removeArtworkBtn.style.display = 'flex'; // Show remove button when image is uploaded
  };
  
  reader.readAsDataURL(file);
});

// Remove artwork
removeArtworkBtn.addEventListener('click', function() {
  artworkInput.value = '';
  uploadedArtworkFile = null;
  artworkBase64 = null;
  fileNameDisplay.textContent = 'No file chosen';
  previewContainer.style.display = 'none';
  previewImage.src = '';
  removeArtworkBtn.style.display = 'none'; // Hide remove button
});

// Main Printing Method selection
document.getElementById('print-options').addEventListener('click', (e) => {
  if (e.target.tagName === 'LI') {
    document.querySelectorAll('#print-options li').forEach(li => li.classList.remove('active'));
    e.target.classList.add('active');
    
    selectedPrintingMethod = e.target.getAttribute('data-value');
    selectedDisplay.textContent = selectedPrintingMethod;
    
    updateAddButtonState();
  }
});

// Improved variant detection
function getCurrentVariantId() {
  const variantInput = document.querySelector('select[name="id"], input[name="id"][type="hidden"], input[name="id"]');
  
  if (variantInput) {
    const val = variantInput.value;
    if (val && !isNaN(val)) {
      return parseInt(val);
    }
  }
  
  if (typeof product !== 'undefined' && product.selected_or_first_available_variant) {
    return product.selected_or_first_available_variant.id;
  }
  
  return null;
}

function updateAddButtonState() {
  const variantId = getCurrentVariantId();
  addButton.disabled = false;
}

document.addEventListener('change', (e) => {
  if (e.target.name === 'id') {
    updateAddButtonState();
  }
});

updateAddButtonState();

// Calculate totals from variation boxes only
function calculateTotals() {
  let totalQuantity = 0;
  let totalPrice = 0;

  const quantityInputs = document.querySelectorAll('.size-quantity-input:not([disabled])');
  
  quantityInputs.forEach(input => {
    const qty = parseInt(input.value) || 0;
    const price = parseFloat(input.getAttribute('data-variant-price')) || 0;
    
    totalQuantity += qty;
    totalPrice += (qty * price) / 100;
  });

  document.getElementById('total-quantity').textContent = totalQuantity;
  document.getElementById('total-price').textContent = '$' + totalPrice.toFixed(2);

  const errorElement = document.getElementById('quantity-error');
  if (totalQuantity > 0 && totalQuantity < 20) {
    errorElement.textContent = 'Minimum order quantity is 20';
  } else {
    errorElement.textContent = '';
  }

  return { totalQuantity, totalPrice };
}

// Add event listeners to variation box inputs
document.addEventListener('input', (e) => {
  if (e.target.classList.contains('size-quantity-input')) {
    calculateTotals();
  }
});

// Add to cart with bulk orders and artwork
addButton.addEventListener('click', async () => {
  if (!selectedPrintingMethod) {
    statusMessage.textContent = 'Please select a printing method.';
    statusMessage.style.color = 'red';
    return;
  }

  const { totalQuantity } = calculateTotals();

  if (totalQuantity < 20) {
    statusMessage.textContent = 'Minimum order quantity is 20. Please add more items.';
    statusMessage.style.color = 'red';
    return;
  }

  // Collect decoration values
  const back = document.getElementById('decoration-back').value;
  const right = document.getElementById('decoration-right').value;
  const left = document.getElementById('decoration-left').value;

  const properties = {
    'Front/Chest Printing Method': selectedPrintingMethod
  };

  if (back && back !== '') properties['Decoration On Back'] = back;
  if (right && right !== '') properties['Decoration On Right Hand Sleeve'] = right;
  if (left && left !== '') properties['Decoration On Left Hand Sleeve'] = left;
  
  // Add artwork information if uploaded
  if (uploadedArtworkFile) {
    properties['Artwork File Name'] = uploadedArtworkFile.name;
    properties['Artwork File Size'] = `${(uploadedArtworkFile.size / 1024).toFixed(2)} KB`;
  }

  // Collect all variants with quantities
  const items = [];
  const quantityInputs = document.querySelectorAll('.size-quantity-input');

  quantityInputs.forEach(input => {
    const qty = parseInt(input.value) || 0;
    const variantId = parseInt(input.getAttribute('data-variant-id'));
    
    if (qty > 0 && variantId) {
      const sizeItem = input.closest('.size-item');
      const color = sizeItem.getAttribute('data-color');
      const size = sizeItem.getAttribute('data-size');

      items.push({
        id: variantId,
        quantity: qty,
        properties: {
          ...properties,
          'Color': color,
          'Size': size
        }
      });
    }
  });

  if (items.length === 0) {
    statusMessage.textContent = 'Please add quantities to at least one size.';
    statusMessage.style.color = 'red';
    return;
  }

  try {
    statusMessage.textContent = 'Adding to cart...';
    statusMessage.style.color = '#333';

    const response = await fetch('/cart/add.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ items: items })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.description || 'Failed to add to cart');
    }

    statusMessage.textContent = `Successfully added ${totalQuantity} items to cart!`;
    statusMessage.style.color = 'green';

    // Refresh cart
    if (window.Shopify && Shopify.getCart) Shopify.getCart();
    
    // Reset form
    setTimeout(() => {
      location.reload();
    }, 1500);

  } catch (error) {
    console.error(error);
    statusMessage.textContent = 'Error: ' + error.message;
    statusMessage.style.color = 'red';
  }
});

// Color swatch and size table management
document.addEventListener('DOMContentLoaded', function() {
  const swatchInputs = document.querySelectorAll('.swatch-input[data-option-name="Color"], .swatch-input[data-option-name="Colour"]');
  const sizeTables = document.querySelectorAll('.size-table');
  const removeButtons = document.querySelectorAll('.remove-color-btn');
  
  let displayedColors = new Set();
  let isMultipleMode = false;

  // Initialize with first color selected
  const firstColorInput = document.querySelector('.swatch-input[data-option-name="Color"]:checked, .swatch-input[data-option-name="Colour"]:checked');
  if (firstColorInput) {
    const firstColor = firstColorInput.getAttribute('data-option-value');
    displayedColors.add(firstColor);
  }

  multipleToggle.addEventListener('change', function() {
    isMultipleMode = this.checked;
    
    if (!isMultipleMode) {
      const firstChecked = document.querySelector('.swatch-input[data-option-name="Color"]:checked, .swatch-input[data-option-name="Colour"]:checked');
      
      displayedColors.clear();
      
      swatchInputs.forEach(input => {
        if (input !== firstChecked) {
          input.checked = false;
        }
      });
      
      if (firstChecked) {
        const colorValue = firstChecked.getAttribute('data-option-value');
        displayedColors.add(colorValue);
      }
      
      updateSizeTables();
      calculateTotals();
    }
  });
  
  function updateSizeTables() {
    sizeTables.forEach(table => {
      const tableColor = table.getAttribute('data-color');
      if (displayedColors.has(tableColor)) {
        table.style.display = 'block';
      } else {
        table.style.display = 'none';
      }
    });
  }
  
  swatchInputs.forEach(input => {
    input.addEventListener('change', function() {
      const colorValue = this.getAttribute('data-option-value');
      
      if (this.checked) {
        if (!isMultipleMode) {
          displayedColors.clear();
          swatchInputs.forEach(otherInput => {
            if (otherInput !== this) {
              otherInput.checked = false;
            }
          });
        }
        
        displayedColors.add(colorValue);
      } else {
        displayedColors.delete(colorValue);
      }
      
      updateSizeTables();
    });
  });
  
  removeButtons.forEach(button => {
    button.addEventListener('click', function() {
      const colorValue = this.getAttribute('data-color');
      
      displayedColors.delete(colorValue);
      
      const correspondingSwatch = document.querySelector(`.swatch-input[data-option-value="${colorValue}"]`);
      if (correspondingSwatch) {
        correspondingSwatch.checked = false;
      }
      
      updateSizeTables();
      calculateTotals();
    });
  });
  
  updateSizeTables();
});