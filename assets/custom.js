document.addEventListener('DOMContentLoaded', function () {
    console.log("Registration form JS loaded");
    
    const form = document.querySelector('form');
    const userTypeSelect = document.getElementById('user_type');
    const companySizeSelect = document.getElementById('customer_company_size');
    const annualSpendSelect = document.getElementById('customer_annual_spend');
    const logoUrlInput = document.getElementById('customer_logo_url');
    const hiddenNoteField = document.getElementById('customer_note_combined');
    
    // Check if all elements exist
    if (!form || !userTypeSelect || !hiddenNoteField) {
        console.error("Required form elements not found");
        return;
    }
    
    // Function to update the combined note field
    function updateCombinedNote() {
        const userType = userTypeSelect.value;
        const companySize = companySizeSelect.value;
        const annualSpend = annualSpendSelect.value;
        const logoUrl = logoUrlInput.value;
        
        // Create formatted note with all information
        let noteContent = [];
        
        if (userType) noteContent.push(`User Type: ${userType}`);
        if (companySize) noteContent.push(`Company Size: ${companySize}`);
        if (annualSpend) noteContent.push(`Annual Spend: ${annualSpend}`);
        if (logoUrl) noteContent.push(`Logo URL: ${logoUrl}`);
        
        hiddenNoteField.value = noteContent.join(' | ');
        console.log("Combined note:", hiddenNoteField.value);
    }
    
    // Update note whenever any field changes
    userTypeSelect.addEventListener('change', updateCombinedNote);
    companySizeSelect.addEventListener('change', updateCombinedNote);
    annualSpendSelect.addEventListener('change', updateCombinedNote);
    logoUrlInput.addEventListener('input', updateCombinedNote);
    
    // Validate on form submission
    form.addEventListener('submit', function (e) {
        console.log("Form submit triggered");
        
        // Update the combined note one final time
        updateCombinedNote();
        
        // Validate user type
        if (!userTypeSelect.value) {
            e.preventDefault();
            alert('Please select a user type.');
            return false;
        }
        
        // Validate company size
        if (!companySizeSelect.value) {
            e.preventDefault();
            alert('Please select a company size.');
            return false;
        }
        
        // Validate annual spend
        if (!annualSpendSelect.value) {
            e.preventDefault();
            alert('Please select average annual merchandise spend.');
            return false;
        }
        
        // Log final data before submission
        console.log("Final note value:", hiddenNoteField.value);
        console.log("Form is valid, submitting...");
    });
});

  // === Printing Selection (unchanged from previous working version) ===
  let selectedPrintingMethod = null;
  const selectedDisplay = document.getElementById('selected-option');
  const addButton = document.getElementById('add-to-cart-with-print');
  const statusMessage = document.getElementById('status-message');

  document.getElementById('print-options').addEventListener('click', (e) => {
    if (e.target.tagName === 'LI') {
      document.querySelectorAll('#print-options li').forEach(li => li.classList.remove('active'));
      e.target.classList.add('active');
      selectedPrintingMethod = e.target.getAttribute('data-value');
      selectedDisplay.textContent = selectedPrintingMethod;
      updateAddButtonState();
    }
  });
