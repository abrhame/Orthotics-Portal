import { ApiService } from "../../api_service.js";

class PatientSelectionStep {
  constructor() {
    this.api = new ApiService();
    this.selectedPatientId = null;
    this.patientModal = new bootstrap.Modal(
      document.getElementById("patientModal")
    );
    this.confirmationModal = new bootstrap.Modal(
      document.getElementById("confirmationModal")
    );
    this.initializeEventListeners();
    this.searchPatients();
  }

  initializeEventListeners() {
    // Search functionality
    const searchInput = document.getElementById("patientSearch");
    const searchButton = document.getElementById("searchButton");

    searchInput.addEventListener("keyup", (e) => {
      if (e.key === "Enter") {
        this.searchPatients();
      }
    });

    searchButton.addEventListener("click", () => this.searchPatients());

    // Add new patient button
    document.getElementById("addNewPatient").addEventListener("click", () => {
      document.getElementById("patientForm").reset();
      document.getElementById("patientModalLabel").textContent =
        "Add New Patient";
      this.selectedPatientId = null;
      this.patientModal.show();
    });

    // Save patient form
    document
      .getElementById("savePatient")
      .addEventListener("click", () => this.savePatient());

    // Confirm patient selection
    document
      .getElementById("confirmPatientSelection")
      .addEventListener("click", () => this.confirmSelection());
  }

  async searchPatients() {
    const searchTerm = document.getElementById("patientSearch").value.trim();
    const loadingDiv = document.getElementById("loading");
    const noResultsDiv = document.getElementById("noResults");
    const tableBody = document.getElementById("patientsTableBody");

    try {
      loadingDiv.style.display = "block";
      noResultsDiv.style.display = "none";
      tableBody.innerHTML = "";

      const response = await this.api.get("/api/patients/search", {
        q: searchTerm,
      });

      loadingDiv.style.display = "none";

      if (!response.patients || response.patients.length === 0) {
        noResultsDiv.style.display = "block";
        return;
      }

      this.renderPatients(response.patients);
    } catch (error) {
      console.error("Error searching patients:", error);
      loadingDiv.style.display = "none";
      this.showError("Failed to search patients. Please try again.");
    }
  }

  renderPatients(patients) {
    const tableBody = document.getElementById("patientsTableBody");
    tableBody.innerHTML = "";

    patients.forEach((patient) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${patient.id}</td>
        <td>${patient.first_name} ${patient.last_name}</td>
        <td>${this.formatDate(patient.date_of_birth)}</td>
        <td>${patient.phone}</td>
        <td>${patient.email || "-"}</td>
        <td>${
          patient.last_visit ? this.formatDate(patient.last_visit) : "Never"
        }</td>
        <td>
          <button class="btn btn-sm btn-primary select-patient" data-patient-id="${
            patient.id
          }">
            Select
          </button>
          <button class="btn btn-sm btn-outline-secondary edit-patient" data-patient-id="${
            patient.id
          }">
            <i class="bi bi-pencil"></i>
          </button>
        </td>
      `;

      // Add event listeners for the buttons
      const selectBtn = row.querySelector(".select-patient");
      const editBtn = row.querySelector(".edit-patient");

      selectBtn.addEventListener("click", () => this.selectPatient(patient.id));
      editBtn.addEventListener("click", () => this.editPatient(patient));

      tableBody.appendChild(row);
    });
  }

  async selectPatient(patientId) {
    this.selectedPatientId = patientId;
    this.confirmationModal.show();
  }

  async editPatient(patient) {
    // Populate the form with patient data
    const form = document.getElementById("patientForm");
    form.elements.first_name.value = patient.first_name;
    form.elements.last_name.value = patient.last_name;
    form.elements.date_of_birth.value = patient.date_of_birth;
    form.elements.gender.value = patient.gender || "";
    form.elements.phone.value = patient.phone;
    form.elements.email.value = patient.email || "";
    form.elements.address.value = patient.address || "";
    form.elements.medical_history.value = patient.medical_history || "";

    document.getElementById("patientModalLabel").textContent = "Edit Patient";
    this.selectedPatientId = patient.id;
    this.patientModal.show();
  }

  async savePatient() {
    const form = document.getElementById("patientForm");
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const formData = new FormData(form);
    const patientData = Object.fromEntries(formData.entries());

    try {
      const endpoint = this.selectedPatientId
        ? `/api/patients/${this.selectedPatientId}`
        : "/api/patients/create";

      const response = await this.api.post(endpoint, patientData);

      if (response.success) {
        this.showSuccess("Patient saved successfully!");
        this.patientModal.hide();

        // If this was a new patient creation, we should have a prescription_id
        if (response.prescription_id) {
          window.prescriptionWorkflow.prescriptionId = response.prescription_id;
          window.prescriptionWorkflow.markStepAsCompleted("patient");
          window.prescriptionWorkflow.navigateToNextStep();
        } else {
          // If editing an existing patient, refresh the list
          this.searchPatients();
        }
      } else {
        throw new Error(response.message || "Failed to save patient");
      }
    } catch (error) {
      console.error("Error saving patient:", error);
      this.showError("Failed to save patient. Please try again.");
    }
  }

  async confirmSelection() {
    if (!this.selectedPatientId) return;

    try {
      const response = await this.api.post("/api/prescriptions", {
        patient_id: this.selectedPatientId,
      });

      if (response.success && response.prescription_id) {
        this.confirmationModal.hide();
        window.prescriptionWorkflow.prescriptionId = response.prescription_id;
        window.prescriptionWorkflow.markStepAsCompleted("patient");
        window.prescriptionWorkflow.navigateToNextStep();
      } else {
        throw new Error(response.message || "Failed to create prescription");
      }
    } catch (error) {
      console.error("Error creating prescription:", error);
      this.showError("Failed to create prescription. Please try again.");
    }
  }

  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
  }

  showSuccess(message) {
    // Use the toast notification system from the main workflow
    if (
      window.prescriptionWorkflow &&
      window.prescriptionWorkflow.showSuccess
    ) {
      window.prescriptionWorkflow.showSuccess(message);
    } else {
      console.log("Success:", message);
    }
  }

  showError(message) {
    // Use the toast notification system from the main workflow
    if (window.prescriptionWorkflow && window.prescriptionWorkflow.showError) {
      window.prescriptionWorkflow.showError(message);
    } else {
      console.error("Error:", message);
    }
  }
}

// Initialize the step when the module is loaded
export function initialize() {
  new PatientSelectionStep();
}
