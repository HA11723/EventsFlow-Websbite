const menuIcon = document.getElementById('menuIcon');
const menuDropdown = document.getElementById('menuDropdown');

menuIcon.addEventListener('click', () => {
  menuDropdown.style.display = menuDropdown.style.display === 'block' ? 'none' : 'block';
});

// Optional: Close dropdown if clicked outside
window.addEventListener('click', (e) => {
  if (!menuIcon.contains(e.target) && !menuDropdown.contains(e.target)) {
    menuDropdown.style.display = 'none';
  }
});
