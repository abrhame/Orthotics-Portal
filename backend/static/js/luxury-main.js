/**
 * Luxury Main JS
 * Main JavaScript file for the Orthotics Prescription Portal
 */

// Initialize tooltips and popovers when document is ready
document.addEventListener("DOMContentLoaded", function () {
  // Initialize all tooltips
  initTooltips();

  // Initialize all popovers
  initPopovers();

  // Initialize form validation
  initFormValidation();

  // Initialize toasts
  initToasts();

  // Initialize custom file inputs
  initCustomFileInputs();

  // Setup AJAX CSRF protection
  setupCSRFProtection();
});

/**
 * Initialize Bootstrap tooltips
 */
function initTooltips() {
  const tooltipTriggerList = document.querySelectorAll(
    '[data-bs-toggle="tooltip"]'
  );
  [...tooltipTriggerList].map(
    (tooltipTriggerEl) =>
      new bootstrap.Tooltip(tooltipTriggerEl, {
        boundary: document.body,
      })
  );
}

/**
 * Initialize Bootstrap popovers
 */
function initPopovers() {
  const popoverTriggerList = document.querySelectorAll(
    '[data-bs-toggle="popover"]'
  );
  [...popoverTriggerList].map(
    (popoverTriggerEl) => new bootstrap.Popover(popoverTriggerEl)
  );
}

/**
 * Initialize form validation
 */
function initFormValidation() {
  const forms = document.querySelectorAll(".needs-validation");

  Array.from(forms).forEach((form) => {
    form.addEventListener(
      "submit",
      (event) => {
        if (!form.checkValidity()) {
          event.preventDefault();
          event.stopPropagation();
        }

        form.classList.add("was-validated");
      },
      false
    );
  });
}

/**
 * Initialize toast notifications
 */
function initToasts() {
  const toastElList = document.querySelectorAll(".toast");
  [...toastElList].map((toastEl) => new bootstrap.Toast(toastEl));
}

/**
 * Initialize custom file inputs
 */
function initCustomFileInputs() {
  const fileInputs = document.querySelectorAll(".custom-file-input");

  fileInputs.forEach((input) => {
    input.addEventListener("change", function (e) {
      const fileName = this.files[0]?.name || "No file chosen";
      const label = this.nextElementSibling;

      if (label) {
        label.textContent = fileName;
      }
    });
  });
}

/**
 * Setup CSRF protection for AJAX requests
 */
function setupCSRFProtection() {
  // Function to get CSRF token from cookies
  function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== "") {
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === name + "=") {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }

  // Add CSRF token to all AJAX requests
  const csrftoken = getCookie("csrftoken");

  function csrfSafeMethod(method) {
    // These HTTP methods do not require CSRF protection
    return /^(GET|HEAD|OPTIONS|TRACE)$/.test(method);
  }

  // Set up default headers for all AJAX requests
  $.ajaxSetup({
    beforeSend: function (xhr, settings) {
      if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
        xhr.setRequestHeader("X-CSRFToken", csrftoken);
      }
    },
  });
}

/**
 * Show a success toast message
 * @param {string} message - The message to display
 */
function showSuccessToast(message) {
  const toastContainer = document.getElementById("toastContainer");
  if (!toastContainer) {
    console.error("Toast container not found");
    return;
  }

  const toastId = "toast-" + Date.now();
  const toastHtml = `
    <div id="${toastId}" class="toast align-items-center text-white bg-success border-0" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body">
          <i class="fas fa-check-circle me-2"></i> ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>
  `;

  toastContainer.insertAdjacentHTML("beforeend", toastHtml);
  const toastElement = document.getElementById(toastId);
  const toast = new bootstrap.Toast(toastElement, { delay: 5000 });
  toast.show();

  // Remove toast from DOM after it's hidden
  toastElement.addEventListener("hidden.bs.toast", function () {
    toastElement.remove();
  });
}

/**
 * Show an error toast message
 * @param {string} message - The error message to display
 */
function showErrorToast(message) {
  const toastContainer = document.getElementById("toastContainer");
  if (!toastContainer) {
    console.error("Toast container not found");
    return;
  }

  const toastId = "toast-" + Date.now();
  const toastHtml = `
    <div id="${toastId}" class="toast align-items-center text-white bg-danger border-0" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body">
          <i class="fas fa-exclamation-circle me-2"></i> ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>
  `;

  toastContainer.insertAdjacentHTML("beforeend", toastHtml);
  const toastElement = document.getElementById(toastId);
  const toast = new bootstrap.Toast(toastElement, { delay: 5000 });
  toast.show();

  // Remove toast from DOM after it's hidden
  toastElement.addEventListener("hidden.bs.toast", function () {
    toastElement.remove();
  });
}

/**
 * Debounce function to limit the rate at which a function can fire
 * @param {Function} func - The function to debounce
 * @param {number} wait - The debounce wait time in milliseconds
 * @returns {Function} The debounced function
 */
function debounce(func, wait) {
  let timeout;

  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Format currency value
 * @param {number} value - The value to format
 * @param {string} currencyCode - The currency code (default: USD)
 * @returns {string} Formatted currency string
 */
function formatCurrency(value, currencyCode = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(value);
}

/**
 * Format date value
 * @param {string|Date} date - The date to format
 * @param {boolean} includeTime - Whether to include the time
 * @returns {string} Formatted date string
 */
function formatDate(date, includeTime = false) {
  if (!date) return "";

  const dateObj = new Date(date);
  const options = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };

  if (includeTime) {
    options.hour = "2-digit";
    options.minute = "2-digit";
  }

  return dateObj.toLocaleDateString("en-US", options);
}

