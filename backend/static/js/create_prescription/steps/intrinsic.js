import { ApiService } from "../../api_service.js";

class IntrinsicAdjustmentsStep {
  constructor() {
    this.api = new ApiService();
    this.initializeEventListeners();
    this.loadExistingAdjustments();
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

    // Initialize skive type controls
    ["left", "right"].forEach((side) => {
      const select = document.getElementById(`${side}SkiveType`);
      select.addEventListener("change", () => {
        const settings = document.getElementById(`${side}SkiveSettings`);
        settings.style.display = select.value === "none" ? "none" : "block";
        this.saveAdjustments();
      });
    });

    // Auto-save on input changes
    const debounceTimer = {};
    const inputs = [
      ...document.querySelectorAll('input[type="number"]'),
      ...document.querySelectorAll("select"),
      ...document.querySelectorAll("textarea"),
    ];

    inputs.forEach((input) => {
      input.addEventListener("input", () => {
        clearTimeout(debounceTimer[input.id]);
        debounceTimer[input.id] = setTimeout(
          () => this.saveAdjustments(),
          1000
        );
      });
    });
  }

  incrementValue(input) {
    const step = parseFloat(input.step) || 1;
    const newValue = parseFloat(input.value) + step;
    if (newValue <= parseFloat(input.max)) {
      input.value = newValue;
      this.saveAdjustments();
    }
  }

  decrementValue(input) {
    const step = parseFloat(input.step) || 1;
    const newValue = parseFloat(input.value) - step;
    if (newValue >= parseFloat(input.min)) {
      input.value = newValue;
      this.saveAdjustments();
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

  async loadExistingAdjustments() {
    const prescriptionId = window.prescriptionWorkflow.prescriptionId;
    if (!prescriptionId) {
      this.showError("No prescription ID found. Please start over.");
      return;
    }

    try {
      const response = await this.api.get(
        `/api/intrinsic-adjustments/${prescriptionId}`
      );

      if (response.success) {
        this.populateForm(response.adjustments);
      }
    } catch (error) {
      console.error("Error loading intrinsic adjustments:", error);
      this.showError("Failed to load existing adjustments.");
    }
  }

  populateForm(adjustments) {
    if (!adjustments) return;

    // Populate left foot adjustments
    if (adjustments.left) {
      // Arch adjustments
      document.getElementById("leftArchHeight").value =
        adjustments.left.arch_height || 0;
      document.getElementById("leftArchLength").value =
        adjustments.left.arch_length || 0;
      document.getElementById("leftArchWidth").value =
        adjustments.left.arch_width || 0;

      // Heel expansion
      document.getElementById("leftHeelMedial").value =
        adjustments.left.heel_medial || 0;
      document.getElementById("leftHeelLateral").value =
        adjustments.left.heel_lateral || 0;

      // Skive settings
      document.getElementById("leftSkiveType").value =
        adjustments.left.skive_type || "none";
      document.getElementById("leftSkiveInclination").value =
        adjustments.left.skive_inclination || 0;
      document.getElementById("leftSkiveSettings").style.display =
        adjustments.left.skive_type === "none" ? "none" : "block";

      // Notes
      document.getElementById("leftNotes").value = adjustments.left.notes || "";
    }

    // Populate right foot adjustments
    if (adjustments.right) {
      // Arch adjustments
      document.getElementById("rightArchHeight").value =
        adjustments.right.arch_height || 0;
      document.getElementById("rightArchLength").value =
        adjustments.right.arch_length || 0;
      document.getElementById("rightArchWidth").value =
        adjustments.right.arch_width || 0;

      // Heel expansion
      document.getElementById("rightHeelMedial").value =
        adjustments.right.heel_medial || 0;
      document.getElementById("rightHeelLateral").value =
        adjustments.right.heel_lateral || 0;

      // Skive settings
      document.getElementById("rightSkiveType").value =
        adjustments.right.skive_type || "none";
      document.getElementById("rightSkiveInclination").value =
        adjustments.right.skive_inclination || 0;
      document.getElementById("rightSkiveSettings").style.display =
        adjustments.right.skive_type === "none" ? "none" : "block";

      // Notes
      document.getElementById("rightNotes").value =
        adjustments.right.notes || "";
    }

    // Additional notes
    document.getElementById("adjustmentNotes").value =
      adjustments.adjustment_notes || "";
  }

  async saveAdjustments() {
    const prescriptionId = window.prescriptionWorkflow.prescriptionId;
    if (!prescriptionId) return;

    const adjustments = {
      prescription_id: prescriptionId,
      left: {
        arch_height: parseFloat(
          document.getElementById("leftArchHeight").value
        ),
        arch_length: parseFloat(
          document.getElementById("leftArchLength").value
        ),
        arch_width: parseFloat(document.getElementById("leftArchWidth").value),
        heel_medial: parseFloat(
          document.getElementById("leftHeelMedial").value
        ),
        heel_lateral: parseFloat(
          document.getElementById("leftHeelLateral").value
        ),
        skive_type: document.getElementById("leftSkiveType").value,
        skive_inclination: parseFloat(
          document.getElementById("leftSkiveInclination").value
        ),
        notes: document.getElementById("leftNotes").value,
      },
      right: {
        arch_height: parseFloat(
          document.getElementById("rightArchHeight").value
        ),
        arch_length: parseFloat(
          document.getElementById("rightArchLength").value
        ),
        arch_width: parseFloat(document.getElementById("rightArchWidth").value),
        heel_medial: parseFloat(
          document.getElementById("rightHeelMedial").value
        ),
        heel_lateral: parseFloat(
          document.getElementById("rightHeelLateral").value
        ),
        skive_type: document.getElementById("rightSkiveType").value,
        skive_inclination: parseFloat(
          document.getElementById("rightSkiveInclination").value
        ),
        notes: document.getElementById("rightNotes").value,
      },
      adjustment_notes: document.getElementById("adjustmentNotes").value,
    };

    try {
      const response = await this.api.post(
        "/api/intrinsic-adjustments",
        adjustments
      );

      if (response.success) {
        this.showSuccess("Adjustments saved successfully");
        window.prescriptionWorkflow.markStepAsCompleted("intrinsic");
      } else {
        throw new Error(response.message || "Failed to save adjustments");
      }
    } catch (error) {
      console.error("Error saving adjustments:", error);
      this.showError("Failed to save adjustments. Please try again.");
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
  new IntrinsicAdjustmentsStep();
}
