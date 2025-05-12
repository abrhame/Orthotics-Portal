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
      input.value = "0";
      input.min = "0";
      input.step = "1";
    });
  },

  bindEvents() {
    // Bind increment/decrement buttons
    document.querySelectorAll(".increment").forEach((button) => {
      button.addEventListener("click", () => {
        const targetId = button.getAttribute("data-target");
        const input = document.getElementById(targetId);
        if (input) {
          input.value = parseInt(input.value || 0) + 1;
        }
      });
    });

    document.querySelectorAll(".decrement").forEach((button) => {
      button.addEventListener("click", () => {
        const targetId = button.getAttribute("data-target");
        const input = document.getElementById(targetId);
        if (input) {
          const currentValue = parseInt(input.value || 0);
          input.value = currentValue > 0 ? currentValue - 1 : 0;
        }
      });
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
    // Populate select fields
    document.getElementById("leftHeelPostWidth").value =
      data.left_heel_post_width || "none";
    document.getElementById("rightHeelPostWidth").value =
      data.right_heel_post_width || "none";
    document.getElementById("leftForefootPostWidth").value =
      data.left_forefoot_post_width || "none";
    document.getElementById("rightForefootPostWidth").value =
      data.right_forefoot_post_width || "none";

    // Populate numeric fields
    document.getElementById("leftHeelPostAngle").value =
      data.left_heel_post_angle || 0;
    document.getElementById("rightHeelPostAngle").value =
      data.right_heel_post_angle || 0;
    document.getElementById("leftHeelPostPitch").value =
      data.left_heel_post_pitch || 0;
    document.getElementById("rightHeelPostPitch").value =
      data.right_heel_post_pitch || 0;
    document.getElementById("leftForefootPostAngle").value =
      data.left_forefoot_post_angle || 0;
    document.getElementById("rightForefootPostAngle").value =
      data.right_forefoot_post_angle || 0;

    // Populate checkboxes
    document.getElementById("leftForefootPostMedial").checked =
      data.left_forefoot_post_medial || false;
    document.getElementById("leftForefootPostLateral").checked =
      data.left_forefoot_post_lateral || false;
    document.getElementById("rightForefootPostMedial").checked =
      data.right_forefoot_post_medial || false;
    document.getElementById("rightForefootPostLateral").checked =
      data.right_forefoot_post_lateral || false;
  },

  collectFormData() {
    return {
      prescription: this.prescriptionId,
      left_heel_post_width: document.getElementById("leftHeelPostWidth").value,
      right_heel_post_width:
        document.getElementById("rightHeelPostWidth").value,
      left_heel_post_angle:
        parseFloat(document.getElementById("leftHeelPostAngle").value) || 0,
      right_heel_post_angle:
        parseFloat(document.getElementById("rightHeelPostAngle").value) || 0,
      left_heel_post_pitch:
        parseFloat(document.getElementById("leftHeelPostPitch").value) || 0,
      right_heel_post_pitch:
        parseFloat(document.getElementById("rightHeelPostPitch").value) || 0,
      left_forefoot_post_width: document.getElementById("leftForefootPostWidth")
        .value,
      right_forefoot_post_width: document.getElementById(
        "rightForefootPostWidth"
      ).value,
      left_forefoot_post_medial: document.getElementById(
        "leftForefootPostMedial"
      ).checked,
      left_forefoot_post_lateral: document.getElementById(
        "leftForefootPostLateral"
      ).checked,
      right_forefoot_post_medial: document.getElementById(
        "rightForefootPostMedial"
      ).checked,
      right_forefoot_post_lateral: document.getElementById(
        "rightForefootPostLateral"
      ).checked,
      left_forefoot_post_angle:
        parseFloat(document.getElementById("leftForefootPostAngle").value) || 0,
      right_forefoot_post_angle:
        parseFloat(document.getElementById("rightForefootPostAngle").value) ||
        0,
    };
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
