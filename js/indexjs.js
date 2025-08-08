document.addEventListener("DOMContentLoaded", () => {
  AOS.init({
    duration: 1000,
    offset: 100,
  });

  const modal = document.getElementById("videoModal");
  const openBtn = document.getElementById("hero-content__play-button");

  if (openBtn && modal) {
    openBtn.onclick = function () {
      modal.innerHTML = "";

      const videoWrapper = document.createElement("div");
      videoWrapper.className = "modal-content";

      const closeBtn = document.createElement("span");
      closeBtn.className = "close-btn";
      closeBtn.innerHTML = "&times;";
      closeBtn.onclick = () => {
        modal.style.display = "none";
        modal.innerHTML = "";
        document.body.classList.remove("modal-open");
      };

      const video = document.createElement("video");
      video.id = "myVideo";
      video.controls = true;
      video.autoplay = true;
      video.playsInline = true;
      video.style.width = "90vw";
      video.style.height = "90vh";
      video.style.objectFit = "contain";

      const source = document.createElement("source");
      source.src = "assets/how-to-order.mp4";
      source.type = "video/mp4";

      video.appendChild(source);
      videoWrapper.appendChild(closeBtn);
      videoWrapper.appendChild(video);
      modal.appendChild(videoWrapper);

      modal.style.display = "flex";
      document.body.classList.add("modal-open");

      video.onended = function () {
        modal.style.display = "none";
        modal.innerHTML = "";
        document.body.classList.remove("modal-open");
      };
    };
  }

  const profileIcon = document.getElementById("profileIcon");
  const dropdownMenu = document.getElementById("dropdownMenu");

  if (profileIcon && dropdownMenu) {
    profileIcon.addEventListener("click", () => {
      dropdownMenu.style.display =
        dropdownMenu.style.display === "flex" ? "none" : "flex";
    });

    document.addEventListener("click", (e) => {
      if (
        !profileIcon.contains(e.target) &&
        !dropdownMenu.contains(e.target)
      ) {
        dropdownMenu.style.display = "none";
      }
    });
  }

  const user = JSON.parse(sessionStorage.getItem("loggedInUser"));

  if (user && dropdownMenu) {
    dropdownMenu.innerHTML = `
      <div style="padding: 10px; border-bottom: 1px solid #ccc;">
        <strong>${user.name}</strong><br>
        <small>${user.phone}</small>
      </div>
      <a href="#">My Orders</a>
      <a href="#" id="logoutBtn">Logout</a>
    `;

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.onclick = () => {
        sessionStorage.removeItem("loggedInUser");
        location.reload();
      };
    }
  } else if (dropdownMenu) {
    dropdownMenu.innerHTML = `
      <a href="/loginsignup/work.html">Login / Signup</a>
    `;
  }

  const loginNav = document.getElementById("loginNav");
  if (loginNav) {
    loginNav.style.display = user ? "none" : "block";
  }
});
