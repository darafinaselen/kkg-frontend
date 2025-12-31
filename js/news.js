document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "http://localhost:3002";
  const newsGrid = document.querySelector(".news-grid");
  const showMoreBtn = document.querySelector(".btn-show-more");
  const createNewsBtn = document.querySelector(".btn-create-news");
  const initialLimit = 8;
  let allNewsData = [];

  if (createNewsBtn && !isLoggedIn()) {
    createNewsBtn.style.display = "none";
  }

  function displayNews(itemsToShow) {
    if (!newsGrid) return;
    newsGrid.innerHTML = "";

    itemsToShow.forEach((berita) => {
      const tmp = document.createElement("DIV");
      tmp.innerHTML = berita.konten;
      const textOnly = tmp.textContent || tmp.innerText || "";
      const cuplikan = textOnly.substring(0, 100) + "...";

      let actionsHTML = "";
      if (isLoggedIn()) {
        actionsHTML = `
        <div class="card-overlay-actions">
          <button class="btn-edit-news" title="Edit">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-edit-2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
          </button>
          <button class="btn-delete-news" title="Hapus">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-trash-2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>
        </div>
        `;
      }

      const cardHTML = `
        <article class="card" data-id="${berita.id}">
          ${actionsHTML} 
          
          <a href="news-detail.html?id=${berita.id}" class="card-link-area">
            
            <img src="${berita.url_gambar}" alt="${berita.judul}" loading="lazy">
            
            <div class="card-body">
                <h3>${berita.judul}</h3>
                <p>${cuplikan}</p> 
            </div>
          </a>
        </article>
      `;
      newsGrid.insertAdjacentHTML("beforeend", cardHTML);
    });
    if (isLoggedIn()) {
      attachActionListeners();
    }
  }

  function attachActionListeners() {
    document.querySelectorAll(".btn-delete-news").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const card = btn.closest(".card");
        const id = card.dataset.id;

        if (confirm("Yakin ingin menghapus berita ini?")) {
          try {
            const res = await fetch(`${API_URL}/api/berita/${id}`, {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${getAuthToken()}`,
              },
            });
            if (res.ok) {
              alert("Berita berhasil dihapus!");
              loadNewsData();
            }
          } catch (err) {
            alert("Gagal menghapus: " + err.message);
          }
        }
      });
    });
    document.querySelectorAll(".btn-edit-news").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const card = btn.closest(".card");
        const id = card.dataset.id;
        window.location.href = `create-news.html?edit=${id}`;
      });
    });
  }

  async function loadNewsData() {
    try {
      const response = await fetch(`${API_URL}/api/berita`);
      if (!response.ok) throw new Error("Gagal mengambil data berita");

      allNewsData = await response.json();

      if (allNewsData.length <= initialLimit) {
        if (showMoreBtn) showMoreBtn.style.display = "none";
      } else {
        if (showMoreBtn) showMoreBtn.style.display = "block";
      }

      displayNews(allNewsData.slice(0, initialLimit));
    } catch (error) {
      console.error("Error:", error);
      if (newsGrid)
        newsGrid.innerHTML = "<p style='color:white;'>Gagal memuat berita.</p>";
    }
  }
  if (showMoreBtn) {
    showMoreBtn.addEventListener("click", () => {
      displayNews(allNewsData);
      showMoreBtn.style.display = "none";
    });
  }
  loadNewsData();
});
