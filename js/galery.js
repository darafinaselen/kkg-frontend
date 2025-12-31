document.addEventListener("DOMContentLoaded", function () {
  const API_URL = "http://localhost:3002"; // Sesuaikan port backend
  const galleryGrid = document.getElementById("gallery-grid");

  // === ELEMENT MODAL & TOMBOL ===
  const addModal = document.getElementById("addImageModal");
  const openModalBtn = document.querySelector(".add-image-btn");
  const closeModalBtn = addModal
    ? addModal.querySelector(".close-modal-btn")
    : null;
  const cancelBtn = addModal ? addModal.querySelector(".cancel-btn") : null;
  const addImageForm = document.getElementById("addImageForm");
  const imageFileInput = document.getElementById("imageFile");
  const imageCaptionInput = document.getElementById("imageCaption");
  const addModalTitle = addModal ? addModal.querySelector("h2") : null;

  // === ELEMENT LIGHTBOX ===
  const lightbox = document.getElementById("lightbox-modal");
  const lightboxImg = document.getElementById("lightbox-image");
  const lightboxCaption = document.getElementById("lightbox-caption");
  const lightboxDate = document.getElementById("lightbox-date");
  const lightboxClose = lightbox
    ? lightbox.querySelector(".lightbox-close")
    : null;
  const lightboxPrev = lightbox
    ? lightbox.querySelector(".lightbox-arrow.prev")
    : null;
  const lightboxNext = lightbox
    ? lightbox.querySelector(".lightbox-arrow.next")
    : null;

  // Tombol aksi di dalam lightbox
  const lightboxEdit = document.getElementById("lightbox-edit-btn");
  const lightboxDelete = document.getElementById("lightbox-delete-btn");
  const lightboxActions = document.querySelector(".lightbox-actions");

  // === AUTH HELPER ===
  function getAuthToken() {
    return localStorage.getItem("kkgAuthToken");
  }
  function isLoggedIn() {
    return getAuthToken() !== null;
  }

  // State Variables
  let isEditMode = false;
  let editId = null;
  let allGalleryData = [];
  let currentLightboxIndex = 0;

  if (openModalBtn && !isLoggedIn()) {
    openModalBtn.style.display = "none";
  }

  // === RENDER FUNCTION ===
  function renderGallery(galleryData) {
    galleryGrid.innerHTML = "";
    allGalleryData = galleryData;

    if (!galleryData || galleryData.length === 0) {
      galleryGrid.innerHTML =
        '<p style="color:white; text-align:center; grid-column: 1 / -1;">Belum ada gambar.</p>';
      return;
    }

    galleryData.forEach((item, index) => {
      let imageUrl = item.url_gambar.startsWith("http")
        ? item.url_gambar
        : `${API_URL}${item.url_gambar}`;

      const date = new Date(item.createdAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      let actionsHTML = "";
      // Tombol Edit & Hapus hanya muncul jika Login
      if (isLoggedIn()) {
        actionsHTML = `
        <div class="overlay-actions">
            <button class="btn-edit" data-id="${item.id}" title="Edit">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
            </button>
            <button class="btn-delete" data-id="${item.id}" title="Hapus">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </button>
        </div>
        `;
      }

      const itemHTML = `
        <div class="gallery-item" data-index="${index}">
            <img src="${imageUrl}" alt="${item.keterangan}" loading="lazy">
            <div class="overlay">
                ${actionsHTML} 
                <div class="overlay-info">
                    <p class="caption">${item.keterangan}</p>
                    <p class="date">${date}</p>
                </div>
            </div>
        </div>
      `;
      galleryGrid.insertAdjacentHTML("beforeend", itemHTML);
    });
  }

  // ===  EVENT LISTENER GRID (FIX UTAMA) ===
  if (galleryGrid) {
    galleryGrid.addEventListener("click", (e) => {
      const target = e.target;

      const btnDelete = target.closest(".btn-delete");
      if (btnDelete) {
        e.preventDefault();
        e.stopPropagation();
        const id = btnDelete.dataset.id;
        deleteImage(id);
        return;
      }

      const btnEdit = target.closest(".btn-edit");
      if (btnEdit) {
        e.preventDefault();
        e.stopPropagation();
        const id = btnEdit.dataset.id;
        openEditModal(id);
        return;
      }

      const item = target.closest(".gallery-item");
      if (item) {
        const index = parseInt(item.dataset.index, 10);
        openLightbox(index);
      }
    });
  }

  // --- GET DATA ---
  async function loadGalleryData() {
    try {
      const response = await fetch(`${API_URL}/api/galeri`);
      const data = await response.json();
      renderGallery(data);
    } catch (error) {
      console.error("Gagal memuat galeri:", error);
    }
  }

  // --- DELETE FUNCTION ---
  async function deleteImage(id) {
    if (!confirm("Yakin ingin menghapus gambar ini?")) return;

    try {
      const response = await fetch(`${API_URL}/api/galeri/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

      if (response.ok) {
        alert("Gambar berhasil dihapus!");
        loadGalleryData();
        closeLightbox();
      } else {
        const errData = await response.json();
        alert(
          "Gagal menghapus gambar: " + (errData.message || "Unknown error")
        );
      }
    } catch (error) {
      alert("Error: " + error.message);
    }
  }

  // --- SUBMIT FORM ---
  if (addImageForm) {
    addImageForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const imageFile = imageFileInput.files[0];
      const imageCaption = imageCaptionInput.value;
      const formData = new FormData();
      formData.append("imageCaption", imageCaption);

      if (imageFile) {
        formData.append("imageFile", imageFile);
      }

      try {
        let url = isEditMode
          ? `${API_URL}/api/galeri/${editId}`
          : `${API_URL}/api/galeri`;
        let method = isEditMode ? "PUT" : "POST";

        if (!isEditMode && !imageFile) {
          alert("Pilih gambar yang akan di-upload!");
          return;
        }

        const response = await fetch(url, {
          method: method,
          body: formData,
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || "Gagal menyimpan data");
        }

        alert(isEditMode ? "Berhasil diupdate!" : "Berhasil diupload!");
        closeAddModal();
        loadGalleryData();
      } catch (error) {
        console.error(error);
        alert("Error: " + error.message);
      }
    });
  }

  // --- MODAL FUNCTIONS ---
  function openAddModal() {
    isEditMode = false;
    editId = null;
    if (addModalTitle) addModalTitle.textContent = "Tambah Gambar Baru";
    addImageForm.reset();
    addModal.classList.remove("hidden");
  }

  function openEditModal(id) {
    const item = allGalleryData.find((d) => d.id == id);
    if (!item) return;

    isEditMode = true;
    editId = id;
    if (addModalTitle) addModalTitle.textContent = "Edit Keterangan Gambar";
    imageCaptionInput.value = item.keterangan;
    addModal.classList.remove("hidden");
  }

  function closeAddModal() {
    if (addModal) {
      addModal.classList.add("hidden");
      addImageForm.reset();
    }
  }

  if (openModalBtn) openModalBtn.addEventListener("click", openAddModal);
  if (closeModalBtn) closeModalBtn.addEventListener("click", closeAddModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeAddModal);

  // --- LIGHTBOX FUNCTIONS ---
  function openLightbox(index) {
    if (!lightbox) return;
    currentLightboxIndex = index;
    updateLightboxContent();
    lightbox.classList.remove("hidden");
  }

  function closeLightbox() {
    if (lightbox) lightbox.classList.add("hidden");
  }

  function updateLightboxContent() {
    const item = allGalleryData[currentLightboxIndex];
    if (!item) return;

    let imageUrl = item.url_gambar.startsWith("http")
      ? item.url_gambar
      : `${API_URL}${item.url_gambar}`;
    lightboxImg.src = imageUrl;
    lightboxCaption.textContent = item.keterangan;

    if (lightboxDate) {
      const date = new Date(item.createdAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      lightboxDate.textContent = date;
    }

    if (lightboxActions) {
      if (isLoggedIn()) {
        lightboxActions.style.display = "flex";

        const newEdit = lightboxEdit.cloneNode(true);
        const newDelete = lightboxDelete.cloneNode(true);
        lightboxEdit.parentNode.replaceChild(newEdit, lightboxEdit);
        lightboxDelete.parentNode.replaceChild(newDelete, lightboxDelete);

        // Re-assign listener
        newEdit.addEventListener("click", () => {
          closeLightbox();
          openEditModal(item.id);
        });

        newDelete.addEventListener("click", () => {
          if (confirm("Yakin ingin menghapus gambar ini?")) {
            deleteImage(item.id);
          }
        });
      } else {
        lightboxActions.style.display = "none";
      }
    }
  }

  function showNextImage() {
    currentLightboxIndex++;
    if (currentLightboxIndex >= allGalleryData.length) {
      currentLightboxIndex = 0;
    }
    updateLightboxContent();
  }

  function showPrevImage() {
    currentLightboxIndex--;
    if (currentLightboxIndex < 0) {
      currentLightboxIndex = allGalleryData.length - 1;
    }
    updateLightboxContent();
  }

  if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);
  if (lightboxNext) lightboxNext.addEventListener("click", showNextImage);
  if (lightboxPrev) lightboxPrev.addEventListener("click", showPrevImage);

  // Load awal
  loadGalleryData();
});
