class PrescriptionWorkflow {
  constructor(config) {
    this.currentStep = config.currentStep;
    this.steps = config.steps;
    this.prescriptionId = config.prescriptionId;
    this.completedSteps = new Set();

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.updateUI();
  }

  setupEventListeners() {
    // Listen for form submissions
    const forms = document.querySelectorAll("form");
    forms.forEach((form) => {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleFormSubmit(form);
      });
    });

    // Listen for next/previous buttons
    const navButtons = document.querySelectorAll(".step-nav-btn");
    navButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const direction = btn.dataset.direction;
        this.navigate(direction);
      });
    });
  }

  async handleFormSubmit(form) {
    try {
      const formData = new FormData(form);
      const response = await fetch(form.action, {
        method: "POST",
        body: formData,
        headers: {
          "X-CSRFToken": this.getCsrfToken(),
        },
      });

      if (response.ok) {
        const data = await response.json();
        this.markStepAsCompleted(this.currentStep);
        this.showSuccess("Step saved successfully");

        if (data.nextStep) {
          this.navigate("next");
        }
      } else {
        this.showError("Error saving step data");
      }
    } catch (error) {
      console.error("Error:", error);
      this.showError("An unexpected error occurred");
    }
  }

  navigate(direction) {
    const currentIndex = this.steps.findIndex(
      (step) => step.id === this.currentStep
    );
    let nextIndex;

    if (direction === "next") {
      nextIndex = currentIndex + 1;
    } else if (direction === "prev") {
      nextIndex = currentIndex - 1;
    }

    if (nextIndex >= 0 && nextIndex < this.steps.length) {
      const nextStep = this.steps[nextIndex];
      if (this.canNavigateToStep(nextStep)) {
        window.location.href = `/prescriptions/${this.prescriptionId}/${nextStep.id}/`;
      } else {
        this.showError("Please complete the current step first");
      }
    }
  }

  canNavigateToStep(step) {
    // Allow navigation to previous steps or if current step is completed
    const currentIndex = this.steps.findIndex((s) => s.id === this.currentStep);
    const targetIndex = this.steps.findIndex((s) => s.id === step.id);

    return (
      targetIndex <= currentIndex || this.completedSteps.has(this.currentStep)
    );
  }

  markStepAsCompleted(stepId) {
    this.completedSteps.add(stepId);
    this.updateUI();
  }

  updateUI() {
    // Update step indicators
    this.steps.forEach((step) => {
      const element = document.querySelector(`[data-step="${step.id}"]`);
      if (element) {
        if (step.id === this.currentStep) {
          element.classList.add("active");
        } else {
          element.classList.remove("active");
        }

        if (this.completedSteps.has(step.id)) {
          element.classList.add("completed");
        }
      }
    });

    // Update navigation buttons
    const currentIndex = this.steps.findIndex(
      (step) => step.id === this.currentStep
    );
    const prevBtn = document.querySelector(
      '.step-nav-btn[data-direction="prev"]'
    );
    const nextBtn = document.querySelector(
      '.step-nav-btn[data-direction="next"]'
    );

    if (prevBtn) {
      prevBtn.disabled = currentIndex === 0;
    }
    if (nextBtn) {
      nextBtn.disabled = currentIndex === this.steps.length - 1;
    }
  }

  showSuccess(message) {
    // Implement your toast/notification system here
    console.log("Success:", message);
  }

  showError(message) {
    // Implement your toast/notification system here
    console.error("Error:", message);
  }

  getCsrfToken() {
    return document.querySelector("[name=csrfmiddlewaretoken]")?.value;
  }
}

// Make PrescriptionWorkflow available globally
window.PrescriptionWorkflow = PrescriptionWorkflow;
