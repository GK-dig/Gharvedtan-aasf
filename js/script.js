  AOS.init({
    duration: 1000,
    offset: 100,
  });

  const modal = document.getElementById("videoModal");
  const openBtn = document.getElementById("hero-content__play-button");

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

const profileIcon = document.getElementById("profileIcon");
const dropdownMenu = document.getElementById("dropdownMenu");

profileIcon.addEventListener("click", () => {
  dropdownMenu.style.display = dropdownMenu.style.display === "flex" ? "none" : "flex";
});


document.addEventListener("click", (e) => {
  if (!profileIcon.contains(e.target) && !dropdownMenu.contains(e.target)) {
    dropdownMenu.style.display = "none";
  }
});


