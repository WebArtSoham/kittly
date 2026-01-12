// if (window.location.pathname === "/account/register") {
//   window.location.replace("https://kittly.com/pages/register");
//   console.log("URL Redirected");
// }

// Track selections
let selectedPrintingMethod = null;
const selectedDisplay = document.getElementById('selected-option');
const addButton = document.getElementById('add-to-cart-with-print');
const statusMessage = document.getElementById('status-message');

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

// Improved variant detection – works with virtually all themes (Dawn, etc.)
function getCurrentVariantId() {
  // Most reliable: find the variant input/select from the main product form
  const variantInput = document.querySelector('select[name="id"], input[name="id"][type="hidden"], input[name="id"]');
  
  if (variantInput) {
    const val = variantInput.value;
    if (val && !isNaN(val)) {
      return parseInt(val);
    }
  }
  
  // Fallback (rarely needed now)
  if (typeof product !== 'undefined' && product.selected_or_first_available_variant) {
    return product.selected_or_first_available_variant.id;
  }
  
  return null;
}

function updateAddButtonState() {
  const variantId = getCurrentVariantId();
  addButton.disabled = !selectedPrintingMethod || !variantId;
}

// Optional: update button state when theme changes variant (e.g., size/color selector)
// This covers cases where variant changes after page load
document.addEventListener('change', (e) => {
  if (e.target.name === 'id') {
    updateAddButtonState();
  }
});

// Initial check
updateAddButtonState();

// Add to cart with all custom properties
addButton.addEventListener('click', async () => {
  if (!selectedPrintingMethod) {
    statusMessage.textContent = 'Please select a printing method.';
    statusMessage.style.color = 'red';
    return;
  }

  const variantId = getCurrentVariantId();
  if (!variantId) {
    statusMessage.textContent = 'Please select product options (e.g., size, color) first.';
    statusMessage.style.color = 'red';
    return;
  }

  // Collect decoration values (skip if empty/"Select...")
  const back = document.getElementById('decoration-back').value;
  const right = document.getElementById('decoration-right').value;
  const left = document.getElementById('decoration-left').value;

  const properties = {
    'Front/Chest Printing Method': selectedPrintingMethod  // Renamed to avoid any potential conflict
  };

  if (back && back !== '') properties['Decoration On Back'] = back;
  if (right && right !== '') properties['Decoration On Right Hand Sleeve'] = right;
  if (left && left !== '') properties['Decoration On Left Hand Sleeve'] = left;

  const item = {
    id: variantId,
    quantity: 1,
    properties: properties
  };

  try {
    statusMessage.textContent = 'Adding to cart...';
    statusMessage.style.color = '#333';

    const response = await fetch('/cart/add.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ items: [item] })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.description || 'Failed to add to cart');
    }

    statusMessage.textContent = 'Successfully added to cart with custom options!';
    statusMessage.style.color = 'green';

    // Refresh cart drawer/count (works in most themes)
    if (window.Shopify && Shopify.getCart) Shopify.getCart();

  } catch (error) {
    console.error(error);
    statusMessage.textContent = 'Error: ' + error.message;
    statusMessage.style.color = 'red';
  }
});

document.addEventListener('DOMContentLoaded', function() {
  const swatchInputs = document.querySelectorAll('.swatch-input[data-option-name="Color"], .swatch-input[data-option-name="Colour"]');
  const sizeTables = document.querySelectorAll('.size-table');
  const removeButtons = document.querySelectorAll('.remove-color-btn');
  
  // Track which colors are currently displayed
  let displayedColors = new Set();
  
  function updateSizeTables() {
    // Get all checked color swatches
    const checkedColors = document.querySelectorAll('.swatch-input[data-option-name="Color"]:checked, .swatch-input[data-option-name="Colour"]:checked');
    
    checkedColors.forEach(colorInput => {
      const colorValue = colorInput.getAttribute('data-option-value');
      displayedColors.add(colorValue);
    });
    
    // Show/hide tables based on displayedColors
    sizeTables.forEach(table => {
      const tableColor = table.getAttribute('data-color');
      if (displayedColors.has(tableColor)) {
        table.style.display = 'block';
      } else {
        table.style.display = 'none';
      }
    });
  }
  
  // Add event listeners to color swatch inputs
  swatchInputs.forEach(input => {
    input.addEventListener('change', function() {
      if (this.checked) {
        const colorValue = this.getAttribute('data-option-value');
        displayedColors.add(colorValue);
        updateSizeTables();
      }
    });
  });
  
  // Add event listeners to remove buttons
  removeButtons.forEach(button => {
    button.addEventListener('click', function() {
      const colorValue = this.getAttribute('data-color');
      
      // Remove from displayed colors
      displayedColors.delete(colorValue);
      
      // Uncheck the corresponding swatch
      const correspondingSwatch = document.querySelector(`.swatch-input[data-option-value="${colorValue}"]`);
      if (correspondingSwatch) {
        correspondingSwatch.checked = false;
      }
      
      // Update display
      updateSizeTables();
    });
  });
  
  // Show initially selected colors
  updateSizeTables();
});