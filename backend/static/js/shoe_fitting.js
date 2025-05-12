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
    console.log("Prescription ID:", this.prescriptionId);
    // Clean up any existing modals before initializing
    const existingModals = [
      "materialSelectionModal",
      "postingModal",
      "shoeFittingModal",
    ]
      .map((id) => bootstrap.Modal.getInstance(document.getElementById(id)))
      .filter(Boolean);
    console.log("Existing modals:", existingModals);
    const initializeAfterCleanup = () => {
      // Remove any existing backdrops
      const backdrops = document.getElementsByClassName("modal-backdrop");
      while (backdrops.length > 0) {
        backdrops[0].parentNode.removeChild(backdrops[0]);
      }

      console.log("Removing backdrops");

      // Remove any inline styles that might interfere
      document.body.style.removeProperty("padding-right");
      document.body.style.removeProperty("overflow");
      document.body.classList.remove("modal-open");
      console.log("Removing inline styles");
      this.initializeForm();
      this.bindEvents();
      this.loadExistingShoeFitting();

      // Initialize and show the shoe fitting modal
      const modalElement = document.getElementById("shoeFittingModal");
      modalElement.style.display = "block"; // Ensure modal is visible
      const shoeFittingModal = new bootstrap.Modal(modalElement, {
        backdrop: "static", // Prevent closing when clicking outside
        keyboard: false, // Prevent closing with keyboard
      });
      console.log("Showing shoe fitting modal");
      // Ensure modal is accessible
      modalElement.removeAttribute("aria-hidden");
      modalElement.setAttribute("aria-modal", "true");

      // Show the modal
      shoeFittingModal.show();
      console.log("Showing shoe fitting modal");
      // Add event listener for when modal is shown
      modalElement.addEventListener("shown.bs.modal", () => {
        // Ensure the modal is on top
        const backdrop = document.querySelector(".modal-backdrop");
        if (backdrop) {
          backdrop.style.zIndex = "1050";
        }
        modalElement.style.zIndex = "1060";
      });
    };
    console.log("Initializing after cleanup");

    if (existingModals.length > 0) {
      // Hide all existing modals
      let modalsHidden = 0;
      existingModals.forEach((modal) => {
        modal._element.addEventListener(
          "hidden.bs.modal",
          () => {
            modalsHidden++;
            if (modalsHidden === existingModals.length) {
              setTimeout(initializeAfterCleanup, 100); // Small delay to ensure cleanup
            }
          },
          { once: true }
        );
        modal.hide();
      });
      console.log("Hiding existing modals");
    } else {
      initializeAfterCleanup();
    }
  },

  initializeForm() {
    const form = document.getElementById("shoeFittingForm");
    if (form) {
      form.reset();
    }
  },

  bindEvents() {
    // Bind increment/decrement buttons for size
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

    // Bind save and next buttons
    const saveBtn = document.querySelector("#saveShoeFittingBtn");
    const nextBtn = document.querySelector("#nextShoeFittingBtn");

    if (saveBtn) {
      saveBtn.addEventListener("click", async (e) => {
        console.log("Saving shoe fitting");
        e.preventDefault();
        await this.saveShoeFitting(false);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        await this.saveShoeFitting(true);
      });
    }
  },

  async loadExistingShoeFitting() {
    try {
      const data = await ApiService.prescriptions.getShoeFitting(
        this.prescriptionId
      );
      this.populateForm(data);
    } catch (error) {
      console.error("Error loading shoe fitting:", error);
      if (!error.message?.includes("404")) {
        showToast("Failed to load shoe fitting data", "danger");
      }
    }
  },

  populateForm(data) {
    if (!data) return;

    const form = document.getElementById("shoeFittingForm");
    if (!form) return;

    // Set sizing style
    const sizingStyleSelect = form.querySelector("#sizingStyle");
    if (sizingStyleSelect && data.sizing_style) {
      sizingStyleSelect.value = data.sizing_style;
    }

    // Set orthosis size
    const sizeInput = form.querySelector("#orthosisSize");
    if (sizeInput && data.orthosis_size) {
      sizeInput.value = data.orthosis_size;
    }

    // Set checkboxes based on to_fit_shoe string
    if (data.to_fit_shoe && data.to_fit_shoe !== "none") {
      const toFitShoeValues = data.to_fit_shoe.split(",");

      const referToInsole = form.querySelector("#referToInsole");
      if (referToInsole) {
        referToInsole.checked = toFitShoeValues.includes("refer-to-insole");
      }

      const shoeProvided = form.querySelector("#shoeProvided");
      if (shoeProvided) {
        shoeProvided.checked = toFitShoeValues.includes("shoe-provided");
      }
    } else {
      // If no to_fit_shoe data or it's 'none', uncheck all boxes
      const checkboxes = form.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach((checkbox) => (checkbox.checked = false));
    }
  },

  collectFormData() {
    const form = document.getElementById("shoeFittingForm");
    if (!form) {
      console.error("Shoe fitting form not found");
      return null;
    }

    // Get checkbox values
    const referToInsole =
      form.querySelector("#referToInsole")?.checked || false;
    const shoeProvided = form.querySelector("#shoeProvided")?.checked || false;

    // Construct to_fit_shoe array and join with commas
    const toFitShoeArray = [];
    if (referToInsole) toFitShoeArray.push("refer-to-insole");
    if (shoeProvided) toFitShoeArray.push("shoe-provided");

    // Ensure we have valid values for all required fields
    const data = {
      prescription: this.prescriptionId,
      sizing_style: form.querySelector("#sizingStyle")?.value || "mens",
      orthosis_size:
        parseFloat(form.querySelector("#orthosisSize")?.value) || 8,
      to_fit_shoe:
        toFitShoeArray.length > 0 ? toFitShoeArray.join(",") : "none",
    };

    // Validate the data
    if (!data.prescription) {
      showToast("Missing prescription ID", "danger");
      return null;
    }

    if (!data.sizing_style) {
      showToast("Please select a sizing style", "danger");
      return null;
    }

    if (isNaN(data.orthosis_size)) {
      showToast("Please enter a valid orthosis size", "danger");
      return null;
    }

    return data;
  },

  async saveShoeFitting(shouldProceedToNext = false) {
    try {
      console.log("Saving shoe fitting");
      const data = this.collectFormData();
      if (!data) {
        showToast("Failed to collect form data", "danger");
        return;
      }

      const response = await ApiService.prescriptions.saveShoeFitting(
        this.prescriptionId,
        data
      );
      console.log(response);
      showToast("Shoe fitting saved successfully", "success");

      // Get the current modal instance
      const modalElement = document.getElementById("shoeFittingModal");
      const shoeFittingModal = bootstrap.Modal.getInstance(modalElement);

      if (shoeFittingModal) {
        // Hide the modal
        shoeFittingModal.hide();
        console.log("Hiding shoe fitting modal");
        // Clean up after modal is hidden
        modalElement.addEventListener(
          "hidden.bs.modal",
          () => {
            console.log("Hiding shoe fitting modal");
            // Remove any lingering backdrops
            const backdrops = document.getElementsByClassName("modal-backdrop");
            Array.from(backdrops).forEach((backdrop) => backdrop.remove());

            document.body.classList.remove("modal-open");
            document.body.style.removeProperty("padding-right");

            // Check if DeviceOptionsModule exists before trying to use it
            if (shouldProceedToNext) {
              setTimeout(() => {
                const deviceOptionsModal = new bootstrap.Modal(
                  document.getElementById("deviceOptionsModal")
                );
                if (!deviceOptionsModal) {
                  console.error("Device options modal not found");
                  showToast("Could not proceed to device options", "danger");
                  return;
                }

                try {
                  deviceOptionsModal.show();

                  if (
                    window.DeviceOptionsModule &&
                    typeof window.DeviceOptionsModule.init === "function"
                  ) {
                    window.DeviceOptionsModule.init(this.prescriptionId);
                  } else {
                    console.error(
                      "DeviceOptionsModule not found or init method not available"
                    );
                    showToast("Could not initialize device options", "danger");
                  }
                } catch (error) {
                  console.error("Error showing device options modal:", error);
                  showToast("Error showing device options", "danger");
                }
              }, 300);
            }
          },
          { once: true }
        );
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
