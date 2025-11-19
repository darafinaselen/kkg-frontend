document.addEventListener("DOMContentLoaded", async () => {
  const API_URL = "http://localhost:3002";
  const params = new URLSearchParams(window.location.search);
  const newsId = params.get("id");

  const titleEl = document.getElementById("news-title");
  const authorEl = document.getElementById("news-author");
  const dateEl = document.getElementById("news-date");
  const imageEl = document.getElementById("news-image");
  const bodyEl = document.getElementById("news-body");
  const mainContainer = document.querySelector(".news-content");

  if (!newsId) {
    document.querySelector(".news-content").innerHTML =
      "<h1>404: ID Berita tidak ditemukan.</h1>";
    return;
  }

  try {
    const response = await fetch(`${API_URL}/api/berita/${newsId}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Berita tidak ditemukan.");
      }
      throw new Error("Gagal mengambil data dari server.");
    }

    const berita = await response.json();

    document.title = berita.judul;
    titleEl.textContent = berita.judul;
    authorEl.textContent = berita.penulis;
    dateEl.textContent = new Date(berita.createdAt).toLocaleDateString(
      "id-ID",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
    imageEl.src = berita.url_gambar;
    imageEl.alt = berita.judul;

    bodyEl.innerHTML = berita.konten;
  } catch (error) {
    console.error("Error:", error);
    mainContainer.innerHTML = `<h1>Error: ${error.message}</h1>`;
  }
});
