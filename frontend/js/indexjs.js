  AOS.init({
    duration: 1000,
    offset: 100,
  });

  const modal = document.getElementById("videoModal");
  const openBtn = document.getElementById("hero-content__play-button");

openBtn.onclick = function () {
  // Clear modal content before adding new one
  modal.innerHTML = "";

  // Create modal content wrapper
  const videoWrapper = document.createElement("div");
  videoWrapper.className = "modal-content";

  // Create close button
  const closeBtn = document.createElement("span");
  closeBtn.className = "close-btn";
  closeBtn.innerHTML = "&times;";
  closeBtn.onclick = () => {
    modal.style.display = "none";
    modal.innerHTML = "";
    document.body.classList.remove("modal-open");
  };

  // Create video element
  const video = document.createElement("video");
  video.id = "myVideo";
  video.controls = true;
  video.autoplay = true;
  video.playsInline = true;

  video.style.width = "90vw";
  video.style.height = "90vh";
  video.style.objectFit = "contain";

  // Create source element
  const source = document.createElement("source");
  source.src = "assets/how-to-order.mp4";
  source.type = "video/mp4";

  video.appendChild(source);
  videoWrapper.appendChild(closeBtn);
  videoWrapper.appendChild(video);
  modal.appendChild(videoWrapper);

  modal.style.display = "flex";
  document.body.classList.add("modal-open");

  // Optional: close when video ends
  video.onended = function () {
    modal.style.display = "none";
    modal.innerHTML = "";
    document.body.classList.remove("modal-open");
  };
};

const profileIcon = document.getElementById("profileIcon");
const dropdownMenu = document.getElementById("dropdownMenu");

profileIcon.addEventListener("click", () => {
  dropdownMenu.style.display = dropdownMenu.style.display === "flex" ? "none" : "flex";
});

// Optional: Close dropdown if clicked outside
document.addEventListener("click", (e) => {
  if (!profileIcon.contains(e.target) && !dropdownMenu.contains(e.target)) {
    dropdownMenu.style.display = "none";
  }
});


