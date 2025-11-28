// Helpers
const $ = (sel) => document.querySelector(sel);

const img1Input = $("#img1");
const img2Input = $("#img2");
const preview1 = $("#preview1");
const preview2 = $("#preview2");

const mergeType = $("#mergeType");
const opacitySlider = $("#opacity");
const opacityValue = $("#opacityValue");
const formatSelect = $("#format");

const mergeBtn = $("#mergeBtn");
const downloadBtn = $("#downloadBtn");
const resetBtn = $("#resetBtn");

const canvas = $("#canvas");
const ctx = canvas.getContext("2d");
const toast = $("#toast");

let imgA = null;
let imgB = null;
let mergedOnce = false;

// File -> Image loader
function fileToImage(file) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error("No file"));
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Invalid image"));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

// Preview rendering
async function handlePreview(input, previewEl, which) {
  const file = input.files[0];
  if (!file) {
    previewEl.innerHTML = `<span class="placeholder">Preview ${which}</span>`;
    if (which === "A") imgA = null; else imgB = null;
    return;
  }
  try {
    const img = await fileToImage(file);
    previewEl.innerHTML = "";
    const tag = document.createElement("img");
    tag.src = img.src;
    previewEl.appendChild(tag);
    if (which === "A") imgA = img; else imgB = img;
    showToast(`Loaded image ${which}`);
    mergedOnce = false;
    downloadBtn.disabled = true;
  } catch (err) {
    showToast(`Error: ${err.message}`, true);
  }
}

// Opacity value UI
opacitySlider.addEventListener("input", () => {
  const pct = Math.round(parseFloat(opacitySlider.value) * 100);
  opacityValue.textContent = `${pct}%`;
});

// Merge handler
mergeBtn.addEventListener("click", () => {
  if (!imgA || !imgB) {
    showToast("Please upload Image A and Image B first.", true);
    return;
  }

  const type = mergeType.value;
  try {
    if (type === "overlay") {
      const w = Math.max(imgA.width, imgB.width);
      const h = Math.max(imgA.height, imgB.height);
      canvas.width = w; canvas.height = h;
      ctx.clearRect(0, 0, w, h);
      // Center images if smaller than canvas
      const ax = (w - imgA.width) / 2;
      const ay = (h - imgA.height) / 2;
      const bx = (w - imgB.width) / 2;
      const by = (h - imgB.height) / 2;

      ctx.drawImage(imgA, ax, ay);
      ctx.globalAlpha = parseFloat(opacitySlider.value);
      ctx.drawImage(imgB, bx, by);
      ctx.globalAlpha = 1.0;
    } else if (type === "side") {
      const h = Math.max(imgA.height, imgB.height);
      const scaleA = h / imgA.height;
      const scaleB = h / imgB.height;
      const w = Math.round(imgA.width * scaleA) + Math.round(imgB.width * scaleB);

      canvas.width = w; canvas.height = h;
      ctx.clearRect(0, 0, w, h);
      // Left: A
      ctx.drawImage(imgA, 0, 0, Math.round(imgA.width * scaleA), h);
      // Right: B
      ctx.drawImage(imgB, Math.round(imgA.width * scaleA), 0, Math.round(imgB.width * scaleB), h);
    } else if (type === "top") {
      const w = Math.max(imgA.width, imgB.width);
      const scaleA = w / imgA.width;
      const scaleB = w / imgB.width;
      const h = Math.round(imgA.height * scaleA) + Math.round(imgB.height * scaleB);

      canvas.width = w; canvas.height = h;
      ctx.clearRect(0, 0, w, h);
      // Top: A
      ctx.drawImage(imgA, 0, 0, w, Math.round(imgA.height * scaleA));
      // Bottom: B
      ctx.drawImage(imgB, 0, Math.round(imgA.height * scaleA), w, Math.round(imgB.height * scaleB));
    }

    mergedOnce = true;
    downloadBtn.disabled = false;
    showToast("Merged successfully. You can download now.");
  } catch (err) {
    showToast(`Merge error: ${err.message}`, true);
  }
});

// Download handler
downloadBtn.addEventListener("click", () => {
  if (!mergedOnce) return;
  const format = formatSelect.value; // png, jpeg, webp
  const mime = `image/${format}`;
  const link = document.createElement("a");
  link.download = `merged-image.${format}`;
  link.href = canvas.toDataURL(mime, 0.92); // quality for jpeg/webp
  link.click();
});

// Reset
resetBtn.addEventListener("click", () => {
  img1Input.value = "";
  img2Input.value = "";
  preview1.innerHTML = `<span class="placeholder">Preview A</span>`;
  preview2.innerHTML = `<span class="placeholder">Preview B</span>`;
  canvas.width = 0; canvas.height = 0;
  mergedOnce = false;
  downloadBtn.disabled = true;
  showToast("Reset complete.");
});

// Toast utility
function showToast(message, isError = false) {
  toast.textContent = message;
  toast.classList.toggle("show", true);
  toast.style.borderColor = isError ? "var(--danger)" : "var(--border)";
  setTimeout(() => toast.classList.toggle("show", false), 2500);
}

// Bind previews
img1Input.addEventListener("change", () => handlePreview(img1Input, preview1, "A"));
img2Input.addEventListener("change", () => handlePreview(img2Input, preview2, "B"));
