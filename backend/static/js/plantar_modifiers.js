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

// Plantar Modifiers Module
const PlanterModifiersModule = {
  prescriptionId: null,
  init() {
    console.log("plantar modifiers initialized");
    this.initializeForm();
    this.initializeControls();
    this.bindEvents();
  },

  openPlanterModifiersModal(prescriptionId) {
    if (!prescriptionId) {
      console.error("No prescription ID provided");
      showToast("No prescription ID provided", "danger");
      return;
    }

    console.log("Opening modal for prescription:", prescriptionId);

    // Store the prescription ID in the module
    this.prescriptionId = prescriptionId;

    // Set the ID in the hidden input
    if (this.prescriptionIdInput) {
      this.prescriptionIdInput.value = prescriptionId;
    } else {
      console.error("Prescription ID input element not found");
      return;
    }

    // Load existing data
    this.loadExistingPlanterModifiers(prescriptionId);
  },

  // Initialize the form and get references to important elements
  initializeForm() {
    this.form = document.getElementById("planterModifierForm");
    this.savePlanterModifiersBtn = document.getElementById(
      "savePlanterModifiersBtn"
    );
    this.finalizePlanterModifiersBtn = document.getElementById(
      "finalizePlanterModifiersBtn"
    );
    this.prescriptionIdInput = document.getElementById(
      "planterModifiersPrescriptionId"
    );

    if (
      !this.form ||
      !this.savePlanterModifiersBtn ||
      !this.prescriptionIdInput
    ) {
      console.error("Required form elements not found");
      return;
    }

    // Add form submit handler
    this.form.addEventListener("submit", (e) => {
      e.preventDefault();
    });
  },

  // Initialize the increment/decrement controls for numeric inputs
  initializeControls() {
    const decreaseBtns = document.querySelectorAll(".decrease-btn");
    const increaseBtns = document.querySelectorAll(".increase-btn");

    // Add event listeners for decrement buttons
    decreaseBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetId = btn.getAttribute("data-target");
        const input = document.getElementById(targetId);
        if (input) {
          let value = parseInt(input.value) || 0;
          input.value = Math.max(value - 1, 0); // Prevent negative values
        }
      });
    });

    // Add event listeners for increment buttons
    increaseBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetId = btn.getAttribute("data-target");
        const input = document.getElementById(targetId);
        if (input) {
          let value = parseInt(input.value) || 0;
          input.value = Math.min(value + 1, 100); // Maximum value of 100mm
        }
      });
    });
  },

  // Bind all event listeners
  bindEvents() {
    if (this.savePlanterModifiersBtn) {
      this.savePlanterModifiersBtn.addEventListener("click", () => {
        const currentPrescriptionId =
          this.prescriptionId || this.prescriptionIdInput?.value;
        if (!currentPrescriptionId) {
          showToast("No prescription ID available", "danger");
          return;
        }
        this.savePlanterModifiers(currentPrescriptionId);
      });
    }

    if (this.finalizePlanterModifiersBtn) {
      this.finalizePlanterModifiersBtn.addEventListener("click", () => {
        const currentPrescriptionId =
          this.prescriptionId || this.prescriptionIdInput?.value;
        if (!currentPrescriptionId) {
          showToast("No prescription ID available", "danger");
          return;
        }
        this.finalizePlanterModifiers(currentPrescriptionId);
      });
    }
  },

  // Collect form data
  collectFormData() {
    const prescriptionId = this.prescriptionIdInput.value;
    if (!prescriptionId) {
      showToast("No prescription selected", "danger");
      return null;
    }

    return {
      prescription: prescriptionId,
      left_foot: {
        y_rib: parseFloat(document.getElementById("leftYRib").value) || 0,
        k_rib: parseFloat(document.getElementById("leftKRib").value) || 0,
        cuboid: parseFloat(document.getElementById("leftCuboid").value) || 0,
        styloid: parseFloat(document.getElementById("leftStyloid").value) || 0,
        navicular:
          parseFloat(document.getElementById("leftNavicular").value) || 0,
        first_ray: parseFloat(document.getElementById("left1stRay").value) || 0,
        fifth_ray: parseFloat(document.getElementById("left5thRay").value) || 0,
      },
      right_foot: {
        y_rib: parseFloat(document.getElementById("rightYRib").value) || 0,
        k_rib: parseFloat(document.getElementById("rightKRib").value) || 0,
        cuboid: parseFloat(document.getElementById("rightCuboid").value) || 0,
        styloid: parseFloat(document.getElementById("rightStyloid").value) || 0,
        navicular:
          parseFloat(document.getElementById("rightNavicular").value) || 0,
        first_ray:
          parseFloat(document.getElementById("right1stRay").value) || 0,
        fifth_ray:
          parseFloat(document.getElementById("right5thRay").value) || 0,
      },
    };
  },

  // Save planter modifiers
  async savePlanterModifiers(prescriptionId) {
    if (!prescriptionId) {
      showToast("No prescription ID available", "danger");
      console.error("No prescription ID available for saving");
      return;
    }

    const formData = this.collectFormData();
    if (!formData) return;

    // Show loading state
    this.savePlanterModifiersBtn.disabled = true;
    this.savePlanterModifiersBtn.innerHTML =
      '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';

    try {
      console.log("Saving plantar modifiers for prescription:", prescriptionId);
      const response = await ApiService.prescriptions.savePlanterModifiers(
        this.prescriptionId,
        formData
      );
      console.log("Plantar modifiers saved:", response);
      showToast("Plantar modifiers saved successfully", "success");

      // Close the current modal with proper cleanup
      const currentModal = document.getElementById("planterModifierModal");
      if (currentModal) {
        const modalInstance = bootstrap.Modal.getInstance(currentModal);
        if (modalInstance) {
          modalInstance.hide();
          // Clean up modal backdrop and scrollbar issues
          setTimeout(() => {
            const backdrop = document.querySelector(".modal-backdrop");
            if (backdrop) backdrop.remove();
            document.body.classList.remove("modal-open");
            document.body.style.removeProperty("padding-right");
          }, 300);
        }
      }

      // Wait for the current modal to be fully hidden before proceeding
      setTimeout(() => {
        this.proceedToNextStep(prescriptionId);
      }, 500);
    } catch (error) {
      console.error("Error saving plantar modifiers:", error);
      showToast(
        "Failed to save plantar modifiers: " +
          (error.response?.data?.error || error.message || "Unknown error"),
        "danger"
      );
    } finally {
      // Reset button state
      this.savePlanterModifiersBtn.disabled = false;
      this.savePlanterModifiersBtn.innerHTML = "Save Modifiers";
    }
  },

  // Finalize planter modifiers
  async finalizePlanterModifiers(prescriptionId) {
    await this.savePlanterModifiers(prescriptionId);
    setTimeout(() => {
      showToast("Prescription finalized successfully!", "success");
    }, 1000);
  },

  // Load existing planter modifiers
  async loadExistingPlanterModifiers(prescriptionId) {
    try {
      const response = await ApiService.prescriptions.getPlanterModifiers(
        prescriptionId
      );
      console.log("Loaded planter modifiers:", response);

      if (response) {
        // Populate left foot values
        if (response.left_foot) {
          document.getElementById("leftYRib").value =
            response.left_foot.y_rib || 0;
          document.getElementById("leftKRib").value =
            response.left_foot.k_rib || 0;
          document.getElementById("leftCuboid").value =
            response.left_foot.cuboid || 0;
          document.getElementById("leftStyloid").value =
            response.left_foot.styloid || 0;
          document.getElementById("leftNavicular").value =
            response.left_foot.navicular || 0;
          document.getElementById("left1stRay").value =
            response.left_foot.first_ray || 0;
          document.getElementById("left5thRay").value =
            response.left_foot.fifth_ray || 0;
        }

        // Populate right foot values
        if (response.right_foot) {
          document.getElementById("rightYRib").value =
            response.right_foot.y_rib || 0;
          document.getElementById("rightKRib").value =
            response.right_foot.k_rib || 0;
          document.getElementById("rightCuboid").value =
            response.right_foot.cuboid || 0;
          document.getElementById("rightStyloid").value =
            response.right_foot.styloid || 0;
          document.getElementById("rightNavicular").value =
            response.right_foot.navicular || 0;
          document.getElementById("right1stRay").value =
            response.right_foot.first_ray || 0;
          document.getElementById("right5thRay").value =
            response.right_foot.fifth_ray || 0;
        }
      }
    } catch (error) {
      console.error("Error loading planter modifiers:", error);
      showToast("Failed to load existing planter modifiers", "danger");
    }
  },

  // Proceed to next step
  proceedToNextStep(prescriptionId) {
    try {
      console.log("Proceeding to next step for prescription:", prescriptionId);
      // Make sure the posting modal exists before trying to show it
      const postingModalElement = document.getElementById("postingModal");
      if (!postingModalElement) {
        console.error("Posting modal element not found");
        return;
      }

      // Initialize the posting modal with error handling
      try {
        const postingModal = new bootstrap.Modal(postingModalElement, {
          backdrop: true,
          keyboard: true,
          focus: true,
        });

        // Show the modal and initialize the posting module
        postingModal.show();
        if (
          window.PostingModule &&
          typeof window.PostingModule.init === "function"
        ) {
          window.PostingModule.init(prescriptionId);
        } else {
          console.error("PostingModule not found or init method not available");
          showToast("Error: Could not initialize posting module", "danger");
        }
      } catch (modalError) {
        console.error("Error initializing posting modal:", modalError);
        showToast("Error: Could not open posting options", "danger");
      }
    } catch (error) {
      console.error("Error in proceedToNextStep:", error);
      showToast("Error proceeding to next step", "danger");
    }
  },
};

// Export the module
window.PlanterModifiersModule = PlanterModifiersModule;

// Initialize when the document is ready
document.addEventListener("DOMContentLoaded", () => {
  PlanterModifiersModule.init();
});
