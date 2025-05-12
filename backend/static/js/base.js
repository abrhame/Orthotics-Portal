/**
 * Base JavaScript file for Orthotics Portal
 * Contains common functionality used across the application
 */
document.addEventListener('DOMContentLoaded', function() {
  console.log('Base JavaScript loaded');
  
  // Initialize tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
  
  // Update basket count in navbar if element exists
  updateBasketCount();

  // Initialize any flash messages
  initializeFlashMessages();
});

/**
 * Update the basket count in the navbar
 */
function updateBasketCount() {
  const basketCountElement = document.getElementById('basketCount');
  if (basketCountElement) {
    const basket = JSON.parse(localStorage.getItem('orthoticsBasket')) || [];
    basketCountElement.textContent = basket.length;
  }
}

/**
 * Initialize flash messages with auto-dismiss functionality
 */
function initializeFlashMessages() {
  // Auto-dismiss flash messages after 5 seconds
  const flashMessages = document.querySelectorAll('.alert-dismissible');
  flashMessages.forEach(function(message) {
    setTimeout(function() {
      const closeButton = message.querySelector('.btn-close');
      if (closeButton) {
        closeButton.click();
      }
    }, 5000);
  });
}

/**
 * Show a toast notification
 * @param {string} message - The message to display in the toast
 * @param {string} type - The type of toast (success, danger, warning, info)
 */
function showToast(message, type = 'info') {
  const toastContainer = document.createElement('div');
  toastContainer.classList.add('position-fixed', 'bottom-0', 'end-0', 'p-3');
  toastContainer.style.zIndex = 1050;

  const toastHTML = `
    <div class="toast align-items-center text-white bg-${type}" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body">
          ${message}
        </div>
        <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>
  `;

  toastContainer.innerHTML = toastHTML;
  document.body.appendChild(toastContainer);

  const toastElement = toastContainer.querySelector('.toast');
  const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
  toast.show();

  toastElement.addEventListener('hidden.bs.toast', function() {
    document.body.removeChild(toastContainer);
  });
}

/**
 * Format date to a human-readable string
 * @param {string} dateString - The date string to format
 * @returns {string} Formatted date string
 */
function formatDate(dateString) {
  if (!dateString) return 'N/A';

  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

// Add an item to the basket
function addToBasket(item) {
  // Get current basket items
  const basketItems = JSON.parse(localStorage.getItem("orthoticsBasket")) || [];

  // Add the new item
  basketItems.push(item);

  // Save back to local storage
  localStorage.setItem("orthoticsBasket", JSON.stringify(basketItems));

  // Update the basket count
  updateBasketCount();

  // Show success message
  showToast("Item added to basket!", "success");
}

// Format currency value
function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

// Get CSRF token from cookies
function getCSRFToken() {
  let token = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, "csrftoken=".length) === "csrftoken=") {
        token = decodeURIComponent(cookie.substring("csrftoken=".length));
        break;
      }
    }
  }
  return token;
}

// Initialize common elements and functions
document.addEventListener("DOMContentLoaded", function () {
  // Update basket count
  updateBasketCount();

  // Add event listeners for common elements
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async function (e) {
      e.preventDefault();

      try {
        // If we have the API service loaded, use it for logout
        if (typeof ApiService !== "undefined") {
          await ApiService.auth.logout();
        }

        // Always redirect to login page
        window.location.href = "/login/";
      } catch (error) {
        console.error("Error during logout:", error);
        window.location.href = "/login/";
      }
    });
  }
});
