/**
 * Module for handling notes and attachments functionality
 */
const NotesAttachmentsModule = {
  prescriptionId: null,
  attachments: [],

  init(prescriptionId) {
    console.log(
      "Initializing NotesAttachmentsModule with prescriptionId:",
      prescriptionId
    );
    this.prescriptionId = prescriptionId;
    this.bindEvents();
    this.loadExistingData();
  },

  bindEvents() {
    // Admin options events
    document
      .getElementById("contactClinician")
      .addEventListener("change", this.handleAdminOptionChange.bind(this));
    document
      .getElementById("confirmBeforeManufacture")
      .addEventListener("change", this.handleAdminOptionChange.bind(this));
    document
      .getElementById("clinicianCAD")
      .addEventListener("change", this.handleAdminOptionChange.bind(this));
    document
      .getElementById("turnaroundTime")
      .addEventListener("change", this.handleAdminOptionChange.bind(this));

    // Notes events
    document
      .getElementById("generalNotes")
      .addEventListener("input", this.handleNotesChange.bind(this));
    document
      .getElementById("leftFootNotes")
      .addEventListener("input", this.handleNotesChange.bind(this));
    document
      .getElementById("rightFootNotes")
      .addEventListener("input", this.handleNotesChange.bind(this));

    // Attachments events
    document
      .getElementById("addAttachmentBtn")
      .addEventListener("click", () => {
        document.getElementById("attachmentInput").click();
      });

    document
      .getElementById("attachmentInput")
      .addEventListener("change", this.handleFileSelection.bind(this));

    // Send to Lab button
    document
      .getElementById("sendToLab")
      .addEventListener("click", this.handleSendToLab.bind(this));
  },

  async loadExistingData() {
    try {
      const response = await ApiService.prescriptions.get(this.prescriptionId);
      if (response) {
        // Load admin options
        document.getElementById("contactClinician").checked =
          response.contact_clinician;
        document.getElementById("confirmBeforeManufacture").checked =
          response.confirm_before_manufacture;
        document.getElementById("clinicianCAD").checked =
          response.clinician_computer_aided_design;
        document.getElementById("turnaroundTime").value = response.turnaround;

        // Load notes
        document.getElementById("generalNotes").value =
          response.general_notes || "";
        document.getElementById("leftFootNotes").value =
          response.left_foot_notes || "";
        document.getElementById("rightFootNotes").value =
          response.right_foot_notes || "";

        // Load attachments
        this.attachments = response.attachments || [];
        this.renderAttachments();
      }
    } catch (error) {
      console.error("Error loading prescription data:", error);
      showToast("Error loading prescription data", "danger");
    }
  },

  async handleAdminOptionChange() {
    try {
      const data = {
        contact_clinician: document.getElementById("contactClinician").checked,
        confirm_before_manufacture: document.getElementById(
          "confirmBeforeManufacture"
        ).checked,
        clinician_computer_aided_design:
          document.getElementById("clinicianCAD").checked,
        turnaround: document.getElementById("turnaroundTime").value,
      };

      await ApiService.prescriptions.update(this.prescriptionId, data);
      showToast("Administration options updated", "success");
    } catch (error) {
      console.error("Error updating admin options:", error);
      showToast("Error updating administration options", "danger");
    }
  },

  async handleNotesChange() {
    try {
      const data = {
        general_notes: document.getElementById("generalNotes").value,
        left_foot_notes: document.getElementById("leftFootNotes").value,
        right_foot_notes: document.getElementById("rightFootNotes").value,
      };

      await ApiService.prescriptions.update(this.prescriptionId, data);
    } catch (error) {
      console.error("Error updating notes:", error);
      showToast("Error updating notes", "danger");
    }
  },

  async handleFileSelection(event) {
    const files = event.target.files;
    if (!files.length) return;

    try {
      const file = files[0]; // Handle one file at a time
      const formData = new FormData();
      formData.append("file", file);
      formData.append("filename", file.name);

      const response = await ApiService.prescriptions.addAttachment(
        this.prescriptionId,
        formData
      );

      if (response) {
        // Add the new attachment to the list
        this.attachments.push(response);
        this.renderAttachments();
        showToast("File uploaded successfully", "success");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      showToast(error.message || "Error uploading file", "danger");
    }

    // Clear the input for next use
    event.target.value = "";
  },

  async handleAttachmentDelete(attachmentId) {
    try {
      await ApiService.prescriptions.deleteAttachment(
        this.prescriptionId,
        attachmentId
      );
      this.attachments = this.attachments.filter((a) => a.id !== attachmentId);
      this.renderAttachments();
      showToast("File deleted successfully", "success");
    } catch (error) {
      console.error("Error deleting file:", error);
      showToast("Error deleting file", "danger");
    }
  },

  renderAttachments() {
    const container = document.getElementById("attachmentsList");
    container.innerHTML = "";

    this.attachments.forEach((attachment) => {
      const item = document.createElement("div");
      item.className = "attachment-item";
      item.innerHTML = `
                <span class="attachment-name">${attachment.filename}</span>
                <div class="attachment-actions">
                    <a href="${attachment.file}" target="_blank" class="view-link">View</a>
                    <button class="delete-btn" data-id="${attachment.id}">Delete</button>
                </div>
            `;

      item.querySelector(".delete-btn").addEventListener("click", () => {
        this.handleAttachmentDelete(attachment.id);
      });

      container.appendChild(item);
    });
  },

  async handleSendToLab() {
    try {
      // Save any pending changes first
      await this.handleNotesChange();
      await this.handleAdminOptionChange();

      // Validate required fields
      if (!this.validateRequiredFields()) {
        showToast(
          "Please fill in all required fields before sending to lab",
          "warning"
        );
        return;
      }

      // Create order with the current prescription
      const response = await ApiService.orders.create({
        prescription_id: this.prescriptionId,
      });

      if (response && response.id) {
        showToast("Prescription sent to lab successfully", "success");

        // Close the modal
        const modalElement = document.getElementById("notesAttachmentsModal");
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) {
          modalInstance.hide();
        }

        // Clean up modal backdrop and scrollbar issues
        const backdrop = document.querySelector(".modal-backdrop");
        if (backdrop) backdrop.remove();
        document.body.classList.remove("modal-open");
        document.body.style.removeProperty("padding-right");

        // Redirect to orders page after a short delay
        setTimeout(() => {
          window.location.href = "/orders/";
        }, 1000);
      }
    } catch (error) {
      console.error("Error sending prescription to lab:", error);
      showToast(error.message || "Error sending prescription to lab", "danger");
    }
  },

  validateRequiredFields() {
    // Add validation for required fields
    const requiredFields = {
      generalNotes: "General Notes",
      turnaroundTime: "Turnaround Time",
    };

    let isValid = true;
    let missingFields = [];

    for (const [fieldId, fieldName] of Object.entries(requiredFields)) {
      const element = document.getElementById(fieldId);
      if (!element || !element.value.trim()) {
        isValid = false;
        missingFields.push(fieldName);
      }
    }

    if (!isValid) {
      showToast(
        `Please fill in the following required fields: ${missingFields.join(
          ", "
        )}`,
        "warning"
      );
      return false;
    }

    return true;
  },
};

// Export to global scope
window.NotesAttachmentsModule = NotesAttachmentsModule;
