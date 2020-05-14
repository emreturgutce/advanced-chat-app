const socket = io();
const reader = new FileReader();
// Elements
const $messageContainer = document.querySelector('.message-container');
const $form = document.querySelector('.message-form');
const $messageInput = document.querySelector('.message-form input');
const $roomInfoContainer = document.querySelector('#room');
const $locationBtn = document.querySelector('.map');
const $imageInput = document.getElementById('image-input');

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const userTemplate = document.querySelector('#user-template').innerHTML;
const roomInfoTemplate = document.querySelector('#room-header-template')
  .innerHTML;
const imageMessageTemplate = document.getElementById('render-image-template')
  .innerHTML;

const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true
});

const autoScroll = () => {
  const $newMessage = $messageContainer.lastElementChild;

  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  const visibleHeight = $messageContainer.offsetHeight;

  const containerHeight = $messageContainer.scrollHeight;

  const scrollOffset = $messageContainer.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messageContainer.scrollTop = $messageContainer.scrollHeight;
  }
};

const putRoomName = () => {
  const html = Mustache.render(roomInfoTemplate, { room });
  $roomInfoContainer.innerHTML = html;
};

putRoomName();

$form.addEventListener('submit', e => {
  e.preventDefault();
  const msg = e.target.message.value;
  socket.emit('sendMessage', msg, error => {
    $messageInput.value = '';
    if (error) return console.log(error);
    console.log('Delivered!');
  });
});

socket.on('message', ({ username, text }) => {
  const html = Mustache.render(messageTemplate, {
    username,
    message: text
  });
  $messageContainer.insertAdjacentHTML('beforeend', html);
  autoScroll();
});

socket.on('roomData', ({ room, users }) => {
  const html = Mustache.render(userTemplate, { room, users });
  document.querySelector('#users').innerHTML = html;
});

socket.emit('join', { username, room }, error => {
  if (error) {
    alert(error);
    location.href = '/';
  }
});

$locationBtn.addEventListener('click', async () => {
  if (navigator.geolocation) {
    let pos = {};
    let url;
    navigator.geolocation.getCurrentPosition(position => {
      pos.longtitude = position.coords.longitude;
      pos.latitude = position.coords.latitude;
    });

    await fetch(
      `https://www.mapquestapi.com/staticmap/v5/map?key=tqpG6jBNcyQBQoNB9Tb4TqG33brFW1ql&center=${pos.latitude},${pos.longitude}&zoom=14&type=map`
    ).then(response => (url = response.url));
    socket.emit('sendLocation', url, error => {
      if (error) {
        alert(error);
      }
    });
  } else {
    alert('Could not reach your location !');
  }
});

socket.on('locationMessage', ({ username, url, createdAt }) => {
  const html = Mustache.render(imageMessageTemplate, { username, url });
  $messageContainer.insertAdjacentHTML('beforeend', html);
  autoScroll();
});

$imageInput.addEventListener('change', () => {
  for (const file of $imageInput.files) {
    reader.readAsDataURL(file);
    let binary;
    reader.addEventListener('load', () => {
      binary = reader.result;
      socket.emit('sendImage', binary);
    });
  }
});

socket.on('imageMessage', ({ username, url, createdAt }) => {
  const html = Mustache.render(imageMessageTemplate, { username, url });
  $messageContainer.insertAdjacentHTML('beforeend', html);
  autoScroll();
  enlargeImage();
});

const enlargeImage = () => {
  const img = document.querySelector('.enlargable-image');

  const modal = document.querySelector('.myModal');
  const modalImg = document.querySelector('.img01');
  const captionText = document.querySelector('.caption');

  img.onclick = function() {
    modal.style.display = 'block';
    modalImg.src = this.src;
    captionText.innerHTML = this.alt;
    captionText.style.display = 'block';
  };

  // Get the <span> element that closes the modal
  const span = document.getElementsByClassName('close')[0];

  // When the user clicks on <span> (x), close the modal
  span.onclick = function() {
    modal.style.display = 'none';
  };
};
