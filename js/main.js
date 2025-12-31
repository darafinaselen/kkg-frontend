document.addEventListener("DOMContentLoaded", () => {
  const navbarPlaceholder = document.getElementById("navbar-placeholder");

  if (navbarPlaceholder) {
    fetch("_navbar.html")
      .then((response) => response.text())
      .then((data) => {
        navbarPlaceholder.innerHTML = data;

        const navUl = navbarPlaceholder.querySelector("nav ul");
        if (navUl) {
          if (isLoggedIn()) {
            const logoutLi = document.createElement("li");
            logoutLi.innerHTML = '<a href="#" id="logout-button">Logout</a>';
            navUl.appendChild(logoutLi);

            document
              .getElementById("logout-button")
              .addEventListener("click", (e) => {
                e.preventDefault();
                logout();
              });
          } else {
            const loginLi = document.createElement("li");
            loginLi.innerHTML =
              '<a href="login.html" class="btn-login-nav">Login</a>';
            navUl.appendChild(loginLi);
          }
        }

        highlightActiveLink();
      })
      .catch((error) => {
        console.error("Gagal memuat navigasi:", error);
      });
  }

  const footerPlaceholder = document.getElementById("footer-placeholder");

  if (footerPlaceholder) {
    fetch("_footer.html")
      .then((response) => response.text())
      .then((data) => {
        footerPlaceholder.innerHTML = data;
      })
      .catch((error) => {
        console.error("Gagal memuat footer:", error);
      });
  }
});

function highlightActiveLink() {
  const currentPage = window.location.pathname.split("/").pop() || "home.html";
  const navLinks = document.querySelectorAll("#navbar-placeholder nav a");

  navLinks.forEach((link) => {
    const linkPage = link.getAttribute("href");
    if (linkPage === currentPage) {
      link.classList.add("active");
    }
  });
}

function isLoggedIn() {
  return localStorage.getItem("kkgAuthToken") !== null;
}

function getAuthToken() {
  return localStorage.getItem("kkgAuthToken");
}

function logout() {
  localStorage.removeItem("kkgAuthToken");
  alert("Anda telah logout.");
  window.location.href = "home.html";
}
