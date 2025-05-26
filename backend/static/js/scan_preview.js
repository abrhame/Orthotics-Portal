// Create a global class for scan preview functionality
class ScanPreview {
  constructor() {
    this.init();
  }

  init() {
    this.setupPreviewHandlers();
  }

  setupPreviewHandlers() {
    // Handle file input change
    document.querySelectorAll(".scan-file-input").forEach((input) => {
      input.addEventListener("change", (e) => {
        this.handleFileSelect(e);
      });
    });

    // Handle drag and drop
    const dropZones = document.querySelectorAll(".scan-drop-zone");
    dropZones.forEach((zone) => {
      zone.addEventListener("dragover", (e) => {
        e.preventDefault();
        zone.classList.add("drag-over");
      });

      zone.addEventListener("dragleave", (e) => {
        e.preventDefault();
        zone.classList.remove("drag-over");
      });

      zone.addEventListener("drop", (e) => {
        e.preventDefault();
        zone.classList.remove("drag-over");
        const files = e.dataTransfer.files;
        if (files.length > 0) {
          const input = zone.querySelector(".scan-file-input");
          input.files = files;
          input.dispatchEvent(new Event("change"));
        }
      });
    });
  }

  handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const previewContainer = event.target
      .closest(".scan-upload-container")
      .querySelector(".scan-preview");
    if (!previewContainer) return;

    // Clear existing preview
    previewContainer.innerHTML = "";

    // Check if file is an image
    if (file.type.startsWith("image/")) {
      const img = document.createElement("img");
      img.classList.add("scan-preview-image");
      img.file = file;

      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);

      previewContainer.appendChild(img);
    } else {
      // For non-image files, show file name
      const fileInfo = document.createElement("div");
      fileInfo.classList.add("scan-file-info");
      fileInfo.textContent = file.name;
      previewContainer.appendChild(fileInfo);
    }

    // Show file name
    const fileNameElement = event.target
      .closest(".scan-upload-container")
      .querySelector(".scan-file-name");
    if (fileNameElement) {
      fileNameElement.textContent = file.name;
    }
  }

  clearFiles() {
    // Clear file inputs
    const leftFootScan = document.getElementById("leftFootScan");
    const rightFootScan = document.getElementById("rightFootScan");
    const leftFootPreview = document.getElementById("leftFootPreview");
    const rightFootPreview = document.getElementById("rightFootPreview");
    const leftFoot3DPreview = document.getElementById("leftFoot3DPreview");
    const rightFoot3DPreview = document.getElementById("rightFoot3DPreview");
    const leftFootScanLabel = document.getElementById("leftFootScanLabel");
    const rightFootScanLabel = document.getElementById("rightFootScanLabel");

    if (leftFootScan) leftFootScan.value = "";
    if (rightFootScan) rightFootScan.value = "";

    // Clear previews
    if (leftFootPreview) leftFootPreview.classList.add("d-none");
    if (rightFootPreview) rightFootPreview.classList.add("d-none");
    if (leftFoot3DPreview) leftFoot3DPreview.classList.add("d-none");
    if (rightFoot3DPreview) rightFoot3DPreview.classList.add("d-none");

    // Reset labels
    if (leftFootScanLabel) leftFootScanLabel.textContent = "Select file";
    if (rightFootScanLabel) rightFootScanLabel.textContent = "Select file";
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.scanPreview = new ScanPreview();
});
