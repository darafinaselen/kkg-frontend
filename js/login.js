document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "http://localhost:3002";
  const loginForm = document.getElementById("login-form");

  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault(); // Mencegah form refresh halaman

      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;

      try {
        const response = await fetch(`${API_URL}/api/admin/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: username,
            password: password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          // Jika server merespon error (misal: password salah)
          throw new Error(data.message || "Login gagal");
        }

        // --- INI BAGIAN YANG ANDA TANYAKAN ---
        // Jika berhasil:
        console.log("Token diterima:", data.token);
        localStorage.setItem("kkgAuthToken", data.token);
        alert("Login berhasil!");
        window.location.href = "home.html"; // Arahkan ke home
        // ------------------------------------
      } catch (error) {
        console.error("Error saat login:", error);
        alert("Login Gagal: " + error.message);
      }
    });
  }
});
