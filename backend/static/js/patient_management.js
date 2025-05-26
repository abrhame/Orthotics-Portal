// Patient Management Module
export const patientManagementModule = {
  init() {
    this.initPatientSearch();
    this.initSavePatientHandler();
    this.initViewAndEditButtons();
  },

  initPatientSearch() {
    const searchInput = document.getElementById("patientSearch");
    if (searchInput) {
      searchInput.addEventListener("input", (e) =>
        this.searchPatients(e.target.value.toLowerCase())
      );
    }
  },

  async searchPatients(searchTerm) {
    if (!searchTerm) {
      const response = await ApiService.patients.getAll();
      this.displayPatients(response.results || []);
      return;
    }

    const rows = document.querySelectorAll("#patientsTableBody tr");
    rows.forEach((row) => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(searchTerm) ? "" : "none";
    });
  },

  displayPatients(patients) {
    const patientsTableBody = document.getElementById("patientsTableBody");
    if (!patientsTableBody) return;

    patientsTableBody.innerHTML = "";
    if (!patients || patients.length === 0) {
      patientsTableBody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center py-4">
            No patients found. Add a patient to get started.
          </td>
        </tr>
      `;
      return;
    }

    patients.forEach((patient) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${patient.external_id || patient.id}</td>
        <td>${patient.first_name} ${patient.last_name}</td>
        <td>${this.formatDate(patient.date_of_birth)}</td>
        <td>${patient.email || patient.phone || "N/A"}</td>
        <td>
          <button class="btn btn-sm btn-outline view-patient-btn" data-id="${
            patient.id
          }">
            <i class="bi bi-eye"></i> View
          </button>
          <button class="btn btn-sm btn-outline edit-patient-btn" data-id="${
            patient.id
          }">
            <i class="bi bi-pencil"></i> Edit
          </button>
          <button
            class="btn btn-sm btn-primary" 
            data-id="${patient.id}" 
            data-first-name="${patient.first_name}" 
            data-last-name="${patient.last_name}" 
            data-bs-toggle="modal"
            data-bs-target="#addPatientModal">
            <i class="bi bi-clipboard-plus"></i> Prescribe
          </button>
        </td>
      `;
      patientsTableBody.appendChild(row);
    });
    this.initViewAndEditButtons();
  },

  initSavePatientHandler() {
    const addPatientModal = document.getElementById("addPatientModal");
    if (addPatientModal) {
      addPatientModal.addEventListener("show.bs.modal", () => {
        const form = document.getElementById("addPatientForm");
        if (form) form.reset();
      });
    }
    this.initPatientForm();
  },

  initPatientForm() {
    const savePatientBtn = document.getElementById("savePatientBtn");
    if (!savePatientBtn) return;

    savePatientBtn.addEventListener("click", async () => {
      const form = document.getElementById("addPatientForm");
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const formData = {
        first_name: document.getElementById("firstName").value,
        last_name: document.getElementById("lastName").value,
        date_of_birth: document.getElementById("dateOfBirth").value,
        gender: document.getElementById("gender").value,
        external_id: document.getElementById("patientId").value,
      };

      savePatientBtn.disabled = true;
      savePatientBtn.innerHTML =
        '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';

      try {
        const response = await ApiService.patients.create(formData);
        this.showToast("Patient added successfully", "success");

        const modal = bootstrap.Modal.getInstance(
          document.getElementById("addPatientModal")
        );
        modal.hide();
        form.reset();

        const prescriptionId = response.prescription_id;
        if (prescriptionId) {
          window.openScanUploadModal(prescriptionId);
        } else {
          console.error("No prescription ID returned");
          this.showToast(
            "Patient created but couldn't get prescription ID. Please try uploading scans later.",
            "warning"
          );
        }

        await this.loadPatientsAndPrescriptions();
      } catch (error) {
        console.error("Error creating patient:", error);
        this.showToast(
          "Failed to add patient: " + (error.message || "Unknown error"),
          "danger"
        );
      } finally {
        savePatientBtn.disabled = false;
        savePatientBtn.innerHTML = "Save Patient";
      }
    });
  },

  initViewAndEditButtons() {
    const patientTableBody = document.getElementById("patientsTableBody");
    if (!patientTableBody) return;

    patientTableBody.addEventListener("click", (event) => {
      const target = event.target.closest("button");
      if (!target) return;

      const patientId = target.dataset.id;
      if (!patientId) return;

      if (target.classList.contains("create-prescription-btn")) {
        window.openScanUploadModal(patientId);
      } else if (target.classList.contains("view-patient-btn")) {
        console.log("View patient:", patientId);
        // Implement view patient functionality
      } else if (target.classList.contains("edit-patient-btn")) {
        console.log("Edit patient:", patientId);
        // Implement edit patient functionality
      }
    });
  },

  async loadPatientsAndPrescriptions() {
    try {
      const patientsResponse = await ApiService.patients.getAll();
      this.displayPatients(patientsResponse.results || []);
    } catch (error) {
      console.error("Error loading data:", error);
      this.showToast("Failed to load data. Please try again later.", "danger");
    }
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