/**
 * Confirm action with a modal
 * @param {Object} options - The confirmation options
 * @param {string} options.title - The modal title
 * @param {string} options.message - The confirmation message
 * @param {string} options.confirmBtnText - The confirmation button text
 * @param {string} options.confirmBtnClass - The confirmation button class
 * @param {Function} options.onConfirm - The function to call on confirmation
 */
function confirmAction(options) {
  const {
    title = "Confirm Action",
    message = "Are you sure you want to proceed?",
    confirmBtnText = "Confirm",
    confirmBtnClass = "btn-danger",
    onConfirm = () => {},
  } = options;

  const modalId = "confirmModal-" + Date.now();
  const modalHtml = `
    <div class="modal fade" id="${modalId}" tabindex="-1" aria-labelledby="${modalId}-label" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="${modalId}-label">${title}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            ${message}
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn ${confirmBtnClass} confirm-btn">${confirmBtnText}</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalHtml);
  const modalElement = document.getElementById(modalId);
  const modal = new bootstrap.Modal(modalElement);

  modalElement.querySelector(".confirm-btn").addEventListener("click", () => {
    modal.hide();
    onConfirm();
  });

  modalElement.addEventListener("hidden.bs.modal", function () {
    modalElement.remove();
  });

  modal.show();
}

/**
 * Create a search functionality for a table
 * @param {string} inputId - The search input element ID
 * @param {string} tableId - The table element ID
 */
function createTableSearch(inputId, tableId) {
  const searchInput = document.getElementById(inputId);
  const table = document.getElementById(tableId);

  if (!searchInput || !table) {
    console.error("Search input or table not found");
    return;
  }

  const debouncedSearch = debounce(function () {
    const searchTerm = searchInput.value.toLowerCase();
    const rows = table.querySelectorAll("tbody tr");

    rows.forEach((row) => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(searchTerm) ? "" : "none";
    });

    // Show a message if no results
    const noResultsMessage = table.parentNode.querySelector(
      ".no-results-message"
    );
    const hasVisibleRows = Array.from(rows).some(
      (row) => row.style.display !== "none"
    );

    if (noResultsMessage) {
      noResultsMessage.style.display = hasVisibleRows ? "none" : "block";
    } else if (!hasVisibleRows) {
      const message = document.createElement("div");
      message.className = "no-results-message text-center py-4";
      message.innerHTML =
        '<p class="text-muted">No matching results found.</p>';
      table.parentNode.appendChild(message);
    }
  }, 300);

  searchInput.addEventListener("input", debouncedSearch);
}

/**
 * Handle form submission via AJAX
 * @param {string} formId - The form element ID
 * @param {Object} options - The submission options
 * @param {Function} options.onSuccess - The function to call on success
 * @param {Function} options.onError - The function to call on error
 */
function handleFormSubmit(formId, options = {}) {
  const form = document.getElementById(formId);
  if (!form) {
    console.error("Form not found");
    return;
  }

  const {
    onSuccess = (response) => {
      showSuccessToast("Saved successfully!");
    },
    onError = (error) => {
      showErrorToast(
        "An error occurred: " + (error.message || "Please try again")
      );
    },
  } = options;

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      return;
    }

    const formData = new FormData(form);
    const url = form.getAttribute("action") || window.location.href;
    const method = form.getAttribute("method") || "POST";

    // Set submit button to loading state
    const submitBtn = form.querySelector('[type="submit"]');
    const originalBtnText = submitBtn?.innerHTML || "";

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML =
        '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
    }

    fetch(url, {
      method: method,
      body: formData,
      headers: {
        "X-Requested-With": "XMLHttpRequest",
      },
      credentials: "same-origin",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        onSuccess(data);
      })
      .catch((error) => {
        onError(error);
      })
      .finally(() => {
        // Reset submit button
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
        }
      });
  });
}

/**
 * Calculate the subtotal of invoice items
 * @param {Array} items - The array of invoice items
 * @returns {number} The calculated subtotal
 */
function calculateSubtotal(items) {
  return items.reduce((total, item) => {
    return total + parseFloat(item.price) * parseInt(item.quantity, 10);
  }, 0);
}

/**
 * Calculate tax amount
 * @param {number} subtotal - The subtotal amount
 * @param {number} taxRate - The tax rate percentage
 * @returns {number} The calculated tax amount
 */
function calculateTax(subtotal, taxRate) {
  return subtotal * (taxRate / 100);
}

/**
 * Calculate total amount
 * @param {number} subtotal - The subtotal amount
 * @param {number} taxAmount - The tax amount
 * @returns {number} The calculated total amount
 */
function calculateTotal(subtotal, taxAmount) {
  return subtotal + taxAmount;
}

/* Add to global context for easy access */
window.luxuryUtils = {
  showSuccessToast,
  showErrorToast,
  confirmAction,
  formatCurrency,
  formatDate,
  createTableSearch,
  handleFormSubmit,
  calculateSubtotal,
  calculateTax,
  calculateTotal,
};
