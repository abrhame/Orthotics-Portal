// Prescription Management Module
export const prescriptionManagementModule = {
  init() {
    this.initPrescriptionSearch();
    this.initSavePrescriptionHandler();
    this.initViewAndEditButtons();
  },

  initPrescriptionSearch() {
    const searchInput = document.getElementById("prescriptionSearch");
    if (searchInput) {
      searchInput.addEventListener("input", (e) =>
        this.searchPrescriptions(e.target.value.toLowerCase())
      );
    }
  },

  async searchPrescriptions(searchTerm) {
    if (!searchTerm) {
      const response = await ApiService.prescriptions.getAll();
      this.displayPrescriptions(response.results || []);
      return;
    }

    const rows = document.querySelectorAll("#prescriptionsTableBody tr");
    rows.forEach((row) => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(searchTerm) ? "" : "none";
    });
  },

  displayPrescriptions(prescriptions) {
    const prescriptionsTableBody = document.getElementById(
      "prescriptionsTableBody"
    );
    if (!prescriptionsTableBody) return;

    prescriptionsTableBody.innerHTML = "";
    if (!prescriptions || prescriptions.length === 0) {
      prescriptionsTableBody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center py-4">
            No prescriptions found. Create a new prescription to get started.
          </td>
        </tr>
      `;
      return;
    }

    prescriptions.forEach((prescription) => {
      const statusClass = this.getStatusClass(prescription.status);
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${prescription.id}</td>
        <td>${prescription.patient_name}</td>
        <td>${this.formatDate(prescription.created_at)}</td>
        <td>
          <span class="badge ${statusClass}">${prescription.status}</span>
        </td>
        <td>
          <button type="button" class="btn btn-sm btn-primary me-1 view-prescription-btn" data-id="${
            prescription.id
          }">
            <i class="bi bi-eye"></i>
          </button>
          <button type="button" class="btn btn-sm btn-secondary me-1 edit-prescription-btn" data-id="${
            prescription.id
          }">
            <i class="bi bi-pencil"></i>
          </button>
          <button type="button" class="btn btn-sm btn-success me-1 add-to-basket-btn" data-id="${
            prescription.id
          }">
            <i class="bi bi-cart-plus"></i>
          </button>
          <button type="button" class="btn btn-sm btn-info me-1 upload-scan-btn" data-id="${
            prescription.id
          }" title="Upload Foot Scans">
            <i class="bi bi-file-earmark-image"></i>
          </button>
          <button type="button" class="btn btn-sm btn-warning clinical-measures-btn" data-id="${
            prescription.id
          }" title="Clinical Measures">
            <i class="bi bi-ruler"></i>
          </button>
        </td>
      `;
      prescriptionsTableBody.appendChild(row);
    });
    this.initViewAndEditButtons();
  },

  getStatusClass(status) {
    const statusClasses = {
      Pending: "bg-warning",
      Approved: "bg-success",
      Completed: "bg-info",
      Cancelled: "bg-danger",
      default: "bg-secondary",
    };
    return statusClasses[status] || statusClasses.default;
  },

  initSavePrescriptionHandler() {
    const createPrescriptionModal = document.getElementById(
      "createPrescriptionModal"
    );
    if (createPrescriptionModal) {
      createPrescriptionModal.addEventListener("show.bs.modal", () => {
        // Optional: Load patient data into select field if needed
      });
    }
    this.initPrescriptionForm();
  },

  initPrescriptionForm() {
    const savePrescriptionBtn = document.getElementById("savePrescriptionBtn");
    if (!savePrescriptionBtn) return;

    savePrescriptionBtn.addEventListener("click", async () => {
      const form = document.getElementById("createPrescriptionForm");
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const user = JSON.parse(localStorage.getItem("user_info"));
      const clinician_id = user.id;

      const formData = {
        patient: document.getElementById("prescriptionPatient").value,
        orthotic_type: document.getElementById("orthoticType").value,
        activity_level: document.getElementById("activityLevel").value,
        arch_support: document.getElementById("archSupport").value,
        cushioning: document.getElementById("cushioning").value,
        additional_notes:
          document.getElementById("additionalNotes").value || null,
        clinician: clinician_id,
      };

      savePrescriptionBtn.disabled = true;
      savePrescriptionBtn.innerHTML =
        '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Creating...';

      try {
        const response = await ApiService.prescriptions.create(formData);
        const prescriptionId = response.id;

        this.showToast("Prescription created successfully", "success");

        const modal = bootstrap.Modal.getInstance(
          document.getElementById("createPrescriptionModal")
        );
        modal.hide();
        form.reset();

        if (prescriptionId) {
          window.openScanUploadModal(prescriptionId);
        } else {
          console.error("No prescription ID returned from creation");
          this.showToast(
            "Created prescription but couldn't get ID. Please try uploading scans later.",
            "warning"
          );
        }

        await this.loadPrescriptions();
      } catch (error) {
        console.error("Error creating prescription:", error);
        this.showToast(
          "Failed to create prescription: " +
            (error.message || "Unknown error"),
          "danger"
        );
      } finally {
        savePrescriptionBtn.disabled = false;
        savePrescriptionBtn.innerHTML = "Create Prescription";
      }
    });
  },

  initViewAndEditButtons() {
    const prescriptionTableBody = document.getElementById(
      "prescriptionsTableBody"
    );
    if (!prescriptionTableBody) return;

    prescriptionTableBody.addEventListener("click", (event) => {
      const target = event.target.closest("button");
      if (!target) return;

      const prescriptionId = target.dataset.id;
      if (!prescriptionId) return;

      if (target.classList.contains("view-prescription-btn")) {
        console.log("View prescription:", prescriptionId);
        // Implement view prescription functionality
      } else if (target.classList.contains("edit-prescription-btn")) {
        console.log("Edit prescription:", prescriptionId);
        // Implement edit prescription functionality
      } else if (target.classList.contains("add-to-basket-btn")) {
        console.log("Add to basket:", prescriptionId);
        // Implement add to basket functionality
      } else if (target.classList.contains("upload-scan-btn")) {
        window.openScanUploadModal(prescriptionId);
      } else if (target.classList.contains("clinical-measures-btn")) {
        window.openClinicalMeasuresModal(prescriptionId);
      }
    });
  },

  async loadPrescriptions() {
    try {
      const response = await ApiService.prescriptions.getAll();
      this.displayPrescriptions(response.results || []);
    } catch (error) {
      console.error("Error loading prescriptions:", error);
      this.showToast(
        "Failed to load prescriptions. Please try again later.",
        "danger"
      );
    }
  },

  async updatePrescriptionPatientSelect(newPatientId, fullName) {
    const select = document.getElementById("prescriptionPatient");
    if (!select) return;

    const existingOption = select.querySelector(
      `option[value="${newPatientId}"]`
    );
    if (!existingOption) {
      const option = document.createElement("option");
      option.value = newPatientId;
      option.textContent = fullName;
      select.appendChild(option);
    }

    select.value = newPatientId;
  },

  formatDate(dateString) {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const options = { year: "numeric", month: "short", day: "numeric" };
    return date.toLocaleDateString(undefined, options);
  },

  showToast(message, type = "success") {
    const toastContainer = document.getElementById("toast-container");
    if (!toastContainer) {
      console.error("Toast container not found");
      return;
    }

    const toast = document.createElement("div");
    toast.classList.add(
      "toast",
      "align-items-center",
      "text-white",
      `bg-${type}`,
      "border-0"
    );
    toast.setAttribute("role", "alert");
    toast.setAttribute("aria-live", "assertive");
    toast.setAttribute("aria-atomic", "true");

    toast.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    `;

    toastContainer.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();

    toast.addEventListener("hidden.bs.toast", () => toast.remove());
  },
};
