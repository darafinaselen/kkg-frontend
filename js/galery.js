document.addEventListener("DOMContentLoaded", function () {
  const API_URL = "http://localhost:3002";
  const galleryGrid = document.getElementById("gallery-grid");

  // Elemen Modal Tambah/Edit
  const addModal = document.getElementById("addImageModal");
  const openModalBtn = document.querySelector(".add-image-btn");
  const closeModalBtn = addModal.querySelector(".close-modal-btn");
  const cancelBtn = addModal.querySelector(".cancel-btn");
  const addImageForm = document.getElementById("addImageForm");
  const imageFileInput = document.getElementById("imageFile");
  const imageCaptionInput = document.getElementById("imageCaption");
  const addModalTitle = addModal.querySelector("h2");

  // Elemen Modal Lightbox (Tampilan Penuh)
  const lightbox = document.getElementById("lightbox-modal");
  const lightboxImg = document.getElementById("lightbox-image");
  const lightboxCaption = document.getElementById("lightbox-caption");
  const lightboxDate = document.getElementById("lightbox-date");
  const lightboxClose = lightbox.querySelector(".lightbox-close");
  const lightboxPrev = lightbox.querySelector(".lightbox-arrow.prev");
  const lightboxNext = lightbox.querySelector(".lightbox-arrow.next");
  const lightboxEdit = document.getElementById("lightbox-edit-btn");
  const lightboxDelete = document.getElementById("lightbox-delete-btn");
  const lightboxActions = document.querySelector(".lightbox-actions");

  // State (Penyimpanan Data)
  let isEditMode = false;
  let editId = null;
  let allGalleryData = [];
  let currentLightboxIndex = 0;

  if (openModalBtn && !isLoggedIn()) {
    openModalBtn.style.display = "none";
  }

  function renderGallery(galleryData) {
    galleryGrid.innerHTML = "";
    allGalleryData = galleryData;

    if (galleryData.length === 0) {
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
      if (isLoggedIn()) {
        actionsHTML = `
        <div class="overlay-actions">
            <button class="btn-edit" data-id="${item.id}" title="Edit">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-edit-2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
            </button>
            <button class="btn-delete" data-id="${item.id}" title="Hapus">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-trash-2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </button>
        </div>
        `;
      }

      const itemHTML = `
        <div class="gallery-item" data-index="${index}">
            <img src="${imageUrl}" alt="${item.keterangan}">
            <div class="overlay">
                ${actionsHTML} <div class="overlay-info">
                    <p class="caption">${item.keterangan}</p>
                    <p class="date">${date}</p>
                </div>
            </div>
        </div>
      `;
      galleryGrid.insertAdjacentHTML("beforeend", itemHTML);
    });
    if (isLoggedIn()) {
      // Pindahkan fungsi attachActionListeners ke sini
      galleryGrid.addEventListener("click", (e) => {
        const target = e.target;
        const button = target.closest("button");
        const item = target.closest(".gallery-item");
        if (!item) return;

        if (button) {
          e.stopPropagation();
          const id = button.dataset.id;

          if (button.classList.contains("btn-delete")) {
            deleteImage(id);
          } else if (button.classList.contains("btn-edit")) {
            openEditModal(id);
          }
        } else {
          const index = parseInt(item.dataset.index, 10);
          openLightbox(index);
        }
      });
    } else {
      // Jika tidak login, klik hanya untuk lightbox
      galleryGrid.addEventListener("click", (e) => {
        const item = e.target.closest(".gallery-item");
        if (item) {
          const index = parseInt(item.dataset.index, 10);
          openLightbox(index);
        }
      });
    }
  }

  // --- GET (Ambil Data) ---
  async function loadGalleryData() {
    try {
      const response = await fetch(`${API_URL}/api/galeri`);
      const data = await response.json();
      renderGallery(data);
    } catch (error) {
      console.error("Gagal memuat galeri:", error);
    }
  }

  // --- DELETE (Hapus Data) ---
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
      }
    } catch (error) {
      alert("Gagal menghapus: " + error.message);
    }
  }

  // --- SUBMIT FORM (Create atau Update) ---
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
      let response;
      let url = isEditMode
        ? `${API_URL}/api/galeri/${editId}`
        : `${API_URL}/api/galeri`;
      let method = isEditMode ? "PUT" : "POST";

      if (!isEditMode && !imageFile) {
        alert("Pilih gambar yang akan di-upload!");
        return;
      }

      response = await fetch(url, {
        method: method,
        body: formData,
        ders: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      if (!response.ok) throw new Error("Gagal menyimpan data");

      alert(isEditMode ? "Berhasil diupdate!" : "Berhasil diupload!");
      closeAddModal();
      loadGalleryData();
    } catch (error) {
      console.error(error);
      alert("Error: " + error.message);
    }
  });

  // --- Event Delegation untuk Tombol di Grid ---
  galleryGrid.addEventListener("click", (e) => {
    const target = e.target;
    const button = target.closest("button");
    const item = target.closest(".gallery-item");
    if (!item) return;

    if (button) {
      e.stopPropagation();
      const id = button.dataset.id;

      if (button.classList.contains("btn-delete")) {
        deleteImage(id);
      } else if (button.classList.contains("btn-edit")) {
        openEditModal(id);
      }
    } else {
      const index = parseInt(item.dataset.index, 10);
      openLightbox(index);
    }
  });

  // --- Modal Tambah/Edit ---
  function openAddModal() {
    isEditMode = false;
    editId = null;
    addModalTitle.textContent = "Tambah Gambar Baru";
    addImageForm.reset();
    addModal.classList.remove("hidden");
  }

  function openEditModal(id) {
    const item = allGalleryData.find((d) => d.id == id);
    if (!item) return;

    isEditMode = true;
    editId = id;
    addModalTitle.textContent = "Edit Keterangan Gambar";
    imageCaptionInput.value = item.keterangan;
    addModal.classList.remove("hidden");
  }

  function closeAddModal() {
    addModal.classList.add("hidden");
    addImageForm.reset();
  }

  openModalBtn.addEventListener("click", openAddModal);
  closeModalBtn.addEventListener("click", closeAddModal);
  cancelBtn.addEventListener("click", closeAddModal);

  // --- Modal Lightbox ---
  function openLightbox(index) {
    currentLightboxIndex = index;
    updateLightboxContent();
    lightbox.classList.remove("hidden");
  }

  function closeLightbox() {
    lightbox.classList.add("hidden");
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
        lightboxActions.style.display = "";
        lightboxEdit.dataset.id = item.id;
        lightboxDelete.dataset.id = item.id;
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

  // Event listener untuk Lightbox
  lightboxClose.addEventListener("click", closeLightbox);
  lightboxNext.addEventListener("click", showNextImage);
  lightboxPrev.addEventListener("click", showPrevImage);

  lightboxEdit.addEventListener("click", () => {
    const id = lightboxEdit.dataset.id;
    closeLightbox();
    openEditModal(id);
  });

  lightboxDelete.addEventListener("click", () => {
    const id = lightboxDelete.dataset.id;
    deleteImage(id);
  });
  loadGalleryData();
});
