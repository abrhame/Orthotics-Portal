import { ApiService } from "../../api_service.js";

class ScanUploadStep {
  constructor() {
    this.api = new ApiService();
    this.leftScanFile = null;
    this.rightScanFile = null;
    this.leftPreviewScene = null;
    this.rightPreviewScene = null;
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    // File input change events
    document
      .getElementById("leftScanInput")
      .addEventListener("change", (e) => this.handleFileSelect(e, "left"));
    document
      .getElementById("rightScanInput")
      .addEventListener("change", (e) => this.handleFileSelect(e, "right"));

    // Clear button events
    document
      .getElementById("clearLeftScan")
      .addEventListener("click", () => this.clearScan("left"));
    document
      .getElementById("clearRightScan")
      .addEventListener("click", () => this.clearScan("right"));

    // Drag and drop events
    ["leftScanPreview", "rightScanPreview"].forEach((id) => {
      const element = document.getElementById(id);
      const side = id.includes("left") ? "left" : "right";

      element.addEventListener("dragover", (e) => this.handleDragOver(e, side));
      element.addEventListener("dragleave", (e) =>
        this.handleDragLeave(e, side)
      );
      element.addEventListener("drop", (e) => this.handleDrop(e, side));
      element.addEventListener("click", () => this.triggerFileInput(side));
    });
  }

  triggerFileInput(side) {
    document.getElementById(`${side}ScanInput`).click();
  }

  handleDragOver(e, side) {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById(`${side}ScanPreview`).classList.add("drag-over");
  }

  handleDragLeave(e, side) {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById(`${side}ScanPreview`).classList.remove("drag-over");
  }

  handleDrop(e, side) {
    e.preventDefault();
    e.stopPropagation();

    const preview = document.getElementById(`${side}ScanPreview`);
    preview.classList.remove("drag-over");

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const input = document.getElementById(`${side}ScanInput`);
      input.files = files;
      this.handleFileSelect({ target: input }, side);
    }
  }

  async handleFileSelect(event, side) {
    const file = event.target.files[0];
    if (!file) return;

    if (!this.validateFile(file)) {
      this.showError(
        `Invalid file type. Please upload STL, WRL, JPG, or PNG files.`
      );
      return;
    }

    // Store the file
    if (side === "left") {
      this.leftScanFile = file;
    } else {
      this.rightScanFile = file;
    }

    // Show preview
    await this.showPreview(file, side);

    // Auto upload if both scans are selected
    if (this.leftScanFile && this.rightScanFile) {
      this.uploadScans();
    }
  }

  validateFile(file) {
    const validTypes = [
      "image/jpeg",
      "image/png",
      "model/stl",
      "model/vrml",
      "application/sla",
      ".stl",
      ".wrl",
    ];

    const fileType = file.type.toLowerCase();
    const extension = file.name.toLowerCase().split(".").pop();

    return (
      validTypes.includes(fileType) ||
      extension === "stl" ||
      extension === "wrl"
    );
  }

  async showPreview(file, side) {
    const preview = document.getElementById(`${side}ScanPreview`);
    preview.innerHTML = ""; // Clear existing content

    const extension = file.name.toLowerCase().split(".").pop();

    if (extension === "jpg" || extension === "jpeg" || extension === "png") {
      await this.showImagePreview(file, preview);
    } else if (extension === "stl" || extension === "wrl") {
      await this.show3DPreview(file, preview, side);
    }
  }

  async showImagePreview(file, preview) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        preview.appendChild(img);
        resolve();
      };
      img.src = URL.createObjectURL(file);
    });
  }

  async show3DPreview(file, preview, side) {
    // Set up scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      preview.clientWidth / preview.clientHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ antialias: true });

    renderer.setSize(preview.clientWidth, preview.clientHeight);
    preview.appendChild(renderer.domElement);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    scene.add(ambientLight);
    scene.add(directionalLight);

    // Position camera
    camera.position.z = 5;

    // Load the 3D model
    const loader = file.name.toLowerCase().endsWith("stl")
      ? new THREE.STLLoader()
      : new THREE.VRMLLoader();

    const fileUrl = URL.createObjectURL(file);

    try {
      const geometry = await new Promise((resolve, reject) => {
        loader.load(fileUrl, resolve, undefined, reject);
      });

      const material = new THREE.MeshPhongMaterial({
        color: 0x808080,
        specular: 0x111111,
        shininess: 200,
      });
      const mesh = new THREE.Mesh(geometry, material);

      // Center the model
      geometry.center();

      scene.add(mesh);

      // Store the scene reference
      if (side === "left") {
        this.leftPreviewScene = { scene, camera, renderer, mesh };
      } else {
        this.rightPreviewScene = { scene, camera, renderer, mesh };
      }

      // Animation loop
      const animate = () => {
        requestAnimationFrame(animate);
        mesh.rotation.y += 0.01;
        renderer.render(scene, camera);
      };
      animate();
    } catch (error) {
      console.error("Error loading 3D model:", error);
      this.showError("Failed to load 3D model. Please try again.");
    } finally {
      URL.revokeObjectURL(fileUrl);
    }
  }

  clearScan(side) {
    // Clear file input
    const input = document.getElementById(`${side}ScanInput`);
    input.value = "";

    // Clear preview
    const preview = document.getElementById(`${side}ScanPreview`);
    preview.innerHTML = `
            <div class="upload-placeholder">
                <i class="bi bi-cloud-upload"></i>
                <p>Drop scan file here or click to upload</p>
                <small class="text-muted">Supported formats: STL, WRL, JPG, PNG</small>
            </div>
        `;

    // Clear stored file
    if (side === "left") {
      this.leftScanFile = null;
      this.leftPreviewScene = null;
    } else {
      this.rightScanFile = null;
      this.rightPreviewScene = null;
    }
  }

  async uploadScans() {
    if (!this.leftScanFile || !this.rightScanFile) {
      this.showError("Please select scans for both feet.");
      return;
    }

    const prescriptionId = window.prescriptionWorkflow.prescriptionId;
    if (!prescriptionId) {
      this.showError("No prescription ID found. Please start over.");
      return;
    }

    const formData = new FormData();
    formData.append("left_scan", this.leftScanFile);
    formData.append("right_scan", this.rightScanFile);
    formData.append("prescription_id", prescriptionId);

    const progressBar = document.querySelector(".upload-progress");
    const progressBarInner = progressBar.querySelector(".progress-bar");
    const statusText = document.getElementById("uploadStatus");

    try {
      progressBar.style.display = "block";
      progressBarInner.style.width = "0%";
      statusText.textContent = "Uploading scans...";

      const response = await this.api.upload(
        "/api/scans/upload",
        formData,
        (progress) => {
          progressBarInner.style.width = `${progress}%`;
        }
      );

      if (response.success) {
        this.showSuccess("Scans uploaded successfully!");
        window.prescriptionWorkflow.markStepAsCompleted("scans");
        window.prescriptionWorkflow.navigateToNextStep();
      } else {
        throw new Error(response.message || "Failed to upload scans");
      }
    } catch (error) {
      console.error("Error uploading scans:", error);
      this.showError("Failed to upload scans. Please try again.");
    } finally {
      progressBar.style.display = "none";
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
  new ScanUploadStep();
}
