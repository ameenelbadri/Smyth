function toggleDropdown(dropdownId) {
    document.querySelectorAll(".dropdown-content").forEach(function(dropdown) {
        if (dropdown.id !== dropdownId) {
            dropdown.classList.remove("show");
        }
    });

    document.getElementById(dropdownId).classList.toggle("show");
}

window.onclick = function(e) {
    if (!e.target.matches(".dropbtn")) {
        document.querySelectorAll(".dropdown-content").forEach(function(dropdown) {
            dropdown.classList.remove("show");
        });
    }
}

const sceneLinks = {
    myDropdown1: ["prelude", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"],
    myDropdown2: ["prelude", "1", "2", "3", "4", "5"],
    myDropdown3: ["1", "2"]
};

const scorePagePath = window.location.pathname.includes("/pages/")
  ? "scorepage.html"
  : "pages/scorepage.html";

Object.entries(sceneLinks).forEach(function([dropdownId, scenes]) {
  const act = dropdownId.replace("myDropdown", "");

  document.querySelectorAll(`#${dropdownId} a`).forEach(function(link, index) {
    link.href = `${scorePagePath}?act=${act}&scene=${scenes[index]}`;
  });
});