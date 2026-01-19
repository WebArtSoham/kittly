// if (window.location.pathname === "/account/register") {
//   window.location.replace("https://kittly.com/pages/register");
//   console.log("URL Redirected");
// }
// Track selections
let selectedPrintingMethod = null;
const selectedDisplay = document.getElementById('selected-option');
const submitButton = document.getElementById('submit-enquiry-btn');
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
  const maxSize = 10 * 1024 * 1024;
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
    removeArtworkBtn.style.display = 'flex';
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
  removeArtworkBtn.style.display = 'none';
});

// Main Printing Method selection
document.getElementById('print-options').addEventListener('click', (e) => {
  if (e.target.tagName === 'LI') {
    document.querySelectorAll('#print-options li').forEach(li => li.classList.remove('active'));
    e.target.classList.add('active');
    
    selectedPrintingMethod = e.target.getAttribute('data-value');
    selectedDisplay.textContent = selectedPrintingMethod;
    
    // Update hidden field
    document.getElementById('hidden-front-decoration').value = selectedPrintingMethod;
  }
});

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
  
  // Update hidden fields
  document.getElementById('hidden-total-quantity').value = totalQuantity;
  document.getElementById('hidden-total-price').value = '$' + totalPrice.toFixed(2);

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

// Update decoration dropdowns to populate hidden fields
document.getElementById('decoration-back').addEventListener('change', function() {
  document.getElementById('hidden-back-decoration').value = this.value;
});

document.getElementById('decoration-right').addEventListener('change', function() {
  document.getElementById('hidden-right-sleeve').value = this.value;
});

document.getElementById('decoration-left').addEventListener('change', function() {
  document.getElementById('hidden-left-sleeve').value = this.value;
});

// Handle form submission with validation
document.getElementById('bulk-order-form').addEventListener('submit', function(e) {
  // Validate printing method
  if (!selectedPrintingMethod) {
    e.preventDefault();
    statusMessage.textContent = 'Please select a printing method for the front decoration.';
    statusMessage.style.color = 'red';
    
    // Scroll to printing method section
    document.getElementById('print-options').scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  const { totalQuantity } = calculateTotals();

  // Validate minimum quantity
  if (totalQuantity < 20) {
    e.preventDefault();
    statusMessage.textContent = 'Minimum order quantity is 20. Please add more items.';
    statusMessage.style.color = 'red';
    
    // Scroll to quantity section
    document.querySelector('.size-availability-container').scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  // Build order details
  const orderDetails = buildOrderDetails();
  document.getElementById('hidden-order-details').value = orderDetails;
  
  // Add artwork info to hidden fields
  if (uploadedArtworkFile) {
    document.getElementById('hidden-artwork-filename').value = uploadedArtworkFile.name;
    document.getElementById('hidden-artwork-filesize').value = `${(uploadedArtworkFile.size / 1024).toFixed(2)} KB`;
  }
  
  // Show submitting message
  statusMessage.textContent = 'Submitting your enquiry...';
  statusMessage.style.color = '#333';
  submitButton.disabled = true;
});

// Build detailed order information
function buildOrderDetails() {
  const quantityInputs = document.querySelectorAll('.size-quantity-input');
  let orderLines = [];
  
  quantityInputs.forEach(input => {
    const qty = parseInt(input.value) || 0;
    
    if (qty > 0) {
      const sizeItem = input.closest('.size-item');
      const color = sizeItem.getAttribute('data-color');
      const size = sizeItem.getAttribute('data-size');
      const price = parseFloat(input.getAttribute('data-variant-price')) / 100;
      const lineTotal = (qty * price).toFixed(2);
      
      orderLines.push(`${color} - ${size}: ${qty} units @ $${price.toFixed(2)} each = $${lineTotal}`);
    }
  });
  
  return orderLines.join(' | ');
}

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
  calculateTotals();
});