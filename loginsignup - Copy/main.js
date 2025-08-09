document.addEventListener("DOMContentLoaded", () => {
  AOS.init({
    duration: 1000,
    offset: 100,
  });})
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
