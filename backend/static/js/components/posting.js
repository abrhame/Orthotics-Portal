// Posting Module
const PostingModule = {
  prescriptionId: null,

  init(prescriptionId) {
    if (!prescriptionId) {
      console.error("No prescription ID provided to PostingModule.init()");
      showToast("error", "No prescription ID available");
      return;
    }

    this.prescriptionId = prescriptionId;
    console.log(
      "Initializing posting module for prescription:",
      prescriptionId
    );

    this.initializeForm();
    this.bindEvents();
    this.loadExistingPosting();
  },

  initializeForm() {
    // Reset form
    document.getElementById("postingForm").reset();

    // Initialize numeric inputs with 0
    const numericInputs = document.querySelectorAll('input[type="number"]');
    numericInputs.forEach((input) => {
      input.value = "0.0";
      input.min = "0";
      input.step = "0.1";
    });
  },

  bindEvents() {
    // Bind increment/decrement buttons
    document.querySelectorAll(".increment, .increase-btn").forEach((button) => {
      button.addEventListener("click", () => {
        const targetId = button.getAttribute("data-target");
        const input = document.getElementById(targetId);
        if (input) {
          const currentValue = parseFloat(input.value || 0);
          const max = parseFloat(input.max) || 100;
          const newValue = Math.min(currentValue + 1.5, max);
          input.value = newValue.toFixed(1);
        }
      });
    });

    document.querySelectorAll(".decrement, .decrease-btn").forEach((button) => {
      button.addEventListener("click", () => {
        const targetId = button.getAttribute("data-target");
        const input = document.getElementById(targetId);
        if (input) {
          const currentValue = parseFloat(input.value || 0);
          const min = parseFloat(input.min) || 0;
          const newValue = Math.max(currentValue - 1.5, min);
          input.value = newValue.toFixed(1);
        }
      });
    });

    // Handle skive inclination selection
    document
      .getElementById("leftSkiveInclination")
      .addEventListener("change", (e) => {
        const specificDiv = document.getElementById("leftSpecificInclination");
        specificDiv.style.display =
          e.target.value === "specific" ? "block" : "none";
      });

    document
      .getElementById("rightSkiveInclination")
      .addEventListener("change", (e) => {
        const specificDiv = document.getElementById("rightSpecificInclination");
        specificDiv.style.display =
          e.target.value === "specific" ? "block" : "none";
      });

    // Bind save button
    document.getElementById("savePostingBtn").addEventListener("click", () => {
      this.savePosting();
    });

    // Bind next button
    document.getElementById("nextPostingBtn").addEventListener("click", () => {
      this.savePosting(true);
    });
  },

  async loadExistingPosting() {
    try {
      const response = await ApiService.prescriptions.getPosting(
        this.prescriptionId
      );
      if (response) {
        this.populateForm(response);
      }
    } catch (error) {
      console.error("Error loading posting data:", error);
      showToast("error", "Failed to load existing posting data");
    }
  },

  populateForm(data) {
    // Populate numeric fields
    const numericFields = [
      "leftHeelPostAngle",
      "rightHeelPostAngle",
      "leftHeelPostPitch",
      "rightHeelPostPitch",
      "leftHeelPostRaise",
      "rightHeelPostRaise",
      "leftHeelPostTaper",
      "rightHeelPostTaper",
      "leftForefootPostAngle",
      "rightForefootPostAngle",
      "leftSpecificInclinationValue",
      "rightSpecificInclinationValue",
    ];

    numericFields.forEach((field) => {
      const element = document.getElementById(field);
      if (element) {
        element.value = data[field.toLowerCase()] || 0;
      }
    });

    // Populate select fields
    const selectFields = [
      "leftForefootPostWidth",
      "rightForefootPostWidth",
      "leftSkiveInclination",
      "rightSkiveInclination",
    ];

    selectFields.forEach((field) => {
      const element = document.getElementById(field);
      if (element) {
        element.value = data[field.toLowerCase()] || "none";
        // Show/hide specific inclination fields based on selection
        if (field.includes("SkiveInclination")) {
          const specificDiv = document.getElementById(
            field.replace("SkiveInclination", "SpecificInclination")
          );
          if (specificDiv) {
            specificDiv.style.display =
              element.value === "specific" ? "block" : "none";
          }
        }
      }
    });

    // Populate checkboxes
    const checkboxFields = [
      "leftForefootPostMedial",
      "leftForefootPostLateral",
      "rightForefootPostMedial",
      "rightForefootPostLateral",
    ];

    checkboxFields.forEach((field) => {
      const element = document.getElementById(field);
      if (element) {
        element.checked = data[field.toLowerCase()] || false;
      }
    });
  },

  collectFormData() {
    // Helper function to safely get numeric value
    const getNumericValue = (elementId) => {
      const element = document.getElementById(elementId);
      return element ? parseFloat(element.value || 0) : 0;
    };

    // Helper function to safely get select value
    const getSelectValue = (elementId) => {
      const element = document.getElementById(elementId);
      return element ? element.value : "none";
    };

    // Helper function to safely get checkbox value
    const getCheckboxValue = (elementId) => {
      const element = document.getElementById(elementId);
      return element ? element.checked : false;
    };

    const formData = {
      prescription: this.prescriptionId,
      // Heel Post Angles
      left_heel_post_angle: getNumericValue("leftHeelPostAngle"),
      right_heel_post_angle: getNumericValue("rightHeelPostAngle"),

      // Heel Post Pitch
      left_heel_post_pitch: getNumericValue("leftHeelPostPitch"),
      right_heel_post_pitch: getNumericValue("rightHeelPostPitch"),

      // Heel Post Raise
      left_heel_post_raise: getNumericValue("leftHeelPostRaise"),
      right_heel_post_raise: getNumericValue("rightHeelPostRaise"),

      // Heel Post Taper
      left_heel_post_taper: getNumericValue("leftHeelPostTaper"),
      right_heel_post_taper: getNumericValue("rightHeelPostTaper"),

      // Forefoot Post Width
      left_forefoot_post_width: getSelectValue("leftForefootPostWidth"),
      right_forefoot_post_width: getSelectValue("rightForefootPostWidth"),

      // Forefoot Post Position
      left_forefoot_post_medial: getCheckboxValue("leftForefootPostMedial"),
      left_forefoot_post_lateral: getCheckboxValue("leftForefootPostLateral"),
      right_forefoot_post_medial: getCheckboxValue("rightForefootPostMedial"),
      right_forefoot_post_lateral: getCheckboxValue("rightForefootPostLateral"),

      // Forefoot Post Angle
      left_forefoot_post_angle: getNumericValue("leftForefootPostAngle"),
      right_forefoot_post_angle: getNumericValue("rightForefootPostAngle"),

      // Skive Inclination
      left_skive_inclination: getSelectValue("leftSkiveInclination"),
      right_skive_inclination: getSelectValue("rightSkiveInclination"),
      left_specific_inclination: getNumericValue(
        "leftSpecificInclinationValue"
      ),
      right_specific_inclination: getNumericValue(
        "rightSpecificInclinationValue"
      ),
    };

    return formData;
  },

  async savePosting(shouldProceedToNext = false) {
    if (!this.prescriptionId) {
      console.error("No prescription ID available for saving posting");
      showToast("error", "No prescription ID available");
      return;
    }

    const saveBtn = document.getElementById("savePostingBtn");
    const nextBtn = document.getElementById("nextPostingBtn");
    saveBtn.disabled = true;
    nextBtn.disabled = true;

    try {
      const formData = this.collectFormData();
      console.log("Saving posting data:", formData);

      await ApiService.prescriptions
        .savePosting(this.prescriptionId, formData)
        .then(() => {
          showToast("success", "Posting saved successfully");
          if (shouldProceedToNext) {
            const postingModal = new bootstrap.Modal(
              document.getElementById("postingModal")
            );
            postingModal.hide();
          }
          const materialSelectionModal = new bootstrap.Modal(
            document.getElementById("materialSelectionModal")
          );
          materialSelectionModal.show();
          window.MaterialSelectionModule.init(this.prescriptionId);
        });
    } catch (error) {
      console.error("Error saving posting:", error);
      showToast("error", "Failed to save posting data");
    } finally {
      saveBtn.disabled = false;
      nextBtn.disabled = false;
    }
  },
};

// Export the module to the global scope
window.PostingModule = PostingModule;
