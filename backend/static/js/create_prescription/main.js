import { ApiService } from "../api_service.js";

class PrescriptionWorkflow {
  constructor() {
    this.currentStep = "patient";
    this.prescriptionId = null;
    this.steps = [
      "patient",
      "scans",
      "clinical",
      "intrinsic",
      "offloading",
      "plantar",
      "material",
      "shoe",
      "device",
      "notes",
    ];
    this.stepTitles = {
      patient: "Patient Selection",
      scans: "Scan Upload",
      clinical: "Clinical Measures",
      intrinsic: "Intrinsic Adjustments",
      offloading: "Off-loading",
      plantar: "Plantar Modifiers",
      material: "Material Selection",
      shoe: "Shoe Fitting",
      device: "Device Options",
      notes: "Notes & Attachments",
    };
    this.completedSteps = new Set();
    this.api = new ApiService();
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    // Navigation buttons
    document
      .getElementById("prevStep")
      .addEventListener("click", () => this.navigateToPrevStep());
    document
      .getElementById("nextStep")
      .addEventListener("click", () => this.navigateToNextStep());
    document
      .getElementById("submitPrescription")
      .addEventListener("click", () => this.submitPrescription());

    // Sidebar navigation
    document.querySelectorAll(".nav-item").forEach((item) => {
      item.addEventListener("click", () => {
        const step = item.dataset.step;
        if (this.canNavigateToStep(step)) {
          this.navigateToStep(step);
        }
      });
    });
  }

  async loadStepContent(step) {
    try {
      const response = await fetch(`/orthotics_portal/steps/${step}.html`);
      if (!response.ok) throw new Error(`Failed to load ${step} content`);
      const content = await response.text();
      document.getElementById("step-content").innerHTML = content;
      this.initializeStepSpecificBehavior(step);
    } catch (error) {
      console.error("Error loading step content:", error);
      this.showError("Failed to load step content. Please try again.");
    }
  }

  initializeStepSpecificBehavior(step) {
    // Initialize step-specific JavaScript functionality
    const scriptPath = `/static/js/create_prescription/steps/${step}.js`;
    import(scriptPath)
      .then((module) => {
        if (module.initialize) {
          module.initialize(this.prescriptionId);
        }
      })
      .catch((error) => console.error(`Error loading ${step} module:`, error));
  }

  updateUI() {
    // Update timeline
    document.querySelectorAll(".timeline-step").forEach((step) => {
      const stepName = step.dataset.step;
      step.classList.remove("active", "completed");
      if (stepName === this.currentStep) {
        step.classList.add("active");
      } else if (this.completedSteps.has(stepName)) {
        step.classList.add("completed");
      }
    });

    // Update sidebar
    document.querySelectorAll(".nav-item").forEach((item) => {
      const stepName = item.dataset.step;
      item.classList.remove("active", "completed");
      if (stepName === this.currentStep) {
        item.classList.add("active");
      } else if (this.completedSteps.has(stepName)) {
        item.classList.add("completed");
      }
    });

    // Update step title
    document.getElementById("step-title").textContent =
      this.stepTitles[this.currentStep];

    // Update navigation buttons
    const currentIndex = this.steps.indexOf(this.currentStep);
    document.getElementById("prevStep").disabled = currentIndex === 0;
    const nextButton = document.getElementById("nextStep");
    const submitButton = document.getElementById("submitPrescription");

    if (currentIndex === this.steps.length - 1) {
      nextButton.style.display = "none";
      submitButton.style.display = "block";
    } else {
      nextButton.style.display = "block";
      submitButton.style.display = "none";
    }
  }

  canNavigateToStep(step) {
    const targetIndex = this.steps.indexOf(step);
    const currentIndex = this.steps.indexOf(this.currentStep);

    // Can always navigate to completed steps or the next available step
    return this.completedSteps.has(step) || targetIndex === currentIndex + 1;
  }

  async navigateToStep(step) {
    if (!this.steps.includes(step)) return;

    this.currentStep = step;
    await this.loadStepContent(step);
    this.updateUI();
  }

  async navigateToNextStep() {
    const currentIndex = this.steps.indexOf(this.currentStep);
    if (currentIndex < this.steps.length - 1) {
      await this.navigateToStep(this.steps[currentIndex + 1]);
    }
  }

  async navigateToPrevStep() {
    const currentIndex = this.steps.indexOf(this.currentStep);
    if (currentIndex > 0) {
      await this.navigateToStep(this.steps[currentIndex - 1]);
    }
  }

  markStepAsCompleted(step) {
    this.completedSteps.add(step);
    this.updateUI();
  }

  async submitPrescription() {
    try {
      if (!this.prescriptionId) {
        throw new Error("No prescription ID found");
      }

      const response = await this.api.post("/api/prescriptions/submit", {
        prescription_id: this.prescriptionId,
      });

      if (response.success) {
        this.showSuccess("Prescription submitted successfully!");
        // Redirect to prescriptions list after short delay
        setTimeout(() => {
          window.location.href = "/orthotics_portal/prescriptions";
        }, 2000);
      } else {
        throw new Error(response.message || "Failed to submit prescription");
      }
    } catch (error) {
      console.error("Error submitting prescription:", error);
      this.showError("Failed to submit prescription. Please try again.");
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

// Initialize the workflow when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.prescriptionWorkflow = new PrescriptionWorkflow();
});
