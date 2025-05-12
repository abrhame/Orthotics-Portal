/**
 * API Service for Orthotics Prescription Portal
 * Provides methods for interacting with the backend API
 */

const ApiService = {
  /**
   * Base API methods
   */
  base: {
    /**
     * Make a GET request to the API
     * @param {string} endpoint - The API endpoint
     * @param {Object} params - Query parameters
     * @returns {Promise} - Promise resolving to the response data
     */
    async get(endpoint, params = {}) {
      try {
        const url = new URL(`${window.location.origin}/api/${endpoint}/`);

        // Add query parameters
        Object.keys(params).forEach((key) => {
          if (params[key] !== null && params[key] !== undefined) {
            url.searchParams.append(key, params[key]);
          }
        });

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          credentials: "same-origin",
        });

        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error);
        throw error;
      }
    },

    /**
     * Make a POST request to the API
     * @param {string} endpoint - The API endpoint
     * @param {Object} data - The data to send
     * @returns {Promise} - Promise resolving to the response data
     */
    async post(endpoint, data = {}) {
      try {
        const csrfToken = getCsrfToken();

        const response = await fetch(
          `${window.location.origin}/api/${endpoint}/`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-CSRFToken": csrfToken,
              "X-Requested-With": "XMLHttpRequest",
            },
            body: JSON.stringify(data),
            credentials: "same-origin",
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        console.error(`Error posting to ${endpoint}:`, error);
        throw error;
      }
    },

    /**
     * Make a PUT request to the API
     * @param {string} endpoint - The API endpoint
     * @param {Object} data - The data to send
     * @returns {Promise} - Promise resolving to the response data
     */
    async put(endpoint, data = {}) {
      try {
        const csrfToken = getCsrfToken();

        const response = await fetch(
          `${window.location.origin}/api/${endpoint}/`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "X-CSRFToken": csrfToken,
              "X-Requested-With": "XMLHttpRequest",
            },
            body: JSON.stringify(data),
            credentials: "same-origin",
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        console.error(`Error updating ${endpoint}:`, error);
        throw error;
      }
    },

    /**
     * Make a DELETE request to the API
     * @param {string} endpoint - The API endpoint
     * @returns {Promise} - Promise resolving to the response data
     */
    async delete(endpoint) {
      try {
        const csrfToken = getCsrfToken();

        const response = await fetch(
          `${window.location.origin}/api/${endpoint}/`,
          {
            method: "DELETE",
            headers: {
              "X-CSRFToken": csrfToken,
              "X-Requested-With": "XMLHttpRequest",
            },
            credentials: "same-origin",
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        console.error(`Error deleting ${endpoint}:`, error);
        throw error;
      }
    },

    /**
     * Upload files to the API
     * @param {string} endpoint - The API endpoint
     * @param {FormData} formData - The form data containing files
     * @returns {Promise} - Promise resolving to the response data
     */
    async uploadFiles(endpoint, formData) {
      try {
        const csrfToken = getCsrfToken();

        const response = await fetch(
          `${window.location.origin}/api/${endpoint}/`,
          {
            method: "POST",
            headers: {
              "X-CSRFToken": csrfToken,
              "X-Requested-With": "XMLHttpRequest",
            },
            body: formData,
            credentials: "same-origin",
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        console.error(`Error uploading to ${endpoint}:`, error);
        throw error;
      }
    },
  },

  /**
   * Patient-related API methods
   */
  patients: {
    /**
     * Get all patients
     * @param {Object} params - Query parameters
     * @returns {Promise} - Promise resolving to patients data
     */
    async getAll(params = {}) {
      return await ApiService.base.get("patients", params);
    },

    /**
     * Get a specific patient
     * @param {string} id - The patient ID
     * @returns {Promise} - Promise resolving to patient data
     */
    async get(id) {
      return await ApiService.base.get(`patients/${id}`);
    },

    /**
     * Create a new patient
     * @param {Object} data - The patient data
     * @returns {Promise} - Promise resolving to the created patient
     */
    async create(data) {
      return await ApiService.base.post("patients/create", data);
    },

    /**uploadScans
     * Update a patient
     * @param {string} id - The patient ID
     * @param {Object} data - The updated patient data
     * @returns {Promise} - Promise resolving to the updated patient
     */
    async update(id, data) {
      return await ApiService.base.put(`patients/${id}`, data);
    },

    /**
     * Delete a patient
     * @param {string} id - The patient ID
     * @returns {Promise} - Promise resolving to the deletion result
     */
    async delete(id) {
      return await ApiService.base.delete(`patients/${id}`);
    },
  },

  /**
   * Prescription-related API methods
   */
  prescriptions: {
    /**
     * Get all prescriptions
     * @param {Object} params - Query parameters
     * @returns {Promise} - Promise resolving to prescriptions data
     */
    async getAll(params = {}) {
      return await ApiService.base.get("prescriptions", params);
    },

    /**
     * Get a specific prescription
     * @param {string} id - The prescription ID
     * @returns {Promise} - Promise resolving to prescription data
     */
    async get(id) {
      return await ApiService.base.get(`prescriptions/${id}`);
    },

    /**
     * Create a new prescription
     * @param {Object} data - The prescription data
     * @returns {Promise} - Promise resolving to the created prescription
     */
    async create(data) {
      return await ApiService.base.post("prescriptions", data);
    },

    /**
     * Update a prescription
     * @param {string} id - The prescription ID
     * @param {Object} data - The updated prescription data
     * @returns {Promise} - Promise resolving to the updated prescription
     */
    async update(id, data) {
      return await ApiService.base.put(`prescriptions/${id}`, data);
    },

    /**
     * Delete a prescription
     * @param {string} id - The prescription ID
     * @returns {Promise} - Promise resolving to the deletion result
     */
    async delete(id) {
      return await ApiService.base.delete(`prescriptions/${id}`);
    },

    /**
     * Upload scans for a prescription
     * @param {string} id - The prescription ID
     * @param {FormData} formData - The form data containing files and prescription ID
     * @returns {Promise} - Promise resolving to the upload result
     */
    async uploadScans(id, formData) {
      return await ApiService.base.uploadFiles(
        `prescriptions/${id}/scans`,
        formData
      );
    },

    /**
     * Get scans for a prescription
     * @param {string} id - The prescription ID
     * @returns {Promise} - Promise resolving to the scans data
     */
    async getScans(id) {
      return await ApiService.base.get(`prescriptions/${id}/scans`);
    },

    /**
     * Save clinical measures for a prescription
     * @param {string} id - The prescription ID
     * @param {Object} data - The clinical measures data
     * @returns {Promise} - Promise resolving to the saved clinical measures
     */
    async saveClinicalMeasures(id, data) {
      return await ApiService.base.post(
        `prescriptions/${id}/clinical_measures`,
        data
      );
    },

    /**
     * Get clinical measures for a prescription
     * @param {string} id - The prescription ID
     * @returns {Promise} - Promise resolving to the clinical measures data
     */
    async getClinicalMeasures(id) {
      return await ApiService.base.get(`prescriptions/${id}/clinical_measures`);
    },

    /**
     * Save intrinsic adjustments for a prescription
     * @param {string} id - The prescription ID
     * @param {Object} data - The intrinsic adjustments data
     * @returns {Promise} - Promise resolving to the saved intrinsic adjustments
     */
    async saveIntrinsicAdjustments(id, data) {
      try {
        const response = await ApiService.base.post(
          `prescriptions/${id}/intrinsic_adjustments`,
          data
        );
        return response.data;
      } catch (error) {
        console.error("Error saving intrinsic adjustments:", error);
        throw error;
      }
    },

    /**
     * Get intrinsic adjustments for a prescription
     * @param {string} id - The prescription ID
     * @returns {Promise} - Promise resolving to the intrinsic adjustments data
     */
    async getIntrinsicAdjustments(id) {
      return await ApiService.base.get(
        `prescriptions/${id}/intrinsic_adjustments`
      );
    },

    /**
     * Save off-loading data for a prescription
     * @param {string} id - The prescription ID
     * @param {Object} data - The off-loading data
     * @returns {Promise} - Promise resolving to the saved off-loading data
     */
    async saveOffLoading(id, data) {
      try {
        const response = await ApiService.base.post(
          `prescriptions/${id}/off_loadings`,
          data
        );
        return response.data;
      } catch (error) {
        console.error("Error saving off-loading:", error);
        throw error;
      }
    },

    /**
     * Get off-loading data for a prescription
     * @param {string} id - The prescription ID
     * @returns {Promise} - Promise resolving to the off-loading data
     */
    async getOffLoading(id) {
      try {
        const response = await ApiService.base.get(
          `prescriptions/${id}/off_loadings`
        );
        return response.data;
      } catch (error) {
        console.error("Error getting off-loading:", error);
        throw error;
      }
    },

    /**
     * Save plantar modifiers for a prescription
     * @param {string} id - The prescription ID
     * @param {Object} data - The plantar modifiers data
     * @returns {Promise} - Promise resolving to the saved plantar modifiers
     */
    async savePlanterModifiers(id, data) {
      try {
        const response = await ApiService.base.post(
          `prescriptions/${id}/plantar-modifiers`,
          data
        );
        return response.data;
      } catch (error) {
        console.error("Error saving plantar modifiers:", error);
        throw error;
      }
    },

    /**
     * Get plantar modifiers for a prescription
     * @param {string} id - The prescription ID
     * @returns {Promise} - Promise resolving to the plantar modifiers data
     */
    async getPlanterModifiers(id) {
      try {
        const response = await ApiService.base.get(
          `prescriptions/${id}/plantar-modifiers`
        );
        return response.data;
      } catch (error) {
        console.error("Error getting plantar modifiers:", error);
        throw error;
      }
    },

    async getPosting(id) {
      try {
        const response = await ApiService.base.get(
          `prescriptions/${id}/postings`
        );
        return response.data;
      } catch (error) {
        console.error("Error getting posting:", error);
        throw error;
      }
    },

    async savePosting(id, data) {
      try {
        const response = await ApiService.base.put(
          `prescriptions/${id}/postings`,
          data
        );
        return response.data;
      } catch (error) {
        console.error("Error saving posting:", error);
        throw error;
      }
    },

    async getMaterialSelection(id) {
      try {
        const response = await ApiService.base.get(
          `prescriptions/${id}/material_selection`
        );
        return response.data;
      } catch (error) {
        console.error("Error getting material selection:", error);
        throw error;
      }
    },

    async saveMaterialSelection(id, data) {
      try {
        const response = await ApiService.base.put(
          `prescriptions/${id}/material_selection`,
          data
        );
        return response.data;
      } catch (error) {
        console.error("Error saving material selection:", error);
        throw error;
      }
    },

    async getDeviceOptions(id) {
      try {
        const response = await ApiService.base.get(
          `prescriptions/${id}/device_options`
        );
        return response;
      } catch (error) {
        console.error("Error getting device options:", error);
        throw error;
      }
    },

    async saveDeviceOptions(id, data) {
      try {
        const response = await ApiService.base.put(
          `prescriptions/${id}/device_options`,
          data
        );
        return response;
      } catch (error) {
        console.error("Error saving device options:", error);
        throw error;
      }
    },

    async getShoeFitting(id) {
      try {
        const response = await ApiService.base.get(
          `prescriptions/${id}/shoe_fitting`
        );
        return response.data;
      } catch (error) {
        console.error("Error getting shoe fitting:", error);
        throw error;
      }
    },

    async saveShoeFitting(id, data) {
      try {
        // Ensure to_fit_shoe is always sent
        const dataToSend = {
          ...data,
          to_fit_shoe: data.to_fit_shoe || "none",
        };

        const response = await ApiService.base.put(
          `prescriptions/${id}/shoe_fitting`,
          dataToSend
        );
        return response.data;
      } catch (error) {
        console.error("Error saving shoe fitting:", error);
        throw error;
      }
    },
  },

  /**
   * Invoice-related API methods
   */
  invoices: {
    /**
     * Get all invoices
     * @param {Object} params - Query parameters
     * @returns {Promise} - Promise resolving to invoices data
     */
    async getAll(params = {}) {
      return await ApiService.base.get("invoices", params);
    },

    /**
     * Get a specific invoice
     * @param {string} id - The invoice ID
     * @returns {Promise} - Promise resolving to invoice data
     */
    async get(id) {
      return await ApiService.base.get(`invoices/${id}`);
    },

    /**
     * Create a new invoice
     * @param {Object} data - The invoice data
     * @returns {Promise} - Promise resolving to the created invoice
     */
    async create(data) {
      return await ApiService.base.post("invoices", data);
    },

    /**
     * Generate PDF for an invoice
     * @param {string} id - The invoice ID
     * @returns {Promise} - Promise resolving to the PDF data
     */
    async generatePDF(id) {
      const response = await fetch(
        `${window.location.origin}/api/invoices/${id}/generate-pdf/`,
        {
          method: "GET",
          headers: {
            "X-Requested-With": "XMLHttpRequest",
          },
          credentials: "same-origin",
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      return await response.blob();
    },

    /**
     * Get invoice items
     * @param {string} id - The invoice ID
     * @returns {Promise} - Promise resolving to the invoice items
     */
    async getItems(id) {
      return await ApiService.base.get(`invoices/${id}/items`);
    },

    /**
     * Add item to an invoice
     * @param {string} id - The invoice ID
     * @param {Object} item - The item data
     * @returns {Promise} - Promise resolving to the added item
     */
    async addItem(id, item) {
      return await ApiService.base.post(`invoices/${id}/items`, item);
    },
  },

  /**
   * Order-related API methods
   */
  orders: {
    /**
     * Get all orders
     * @param {Object} params - Query parameters
     * @returns {Promise} - Promise resolving to orders data
     */
    async getAll(params = {}) {
      return await ApiService.base.get("orders", params);
    },

    /**
     * Get a specific order
     * @param {string} id - The order ID
     * @returns {Promise} - Promise resolving to order data
     */
    async get(id) {
      return await ApiService.base.get(`orders/${id}`);
    },

    /**
     * Create a new order
     * @param {Object} data - The order data
     * @returns {Promise} - Promise resolving to the created order
     */
    async create(data) {
      return await ApiService.base.post("orders", data);
    },

    /**
     * Update order status
     * @param {string} id - The order ID
     * @param {string} status - The new status
     * @returns {Promise} - Promise resolving to the updated order
     */
    async updateStatus(id, status) {
      return await ApiService.base.put(`orders/${id}/status`, { status });
    },
  },

  /**
   * Authentication-related API methods
   */
  auth: {
    /**
     * Log in a user
     * @param {Object} credentials - The login credentials
     * @returns {Promise} - Promise resolving to the login result
     */
    async login(credentials) {
      return await ApiService.base.post("auth/login", credentials);
    },

    /**
     * Log out the current user
     * @returns {Promise} - Promise resolving to the logout result
     */
    async logout() {
      return await ApiService.base.post("auth/logout");
    },

    /**
     * Get the current user
     * @returns {Promise} - Promise resolving to the current user data
     */
    async getCurrentUser() {
      return await ApiService.base.get("auth/user");
    },
  },
};

/**
 * Get CSRF token from cookies
 * @returns {string|null} - The CSRF token
 */
function getCsrfToken() {
  const cookieValue = document.cookie
    .split("; ")
    .find((row) => row.startsWith("csrftoken="))
    ?.split("=")[1];

  return cookieValue || null;
}

// Export the API service
window.ApiService = ApiService;
