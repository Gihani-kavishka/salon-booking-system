const current = window.location.pathname.split("/").pop() || "index.html";
const links = document.querySelectorAll("[data-nav]");
links.forEach((link) => {
  const target = link.getAttribute("href");
  if (target === current) {
    link.classList.add("active");
  }
});
