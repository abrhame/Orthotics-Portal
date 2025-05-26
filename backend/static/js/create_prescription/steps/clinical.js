import { ApiService } from "../../api_service.js";

class ClinicalMeasuresStep {
  constructor() {
    this.api = new ApiService();
    this.initializeEventListeners();
    this.loadExistingMeasures();
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
        debounceTimer[input.id] = setTimeout(() => this.saveMeasures(), 1000);
      });
    });
  }

  incrementValue(input) {
    const step = input.id.includes("Height") ? 1 : 0.5;
    const newValue = parseFloat(input.value) + step;
    if (newValue <= parseFloat(input.max)) {
      input.value = newValue;
      this.saveMeasures();
    }
  }

  decrementValue(input) {
    const step = input.id.includes("Height") ? 1 : 0.5;
    const newValue = parseFloat(input.value) - step;
    if (newValue >= parseFloat(input.min)) {
      input.value = newValue;
      this.saveMeasures();
    }
  }

  validateInput(input) {
    let value = parseFloat(input.value);
    const min = parseFloat(input.min);
    const max = parseFloat(input.max);

    if (isNaN(value)) {
      value = 0;
    }

    if (value < min) {
      value = min;
    } else if (value > max) {
      value = max;
    }

    input.value = value;
  }

  async loadExistingMeasures() {
    const prescriptionId = window.prescriptionWorkflow.prescriptionId;
    if (!prescriptionId) {
      this.showError("No prescription ID found. Please start over.");
      return;
    }

    try {
      const response = await this.api.get(
        `/api/clinical-measures/${prescriptionId}`
      );

      if (response.success) {
        this.populateForm(response.measures);
      }
    } catch (error) {
      console.error("Error loading clinical measures:", error);
      this.showError("Failed to load existing measurements.");
    }
  }

  populateForm(measures) {
    if (!measures) return;

    // Populate left foot measurements
    if (measures.left) {
      document.getElementById("leftScanVv").value = measures.left.scan_vv || 0;
      document.getElementById("leftScanDp").value = measures.left.scan_dp || 0;
      document.getElementById("leftForefootVv").value =
        measures.left.forefoot_vv || 0;
      document.getElementById("leftHeelVv").value = measures.left.heel_vv || 0;
      document.getElementById("leftHeelHeight").value =
        measures.left.heel_height || 0;
      document.getElementById("leftNotes").value = measures.left.notes || "";
    }

    // Populate right foot measurements
    if (measures.right) {
      document.getElementById("rightScanVv").value =
        measures.right.scan_vv || 0;
      document.getElementById("rightScanDp").value =
        measures.right.scan_dp || 0;
      document.getElementById("rightForefootVv").value =
        measures.right.forefoot_vv || 0;
      document.getElementById("rightHeelVv").value =
        measures.right.heel_vv || 0;
      document.getElementById("rightHeelHeight").value =
        measures.right.heel_height || 0;
      document.getElementById("rightNotes").value = measures.right.notes || "";
    }

    // Populate additional notes
    document.getElementById("clinicalNotes").value =
      measures.clinical_notes || "";
  }

  async saveMeasures() {
    const prescriptionId = window.prescriptionWorkflow.prescriptionId;
    if (!prescriptionId) return;

    const measures = {
      prescription_id: prescriptionId,
      left: {
        scan_vv: parseFloat(document.getElementById("leftScanVv").value),
        scan_dp: parseFloat(document.getElementById("leftScanDp").value),
        forefoot_vv: parseFloat(
          document.getElementById("leftForefootVv").value
        ),
        heel_vv: parseFloat(document.getElementById("leftHeelVv").value),
        heel_height: parseFloat(
          document.getElementById("leftHeelHeight").value
        ),
        notes: document.getElementById("leftNotes").value,
      },
      right: {
        scan_vv: parseFloat(document.getElementById("rightScanVv").value),
        scan_dp: parseFloat(document.getElementById("rightScanDp").value),
        forefoot_vv: parseFloat(
          document.getElementById("rightForefootVv").value
        ),
        heel_vv: parseFloat(document.getElementById("rightHeelVv").value),
        heel_height: parseFloat(
          document.getElementById("rightHeelHeight").value
        ),
        notes: document.getElementById("rightNotes").value,
      },
      clinical_notes: document.getElementById("clinicalNotes").value,
    };

    try {
      const response = await this.api.post("/api/clinical-measures", measures);

      if (response.success) {
        this.showSuccess("Measurements saved successfully");
        window.prescriptionWorkflow.markStepAsCompleted("clinical");
      } else {
        throw new Error(response.message || "Failed to save measurements");
      }
    } catch (error) {
      console.error("Error saving measurements:", error);
      this.showError("Failed to save measurements. Please try again.");
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
  new ClinicalMeasuresStep();
}
