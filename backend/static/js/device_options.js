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
    this.loadDeviceOptions();
  },

  initializeForm() {
    const form = document.getElementById("deviceOptionsForm");
    if (form) {
      form.reset();
    }
  },

  bindEvents() {
    const saveBtn = document.getElementById("saveDeviceOptionsBtn");
    const nextBtn = document.getElementById("nextDeviceOptionsBtn");

    if (saveBtn) {
      saveBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        await this.saveDeviceOptions(false);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        await this.saveDeviceOptions(true);
      });
    }

    // Bind increment/decrement buttons
    document
      .querySelectorAll(".increase-btn, .decrease-btn")
      .forEach((button) => {
        button.addEventListener("click", (e) => {
          const targetId = e.target.dataset.target;
          const input = document.getElementById(targetId);
          if (input) {
            const step = parseFloat(input.step) || 1;
            const min = parseFloat(input.min) || 0;
            const max = parseFloat(input.max) || 100;
            let value = parseFloat(input.value) || 0;

            if (e.target.classList.contains("increase-btn")) {
              value = Math.min(value + step, max);
            } else {
              value = Math.max(value - step, min);
            }

            input.value = value;
          }
        });
      });
  },

  async loadDeviceOptions() {
    try {
      const data = await ApiService.prescriptions.getDeviceOptions(
        this.prescriptionId
      );
      this.populateForm(data);
    } catch (error) {
      console.error("Error loading device options:", error);
      showToast("Failed to load device options", "danger");
    }
  },

  populateForm(data) {
    if (!data) return;

    const form = document.getElementById("deviceOptionsForm");
    if (!form) return;

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

  async saveDeviceOptions(goToNext = false) {
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

      // Hide modal and clean up
      const modalElement = document.getElementById("deviceOptionsModal");
      const modalInstance = bootstrap.Modal.getInstance(modalElement);
      if (modalInstance) {
        modalInstance.hide();

        // Clean up modal backdrop and scrollbar issues
        modalElement.addEventListener(
          "hidden.bs.modal",
          () => {
            setTimeout(() => {
              const backdrop = document.querySelector(".modal-backdrop");
              if (backdrop) backdrop.remove();
              document.body.classList.remove("modal-open");
              document.body.style.removeProperty("padding-right");

              if (goToNext) {
                setTimeout(() => {
                  const materialModal = document.getElementById(
                    "materialSelectionModal"
                  );
                  if (!materialModal) {
                    console.error("Material selection modal not found");
                    showToast(
                      "Could not proceed to material selection",
                      "danger"
                    );
                    return;
                  }

                  try {
                    const modal = new bootstrap.Modal(materialModal);
                    modal.show();

                    if (
                      window.MaterialSelectionModule &&
                      typeof window.MaterialSelectionModule.init === "function"
                    ) {
                      window.MaterialSelectionModule.init(this.prescriptionId);
                    } else {
                      console.error(
                        "MaterialSelectionModule not found or init method not available"
                      );
                      showToast(
                        "Could not initialize material selection",
                        "danger"
                      );
                    }
                  } catch (error) {
                    console.error(
                      "Error showing material selection modal:",
                      error
                    );
                    showToast(
                      "Error showing material selection options",
                      "danger"
                    );
                  }
                }, 300);
              }
            }, 300);
          },
          { once: true }
        );
      }
    } catch (error) {
      console.error("Error saving device options:", error);
      showToast("Failed to save device options", "danger");
    }
  },
};

// Export to global scope
window.DeviceOptionsModule = DeviceOptionsModule;
