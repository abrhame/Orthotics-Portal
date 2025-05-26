import { ApiService } from "../../api_service.js";

class OffloadingStep {
  constructor() {
    this.api = new ApiService();
    this.initializeEventListeners();
    this.loadExistingOffloading();
  }

  initializeEventListeners() {
    // Initialize increment/decrement controls
    document.querySelectorAll(".input-group button").forEach((button) => {
      button.addEventListener("click", () => {
        const action = button.dataset.action;
        const targetId = button.dataset.target;
        const input = document.getElementById(targetId);

        if (action === "increment") {
          this.incrementValue(input);
        } else if (action === "decrement") {
          this.decrementValue(input);
        }
      });
    });

    // Initialize input validation
    document.querySelectorAll('input[type="number"]').forEach((input) => {
      input.addEventListener("change", () => this.validateInput(input));
    });

    // Auto-save on input changes
    const debounceTimer = {};
    const inputs = [
      ...document.querySelectorAll('input[type="number"]'),
      ...document.querySelectorAll("textarea"),
    ];

    inputs.forEach((input) => {
      input.addEventListener("input", () => {
        clearTimeout(debounceTimer[input.id]);
        debounceTimer[input.id] = setTimeout(() => this.saveOffloading(), 1000);
      });
    });
  }

  incrementValue(input) {
    const step = parseFloat(input.step) || 1;
    const newValue = parseFloat(input.value) + step;
    if (newValue <= parseFloat(input.max)) {
      input.value = newValue;
      this.saveOffloading();
    }
  }

  decrementValue(input) {
    const step = parseFloat(input.step) || 1;
    const newValue = parseFloat(input.value) - step;
    if (newValue >= parseFloat(input.min)) {
      input.value = newValue;
      this.saveOffloading();
    }
  }

  validateInput(input) {
    let value = parseFloat(input.value);
    const min = parseFloat(input.min);
    const max = parseFloat(input.max);
    const step = parseFloat(input.step) || 1;

    if (isNaN(value)) {
      value = 0;
    }

    if (value < min) {
      value = min;
    } else if (value > max) {
      value = max;
    }

    // Round to nearest step
    value = Math.round(value / step) * step;
    input.value = value;
  }

  async loadExistingOffloading() {
    const prescriptionId = window.prescriptionWorkflow.prescriptionId;
    if (!prescriptionId) {
      this.showError("No prescription ID found. Please start over.");
      return;
    }

    try {
      const response = await this.api.get(`/api/offloading/${prescriptionId}`);

      if (response.success) {
        this.populateForm(response.offloading);
      }
    } catch (error) {
      console.error("Error loading off-loading settings:", error);
      this.showError("Failed to load existing off-loading settings.");
    }
  }

  populateForm(offloading) {
    if (!offloading) return;

    // Populate left foot off-loading
    if (offloading.left) {
      // Cuboid
      document.getElementById("leftCuboidHeight").value =
        offloading.left.cuboid_height || 0;
      document.getElementById("leftCuboidWidth").value =
        offloading.left.cuboid_width || 0;

      // Styloid
      document.getElementById("leftStyloidHeight").value =
        offloading.left.styloid_height || 0;
      document.getElementById("leftStyloidWidth").value =
        offloading.left.styloid_width || 0;

      // Navicular
      document.getElementById("leftNavicularHeight").value =
        offloading.left.navicular_height || 0;
      document.getElementById("leftNavicularWidth").value =
        offloading.left.navicular_width || 0;

      // Notes
      document.getElementById("leftNotes").value = offloading.left.notes || "";
    }

    // Populate right foot off-loading
    if (offloading.right) {
      // Cuboid
      document.getElementById("rightCuboidHeight").value =
        offloading.right.cuboid_height || 0;
      document.getElementById("rightCuboidWidth").value =
        offloading.right.cuboid_width || 0;

      // Styloid
      document.getElementById("rightStyloidHeight").value =
        offloading.right.styloid_height || 0;
      document.getElementById("rightStyloidWidth").value =
        offloading.right.styloid_width || 0;

      // Navicular
      document.getElementById("rightNavicularHeight").value =
        offloading.right.navicular_height || 0;
      document.getElementById("rightNavicularWidth").value =
        offloading.right.navicular_width || 0;

      // Notes
      document.getElementById("rightNotes").value =
        offloading.right.notes || "";
    }

    // Additional notes
    document.getElementById("offloadingNotes").value =
      offloading.offloading_notes || "";
  }

  async saveOffloading() {
    const prescriptionId = window.prescriptionWorkflow.prescriptionId;
    if (!prescriptionId) return;

    const offloading = {
      prescription_id: prescriptionId,
      left: {
        cuboid_height: parseFloat(
          document.getElementById("leftCuboidHeight").value
        ),
        cuboid_width: parseFloat(
          document.getElementById("leftCuboidWidth").value
        ),
        styloid_height: parseFloat(
          document.getElementById("leftStyloidHeight").value
        ),
        styloid_width: parseFloat(
          document.getElementById("leftStyloidWidth").value
        ),
        navicular_height: parseFloat(
          document.getElementById("leftNavicularHeight").value
        ),
        navicular_width: parseFloat(
          document.getElementById("leftNavicularWidth").value
        ),
        notes: document.getElementById("leftNotes").value,
      },
      right: {
        cuboid_height: parseFloat(
          document.getElementById("rightCuboidHeight").value
        ),
        cuboid_width: parseFloat(
          document.getElementById("rightCuboidWidth").value
        ),
        styloid_height: parseFloat(
          document.getElementById("rightStyloidHeight").value
        ),
        styloid_width: parseFloat(
          document.getElementById("rightStyloidWidth").value
        ),
        navicular_height: parseFloat(
          document.getElementById("rightNavicularHeight").value
        ),
        navicular_width: parseFloat(
          document.getElementById("rightNavicularWidth").value
        ),
        notes: document.getElementById("rightNotes").value,
      },
      offloading_notes: document.getElementById("offloadingNotes").value,
    };

    try {
      const response = await this.api.post("/api/offloading", offloading);

      if (response.success) {
        this.showSuccess("Off-loading settings saved successfully");
        window.prescriptionWorkflow.markStepAsCompleted("offloading");
      } else {
        throw new Error(
          response.message || "Failed to save off-loading settings"
        );
      }
    } catch (error) {
      console.error("Error saving off-loading settings:", error);
      this.showError("Failed to save off-loading settings. Please try again.");
    }
  }

  showSuccess(message) {
    // Implement toast or notification system
    console.log("Success:", message);
  }

  showError(message) {
    // Implement toast or notification system
    console.error("Error:", message);
  }
}

// Initialize the step when the module is loaded
export function initialize() {
  new OffloadingStep();
}
