// Toast notification function
function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast align-items-center text-white bg-${type} border-0`;
  toast.setAttribute("role", "alert");
  toast.setAttribute("aria-live", "assertive");
  toast.setAttribute("aria-atomic", "true");

  toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;

  const container = document.getElementById("toast-container") || document.body;
  container.appendChild(toast);

  const bsToast = new bootstrap.Toast(toast);
  bsToast.show();

  // Remove the toast after it's hidden
  toast.addEventListener("hidden.bs.toast", () => {
    toast.remove();
  });
}

// Create a singleton instance for the ShoeFittingModule
const ShoeFittingModule = {
  prescriptionId: null,

  init(prescriptionId) {
    if (!prescriptionId) {
      console.error("No prescription ID provided for shoe fitting");
      return;
    }
    console.log(
      "Initializing shoe fitting module with prescription ID:",
      prescriptionId
    );
    this.prescriptionId = prescriptionId;
    this.initializeForm();
    this.bindEvents();
    this.loadExistingShoeFitting();
  },

  initializeForm() {
    const form = document.getElementById("shoeFittingForm");
    if (form) {
      form.reset();
    }

    // Initialize tooltips
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach((tooltip) => new bootstrap.Tooltip(tooltip));

    // Initialize increment/decrement buttons
    const incrementBtns = document.querySelectorAll(
      "#shoeFittingModal .increment"
    );
    const decrementBtns = document.querySelectorAll(
      "#shoeFittingModal .decrement"
    );

    incrementBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const input = btn.parentElement.querySelector('input[type="number"]');
        if (input) {
          const currentValue = parseFloat(input.value) || 0;
          const step = parseFloat(input.step) || 0.5;
          const max = parseFloat(input.max) || 15;
          const newValue = Math.min(currentValue + step, max);
          input.value = newValue.toFixed(1);
        }
      });
    });

    decrementBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const input = btn.parentElement.querySelector('input[type="number"]');
        if (input) {
          const currentValue = parseFloat(input.value) || 0;
          const step = parseFloat(input.step) || 0.5;
          const min = parseFloat(input.min) || 4;
          const newValue = Math.max(currentValue - step, min);
          input.value = newValue.toFixed(1);
        }
      });
    });
  },

  bindEvents() {
    const saveBtn = document.getElementById("saveShoeFittingBtn");
    const nextBtn = document.getElementById("nextShoeFittingBtn");

    if (saveBtn) {
      saveBtn.addEventListener("click", () => this.saveShoeFitting(false));
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", () => this.saveShoeFitting(true));
    }
  },

  async loadExistingShoeFitting() {
    try {
      const response = await ApiService.prescriptions.getShoeFitting(
        this.prescriptionId
      );
      if (response) {
        this.populateForm(response);
      }
    } catch (error) {
      console.error("Error loading shoe fitting:", error);
      showToast("Failed to load shoe fitting", "danger");
    }
  },

  populateForm(data) {
    if (!data) return;

    const fields = ["sizing_style", "orthosis_size"];

    fields.forEach((field) => {
      const input = document.getElementById(
        field
          .split("_")
          .map((word, index) =>
            index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
          )
          .join("")
      );
      if (input && data[field] !== undefined) {
        input.value = data[field];
      }
    });

    // Set checkboxes based on to_fit_shoe string
    if (data.to_fit_shoe && data.to_fit_shoe !== "none") {
      const toFitShoeValues = data.to_fit_shoe.split(",");

      const referToInsole = document.getElementById("referToInsole");
      if (referToInsole) {
        referToInsole.checked = toFitShoeValues.includes("refer-to-insole");
      }

      const shoeProvided = document.getElementById("shoeProvided");
      if (shoeProvided) {
        shoeProvided.checked = toFitShoeValues.includes("shoe-provided");
      }
    } else {
      // If no to_fit_shoe data or it's 'none', uncheck all boxes
      const checkboxes = document.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach((checkbox) => (checkbox.checked = false));
    }
  },

  collectFormData() {
    const formData = {
      prescription: this.prescriptionId,
    };

    // Get basic fields
    const sizingStyle = document.getElementById("sizingStyle");
    const orthosisSize = document.getElementById("orthosisSize");

    if (sizingStyle) {
      formData.sizing_style = sizingStyle.value;
    }

    if (orthosisSize) {
      formData.orthosis_size = parseFloat(orthosisSize.value) || 8;
    }

    // Get checkbox values
    const referToInsole =
      document.getElementById("referToInsole")?.checked || false;
    const shoeProvided =
      document.getElementById("shoeProvided")?.checked || false;

    // Construct to_fit_shoe array and join with commas
    const toFitShoeArray = [];
    if (referToInsole) toFitShoeArray.push("refer-to-insole");
    if (shoeProvided) toFitShoeArray.push("shoe-provided");

    formData.to_fit_shoe =
      toFitShoeArray.length > 0 ? toFitShoeArray.join(",") : "none";

    return formData;
  },

  async saveShoeFitting(shouldProceedToNext = false) {
    try {
      const formData = this.collectFormData();
      console.log("Saving shoe fitting data...");

      const response = await ApiService.prescriptions.saveShoeFitting(
        this.prescriptionId,
        formData
      );
      console.log("Shoe fitting saved successfully");
      showToast("Shoe fitting saved successfully", "success");

      const modalElement = document.getElementById("shoeFittingModal");
      const modalInstance = bootstrap.Modal.getInstance(modalElement);

      if (modalInstance) {
        const prescriptionId = this.prescriptionId; // Store prescriptionId in closure

        // Remove any existing event listeners
        modalElement.removeEventListener("hidden.bs.modal", () => {});

        modalElement.addEventListener(
          "hidden.bs.modal",
          () => {
            // Clean up modal backdrop and scrollbar issues
            const backdrop = document.querySelector(".modal-backdrop");
            if (backdrop) backdrop.remove();
            document.body.classList.remove("modal-open");
            document.body.style.removeProperty("padding-right");

            if (shouldProceedToNext) {
              // Ensure some delay before opening the next modal
              setTimeout(() => {
                const deviceOptionsModal =
                  document.getElementById("deviceOptionsModal");
                if (!deviceOptionsModal) {
                  console.error("Device options modal not found in DOM");
                  showToast("Could not proceed to device options", "danger");
                  return;
                }

                try {
                  // First ensure any existing modal instance is disposed
                  const existingModal =
                    bootstrap.Modal.getInstance(deviceOptionsModal);
                  if (existingModal) {
                    existingModal.dispose();
                  }

                  console.log("Opening device options modal...");
                  const modal = new bootstrap.Modal(deviceOptionsModal);
                  modal.show();

                  // Initialize the DeviceOptionsModule
                  if (window.DeviceOptionsModule) {
                    console.log(
                      "Initializing DeviceOptionsModule with prescriptionId:",
                      prescriptionId
                    );
                    window.DeviceOptionsModule.init(prescriptionId);
                  } else {
                    console.error(
                      "DeviceOptionsModule not found in global scope"
                    );
                    showToast("Could not initialize device options", "danger");
                  }
                } catch (error) {
                  console.error("Error showing device options modal:", error);
                  showToast("Error showing device options", "danger");
                }
              }, 500); // Increased delay for better reliability
            }
          },
          { once: true }
        );

        modalInstance.hide();
      }
    } catch (error) {
      console.error("Error saving shoe fitting:", error);
      showToast(
        error.message?.includes("404")
          ? "Failed to save shoe fitting: Resource not found"
          : "Failed to save shoe fitting",
        "danger"
      );
    }
  },
};

// Export to global scope
window.ShoeFittingModule = ShoeFittingModule;
