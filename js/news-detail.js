document.addEventListener("DOMContentLoaded", async () => {
  const API_URL = "http://localhost:3002";
  const params = new URLSearchParams(window.location.search);
  const newsId = params.get("id");

  const titleEl = document.getElementById("news-title");
  const authorEl = document.getElementById("news-author");
  const dateEl = document.getElementById("news-date");
  const imageEl = document.getElementById("news-image");
  const bodyEl = document.getElementById("news-body");
  const cardContainer = document.querySelector(".news-card");

  if (!newsId) {
    cardContainer.innerHTML =
      "<div style='padding:40px; text-align:center;'><h1>404</h1><p>ID Berita tidak ditemukan.</p></div>";
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

    document.title = berita.judul + " - KKG Website";
    titleEl.textContent = berita.judul;
    authorEl.textContent = berita.penulis || "Admin";
    dateEl.textContent = new Date(berita.createdAt).toLocaleDateString(
      "id-ID",
      {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
    if (berita.url_gambar) {
      imageEl.src = berita.url_gambar;
      imageEl.alt = berita.judul;
    } else {
      imageEl.src = "https://via.placeholder.com/800x400?text=No+Image";
    }

    bodyEl.innerHTML = berita.konten;
  } catch (error) {
    console.error("Error:", error);
    mainContainer.innerHTML = `<h1>Error: ${error.message}</h1>`;
  }
});
