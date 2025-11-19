document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "http://localhost:3002";
  const form = document.getElementById("create-news-form");
  const formTitle = document.getElementById("form-title");
  const publishButton = document.querySelector(".btn-publish");

  const judulInput = document.getElementById("judul");
  const gambarInput = document.getElementById("gambar_sampul");
  const penulisInput = document.getElementById("penulis");
  const imagePreview = document.getElementById("image-preview");
  const imagePreviewImg = imagePreview.querySelector("img");
  const imagePreviewText = imagePreview.querySelector("p");

  gambarInput.addEventListener("change", () => {
    const file = gambarInput.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        imagePreviewImg.src = e.target.result;
        imagePreviewText.textContent = "Gambar baru yang akan diupload:";
        imagePreview.classList.remove("hidden");
      };
      reader.readAsDataURL(file);
    }
  });

  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get("edit");
  const isEditMode = editId !== null;

  tinymce.init({
    selector: "#isi_berita",
    plugins: "lists link image media table code help wordcount",
    toolbar:
      "undo redo | blocks | " +
      "bold italic backcolor | alignleft aligncenter " +
      "alignright alignjustify | bullist numlist outdent indent | " +
      "removeformat | image | help",
    height: 400,
    file_picker_types: "image",

    images_upload_handler: async (blobInfo) => {
      const API_UPLOAD_URL = `${API_URL}/api/tinymce-upload`;
      const formData = new FormData();
      formData.append("file", blobInfo.blob(), blobInfo.filename());

      try {
        const response = await fetch(API_UPLOAD_URL, {
          method: "POST",
          body: formData,
        });
        if (!response.ok) throw new Error("Gagal upload ke server");
        const json = await response.json();
        return `${API_URL}${json.location}`;
      } catch (err) {
        console.error(err);
        throw new Error("Upload gagal: " + err.message);
      }
    },

    init_instance_callback: (editor) => {
      if (isEditMode) {
        loadDataForEdit(editor);
      }
    },
  });

  async function loadDataForEdit(editor) {
    try {
      const response = await fetch(`${API_URL}/api/berita/${editId}`);
      if (!response.ok) throw new Error("Gagal mengambil data berita");

      const berita = await response.json();

      // Isi semua form dengan data lama
      formTitle.textContent = "Edit Berita";
      publishButton.textContent = "Update Berita";
      judulInput.value = berita.judul;
      penulisInput.value = berita.penulis;

      // Isi konten TinyMCE
      editor.setContent(berita.konten);

      // Tampilkan gambar sampul yang lama
      imagePreviewImg.src = berita.url_gambar.startsWith("http")
        ? berita.url_gambar
        : `${API_URL}${berita.url_gambar}`;
      imagePreview.classList.remove("hidden");
    } catch (error) {
      console.error(error);
      alert("Gagal memuat data: " + error.message);
      window.location.href = "news.html"; // Kembalikan jika gagal
    }
  }

  // === 4. FUNGSI SUBMIT (POST atau PUT) ===
  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const kontenHTML = tinymce.get("isi_berita").getContent();
    if (!kontenHTML || kontenHTML.trim() === "") {
      alert("Isi berita tidak boleh kosong!");
      return;
    }

    const fileGambar = gambarInput.files[0];
    const formData = new FormData();
    formData.append("judul", judulInput.value);
    formData.append("penulis", penulisInput.value);
    formData.append("konten", kontenHTML);

    let url = `${API_URL}/api/berita`;
    let method = "POST";

    if (isEditMode) {
      url = `${API_URL}/api/berita/${editId}`;
      method = "PUT";
      if (fileGambar) {
        formData.append("gambar_sampul", fileGambar);
      }
    } else {
      if (!fileGambar) {
        alert("Gambar sampul wajib diisi untuk berita baru!");
        return;
      }
      formData.append("gambar_sampul", fileGambar);
    }

    try {
      const response = await fetch(url, {
        method: method,
        body: formData,
      });

      if (!response.ok) throw new Error("Gagal menyimpan data ke server");

      alert(
        isEditMode
          ? "Berita berhasil di-update!"
          : "Berita berhasil dipublikasikan!"
      );
      window.location.href = "news.html";
    } catch (error) {
      console.error("Terjadi kesalahan:", error);
      alert("Terjadi kesalahan: " + error.message);
    }
  });
});
