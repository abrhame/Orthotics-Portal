class DeviceOptions {
  constructor() {
    this.modal = document.getElementById("deviceOptionsModal");
    this.form = document.getElementById("deviceOptionsForm");
    this.saveBtn = document.getElementById("saveDeviceOptionsBtn");
    this.nextBtn = document.getElementById("nextDeviceOptionsBtn");
    this.prescription = null;
    this.bindEvents();
  }

  initialize(prescriptionId) {
    this.prescription = prescriptionId;
    this.loadDeviceOptions();
  }

  bindEvents() {
    if (this.saveBtn) {
      this.saveBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        await this.saveDeviceOptions(false);
      });
    }

    if (this.nextBtn) {
      this.nextBtn.addEventListener("click", async (e) => {
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
  }

  async loadDeviceOptions() {
    try {
      const data = await ApiService.prescriptions.getDeviceOptions(
        this.prescription
      );
      this.populateForm(data);
    } catch (error) {
      console.error("Error loading device options:", error);
      showToast("error", "Failed to load device options. Please try again.");
    }
  }

  populateForm(data) {
    if (!this.form) return;

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
  }

  collectFormData() {
    const formData = {
      prescription: this.prescription,
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
  }

  async saveDeviceOptions(goToNext = false) {
    if (!this.prescription) {
      showToast("error", "No prescription ID found");
      return;
    }

    try {
      const formData = this.collectFormData();
      await ApiService.prescriptions.saveDeviceOptions(
        this.prescription,
        formData
      );

      showToast("success", "Device options saved successfully");

      // Hide modal and clean up
      const modalInstance = bootstrap.Modal.getInstance(this.modal);
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

      // If goToNext is true, initialize the next module after a short delay
      if (goToNext) {
        setTimeout(() => {
          const materialSelection = new MaterialSelection();
          materialSelection.initialize(this.prescription);
          const materialModal = document.getElementById(
            "materialSelectionModal"
          );
          if (materialModal) {
            const materialModalInstance = new bootstrap.Modal(materialModal);
            materialModalInstance.show();
          }
        }, 500);
      }
    } catch (error) {
      console.error("Error saving device options:", error);
      showToast("error", "Failed to save device options. Please try again.");
    }
  }
}

// Initialize the module
document.addEventListener("DOMContentLoaded", () => {
  window.deviceOptions = new DeviceOptions();
});
