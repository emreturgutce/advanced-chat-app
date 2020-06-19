// Check if user click the attach icon which is on the top right of the page.
document.querySelector('.attach').addEventListener('click', () => {
  // If user clicked it then animate
  const items = document.querySelectorAll('.dropdown-item');
  items.forEach(item => item.classList.toggle('dropdown-item-animate'));
});

