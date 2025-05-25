// Create a singleton instance for the DeviceOptionsModule
const DeviceOptionsModule = {
  prescriptionId: null,

  init(prescriptionId) {
    if (!prescriptionId) {
      console.error("No prescription ID provided for device options");
      return;
    }
    console.log(
      "Initializing device options module with prescription ID:",
      prescriptionId
    );
    this.prescriptionId = prescriptionId;
    this.initializeForm();
    this.bindEvents();
    this.loadExistingDeviceOptions();
  },

  initializeForm() {
    // Initialize tooltips
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach((tooltip) => new bootstrap.Tooltip(tooltip));

    // Initialize increment/decrement buttons
    const buttons = document.querySelectorAll(".increase-btn, .decrease-btn");
    buttons.forEach((button) => {
      button.addEventListener("click", (e) => {
        const targetId = e.target.dataset.target;
        const input = document.getElementById(targetId);
        if (input) {
          const min = parseFloat(input.min) || 0;
          const max = parseFloat(input.max) || 100;
          const currentValue = parseFloat(input.value) || 0;
          const increment = 0.01;

          if (e.target.classList.contains("increase-btn")) {
            const newValue = Math.min(currentValue + increment, max);
            input.value = newValue.toFixed(1);
          } else {
            const newValue = Math.max(currentValue - increment, min);
            input.value = newValue.toFixed(1);
          }
        }
      });
    });
  },

  bindEvents() {
    // Save button click handler
    const saveBtn = document.getElementById("saveDeviceOptionsBtn");
    if (saveBtn) {
      saveBtn.addEventListener("click", () => this.handleSave(false));
    }

    // Next button click handler
    const nextBtn = document.getElementById("nextDeviceOptionsBtn");
    if (nextBtn) {
      nextBtn.addEventListener("click", () => this.handleSave(true));
    }
  },

  async loadExistingDeviceOptions() {
    try {
      const response = await ApiService.prescriptions.getDeviceOptions(
        this.prescriptionId
      );
      if (response) {
        this.populateForm(response);
      }
    } catch (error) {
      console.error("Error loading device options:", error);
      showToast("Failed to load device options", "danger");
    }
  },

  populateForm(data) {
    const fields = [
      "left_medial_arch_height",
      "left_lateral_arch_height",
      "left_medial_heel_height",
      "left_lateral_heel_height",
      "left_heel_width",
      "left_midfoot_width",
      "left_forefoot_width",
      "right_medial_arch_height",
      "right_lateral_arch_height",
      "right_medial_heel_height",
      "right_lateral_heel_height",
      "right_heel_width",
      "right_midfoot_width",
      "right_forefoot_width",
    ];

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
  },

  collectFormData() {
    const formData = {
      prescription: this.prescriptionId,
    };

    const fields = [
      "left_medial_arch_height",
      "left_lateral_arch_height",
      "left_medial_heel_height",
      "left_lateral_heel_height",
      "left_heel_width",
      "left_midfoot_width",
      "left_forefoot_width",
      "right_medial_arch_height",
      "right_lateral_arch_height",
      "right_medial_heel_height",
      "right_lateral_heel_height",
      "right_heel_width",
      "right_midfoot_width",
      "right_forefoot_width",
    ];

    fields.forEach((field) => {
      const input = document.getElementById(
        field
          .split("_")
          .map((word, index) =>
            index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
          )
          .join("")
      );

      if (input) {
        formData[field] = parseFloat(input.value) || 0;
      }
    });

    return formData;
  },

  async handleSave(shouldProceedToNext = false) {
    if (!this.prescriptionId) {
      showToast("No prescription ID found", "danger");
      return;
    }

    try {
      const formData = this.collectFormData();
      await ApiService.prescriptions.saveDeviceOptions(
        this.prescriptionId,
        formData
      );
      showToast("Device options saved successfully", "success");

      if (shouldProceedToNext) {
        const modalElement = document.getElementById("deviceOptionsModal");
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

              // Ensure some delay before opening the next modal
              setTimeout(() => {
                const notesAttachmentsModal = document.getElementById(
                  "notesAttachmentsModal"
                );
                if (!notesAttachmentsModal) {
                  console.error("Notes & Attachments modal not found in DOM");
                  showToast(
                    "Could not proceed to Notes & Attachments",
                    "danger"
                  );
                  return;
                }

                try {
                  // First ensure any existing modal instance is disposed
                  const existingModal = bootstrap.Modal.getInstance(
                    notesAttachmentsModal
                  );
                  if (existingModal) {
                    existingModal.dispose();
                  }

                  console.log("Opening Notes & Attachments modal...");
                  const modal = new bootstrap.Modal(notesAttachmentsModal);
                  modal.show();

                  // Initialize the NotesAttachmentsModule
                  if (window.NotesAttachmentsModule) {
                    console.log(
                      "Initializing NotesAttachmentsModule with prescriptionId:",
                      prescriptionId
                    );
                    window.NotesAttachmentsModule.init(prescriptionId);
                  } else {
                    console.error(
                      "NotesAttachmentsModule not found in global scope"
                    );
                    showToast(
                      "Could not initialize Notes & Attachments",
                      "danger"
                    );
                  }
                } catch (error) {
                  console.error(
                    "Error showing Notes & Attachments modal:",
                    error
                  );
                  showToast("Error showing Notes & Attachments", "danger");
                }
              }, 500); // Increased delay for better reliability
            },
            { once: true }
          );

          modalInstance.hide();
        }
      }
    } catch (error) {
      console.error("Error saving device options:", error);
      showToast("Error saving device options", "danger");
    }
  },
};

// Explicitly expose the module to the global scope
window.DeviceOptionsModule = DeviceOptionsModule;

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Only initialize if there's a device options modal
  const deviceOptionsModal = document.getElementById("deviceOptionsModal");
  if (deviceOptionsModal) {
    console.log("Device options modal found in DOM");
  }
});