// Load product JSON (reliable Liquid injection)
  const product = JSON.parse(document.getElementById('custom-product-json').textContent);

  // Find option positions (robust for Color/Colour)
  const optionsLower = product.options.map(opt => opt.toLowerCase());
  const colorIndex = optionsLower.findIndex(opt => opt.includes('color'));
  const sizeIndex = optionsLower.findIndex(opt => opt.includes('size'));

  if (colorIndex === -1 || sizeIndex === -1) {
    alert('Product must have Color and Size options.');
  }

  const colors = [...new Set(product.variants.map(v => v.options[colorIndex]))].sort();
  const sizes = [...new Set(product.variants.map(v => v.options[sizeIndex]))].sort();

  function getVariant(color, size) {
    return product.variants.find(v => 
      v.options[colorIndex] === color && 
      v.options[sizeIndex] === size &&
      v.available
    );
  }

  function getCurrentColor() {
    const variantIdInput = document.querySelector('input[name="id"]:checked, input[name="id"][type="hidden"], select[name="id"]');
    if (variantIdInput && variantIdInput.value) {
      const currentVariant = product.variants.find(v => v.id == variantIdInput.value);
      return currentVariant ? currentVariant.options[colorIndex] : colors[0];
    }
    return colors[0];
  }

  function formatMoney(cents) {
    const formatter = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' });
    return formatter.format(cents / 100);
  }

  // Elements
  const desiredInput = document.getElementById('desired-quantity');
  const multipleToggle = document.getElementById('multiple-toggle');
  const matrixContainer = document.getElementById('quantity-matrix');
  const totalQuantityEl = document.getElementById('total-quantity');
  const totalPriceEl = document.getElementById('total-price');
  const quantityErrorEl = document.getElementById('quantity-error');
  const addButton = document.getElementById('add-to-cart-with-print');
  const statusMessage = document.getElementById('status-message');

  let selectedPrintingMethod = null;
  const selectedDisplay = document.getElementById('selected-option');

  // Front printing selection
  document.getElementById('print-options').addEventListener('click', (e) => {
    if (e.target.tagName === 'LI') {
      document.querySelectorAll('#print-options li').forEach(li => li.classList.remove('active'));
      e.target.classList.add('active');
      selectedPrintingMethod = e.target.getAttribute('data-value');
      selectedDisplay.textContent = selectedPrintingMethod;
      updateAddButtonState();
    }
  });

  // Build quantity matrix
  function buildMatrix() {
    matrixContainer.innerHTML = '';
    const colorsToShow = multipleToggle.checked ? colors : [getCurrentColor()];

    colorsToShow.forEach(color => {
      const section = document.createElement('div');
      section.className = 'color-quantity-section';
      section.innerHTML = `
        <h4>${color}${multipleToggle.checked ? '' : ' (selected via swatches)'}</h4>
        <div class="color-total-wrapper">
          <label>Total for ${color}: 
            <input type="number" min="0" class="color-total-input" data-color="${color}" value="0">
          </label>
        </div>
        <table class="size-quantity-table">
          <thead><tr>${sizes.map(s => `<th>${s}</th>`).join('')}</tr></thead>
          <tbody><tr>${sizes.map(size => {
            const variant = getVariant(color, size);
            const disabled = variant ? '' : 'disabled';
            return `<td><input type="number" min="0" class="size-qty-input" data-color="${color}" data-size="${size}" value="0" ${disabled}></td>`;
          }).join('')}</tr></tbody>
          <tfoot><tr class="color-sum-row"><td colspan="${sizes.length}"><strong>Sum: <span class="color-sum">0</span></strong></td></tr></tfoot>
        </table>
        <p class="color-error" style="color:red;"></p>
      `;
      matrixContainer.appendChild(section);
    });

    updateAllTotals();
  }

  // Update totals & validation
  function updateAllTotals() {
    let grandQuantity = 0;
    let grandPrice = 0;
    let hasError = false;

    document.querySelectorAll('.color-quantity-section').forEach(section => {
      const color = section.querySelector('h4').textContent.replace(' (selected via swatches)', '');
      const desiredColorQty = parseInt(section.querySelector('.color-total-input').value) || 0;

      let colorSum = 0;
      section.querySelectorAll('.size-qty-input').forEach(input => {
        const qty = parseInt(input.value) || 0;
        colorSum += qty;

        const variant = getVariant(color, input.dataset.size);
        if (variant && qty > 0) {
          grandPrice += qty * variant.price;
        }
      });

      section.querySelector('.color-sum').textContent = colorSum;

      const colorError = section.querySelector('.color-error');
      if (desiredColorQty > 0 && colorSum !== desiredColorQty) {
        colorError.textContent = `Sizes must sum exactly to ${desiredColorQty} for ${color}.`;
        hasError = true;
      } else {
        colorError.textContent = '';
      }

      grandQuantity += colorSum;
    });

    totalQuantityEl.textContent = grandQuantity;
    totalPriceEl.textContent = formatMoney(grandPrice);

    // Global validation
    const desiredTotal = parseInt(desiredInput.value) || 0;
    let globalError = '';
    if (desiredTotal > 0 && grandQuantity !== desiredTotal) {
      globalError = `Total must equal desired quantity (${desiredTotal}). Current: ${grandQuantity}.`;
    }
    if (grandQuantity > 0 && grandQuantity < 20) {
      globalError = 'Minimum order quantity is 20 items.';
    }
    quantityErrorEl.textContent = globalError;
    if (globalError) hasError = true;

    updateAddButtonState(hasError || grandQuantity === 0);
  }

  function updateAddButtonState(hasError = false) {
    addButton.disabled = !selectedPrintingMethod || hasError || grandQuantity === 0;
  }

  // Event listeners
  desiredInput.addEventListener('input', updateAllTotals);
  multipleToggle.addEventListener('change', buildMatrix);
  matrixContainer.addEventListener('input', updateAllTotals);

  // Rebuild on theme variant change (color/size change via Ella swatches)
  document.addEventListener('change', (e) => {
    if (e.target.name === 'id' && !multipleToggle.checked) {
      buildMatrix();
    }
  });

  // Add to cart
  addButton.addEventListener('click', async () => {
    if (addButton.disabled) return;

    const properties = {
      'Decoration On Front': selectedPrintingMethod
    };
    const back = document.getElementById('decoration-back').value;
    const right = document.getElementById('decoration-right').value;
    const left = document.getElementById('decoration-left').value;
    if (back) properties['Decoration On Back'] = back;
    if (right) properties['Decoration On Right Hand Sleeve'] = right;
    if (left) properties['Decoration On Left Hand Sleeve'] = left;

    const items = [];
    document.querySelectorAll('.size-qty-input').forEach(input => {
      const qty = parseInt(input.value) || 0;
      if (qty > 0) {
        const variant = getVariant(input.dataset.color, input.dataset.size);
        if (variant) {
          items.push({
            id: variant.id,
            quantity: qty,
            properties: { ...properties }
          });
        }
      }
    });

    if (items.length === 0) {
      statusMessage.textContent = 'Please enter quantities.';
      statusMessage.style.color = 'red';
      return;
    }

    try {
      statusMessage.textContent = 'Adding to cart...';
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });

      if (!response.ok) throw new Error('Failed to add to cart');

      statusMessage.textContent = `Success! Added ${items.reduce((sum, i) => sum + i.quantity, 0)} items.`;
      statusMessage.style.color = 'green';

      if (window.Shopify && Shopify.getCart) Shopify.getCart();
    } catch (err) {
      statusMessage.textContent = 'Error: ' + err.message;
      statusMessage.style.color = 'red';
    }
  });

  // Initial build
  buildMatrix();