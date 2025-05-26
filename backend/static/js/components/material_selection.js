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

const MaterialSelectionModule = {
  prescriptionId: null,

  init(prescriptionId) {
    if (!prescriptionId) {
      console.error("No prescription ID provided for material selection");
      return;
    }
    console.log(
      "Initializing material selection module with prescription ID:",
      prescriptionId
    );
    this.prescriptionId = prescriptionId;
    this.initializeForm();
    this.bindEvents();
    this.loadExistingMaterialSelection();
  },

  initializeForm() {
    const form = document.getElementById("materialSelectionForm");
    if (form) {
      form.reset();
    }
  },

  bindEvents() {
    const saveBtn = document.getElementById("saveMaterialSelectionBtn");
    const nextBtn = document.getElementById("nextMaterialSelectionBtn");

    if (saveBtn) {
      saveBtn.addEventListener("click", () => this.saveMaterialSelection(true));
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", () => this.saveMaterialSelection(true));
    }
  },

  async loadExistingMaterialSelection() {
    try {
      const data = await ApiService.prescriptions.getMaterialSelection(
        this.prescriptionId
      );
      this.populateForm(data);
    } catch (error) {
      console.error("Error loading material selection:", error);
      // If it's a 404, that's okay - it means no material selection exists yet
      if (error.message && !error.message.includes("404")) {
        showToast("Failed to load material selection data", "danger");
      }
    }
  },

  populateForm(data) {
    if (!data) return;

    // Populate select fields
    const selectFields = [
      "shellMaterial",
      "shellThickness",
      "topCover",
      "secondCover",
      "thirdCover",
      "fullLengthPlantar",
      "coverLength",
    ];

    selectFields.forEach((fieldId) => {
      const element = document.getElementById(fieldId);
      if (element && data[element.name]) {
        element.value = data[element.name];
      }
    });

    // Populate checkboxes
    const checkboxFields = [
      "extensionForefoot",
      "extensionMidfootMedial",
      "extensionMidfootLateral",
    ];

    checkboxFields.forEach((fieldId) => {
      const element = document.getElementById(fieldId);
      if (element && data[element.name] !== undefined) {
        element.checked = data[element.name];
      }
    });
  },

  collectFormData() {
    const form = document.getElementById("materialSelectionForm");
    if (!form) {
      console.error("Material selection form not found");
      return null;
    }

    const formData = new FormData(form);
    const data = {
      prescription: this.prescriptionId, // Add prescription ID to the data
    };

    // Convert form data to JSON object
    for (const [key, value] of formData.entries()) {
      // Handle checkboxes
      if (key.startsWith("extension_")) {
        data[key] = form.querySelector(`[name="${key}"]`).checked;
      } else {
        data[key] = value;
      }
    }

    return data;
  },

  async saveMaterialSelection(shouldProceedToNext = false) {
    try {
      const data = this.collectFormData();
      if (!data) {
        showToast("Failed to collect form data", "danger");
        return;
      }

      await ApiService.prescriptions.saveMaterialSelection(
        this.prescriptionId,
        data
      );

      showToast("Material selection saved successfully", "success");

      // Get all existing modals and hide them
      const materialSelectionModal = bootstrap.Modal.getInstance(
        document.getElementById("materialSelectionModal")
      );
      const postingModal = bootstrap.Modal.getInstance(
        document.getElementById("postingModal")
      );

      // Function to clean up modals and show next step
      const cleanupAndProceed = () => {
        // Remove any lingering backdrops
        const backdrops = document.getElementsByClassName("modal-backdrop");
        while (backdrops.length > 0) {
          backdrops[0].parentNode.removeChild(backdrops[0]);
        }

        // Only show the next modal after cleanup
        if (shouldProceedToNext) {
          window.ShoeFittingModule.init(this.prescriptionId);
          const shoeFittingModal = new bootstrap.Modal(
            document.getElementById("shoeFittingModal")
          );
          shoeFittingModal.show();
        }
      };

      // Hide material selection modal if it exists
      if (materialSelectionModal) {
        materialSelectionModal._element.addEventListener(
          "hidden.bs.modal",
          () => {
            // Hide posting modal if it exists
            if (postingModal) {
              postingModal.hide();
              postingModal._element.addEventListener(
                "hidden.bs.modal",
                cleanupAndProceed,
                { once: true }
              );
            } else {
              cleanupAndProceed();
            }
          },
          { once: true }
        );
        materialSelectionModal.hide();
      } else {
        // If material selection modal doesn't exist, just hide posting modal
        if (postingModal) {
          postingModal.hide();
          postingModal._element.addEventListener(
            "hidden.bs.modal",
            cleanupAndProceed,
            { once: true }
          );
        } else {
          cleanupAndProceed();
        }
      }
    } catch (error) {
      console.error("Error saving material selection:", error);
      showToast("Failed to save material selection", "danger");
    }
  },
};

// Export to global scope
window.MaterialSelectionModule = MaterialSelectionModule;
