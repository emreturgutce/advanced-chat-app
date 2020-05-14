document.querySelector('.attach').addEventListener('click', () => {
  const items = document.querySelectorAll('.dropdown-item');
  items.forEach(item => item.classList.toggle('dropdown-item-animate'));
});

// Get the image and insert it inside the modal - use its "alt" text as a caption
