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

// Get the username and room name from url using Qs library which makes it so easy.
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

// A function which put the room name to the roomInfo container which is just above the message container.
const putRoomName = () => {
  const html = Mustache.render(roomInfoTemplate, { room });
  $roomInfoContainer.innerHTML = html;
};

putRoomName();

// What happens if user submit the form
$form.addEventListener('submit', e => {
  // First prevent the default action which refresh the page. We do not want that.
  e.preventDefault();

  // get the value of the message
  const msg = e.target.message.value;

  // emit an "sendMessage" event and pass the message value within it.
  socket.emit('sendMessage', msg, error => {
    // clear the message input
    $messageInput.value = '';
    if (error) return console.log(error);

    // if no error occured then log the delivered message.
    console.log('Delivered!');
  });
});

// Listen "message" event
socket.on('message', ({ username, text }) => {
  // create a message with the given infos
  const html = Mustache.render(messageTemplate, {
    username,
    message: text
  });

  // insert the message into messageContainer
  $messageContainer.insertAdjacentHTML('beforeend', html);
  autoScroll();
});

// Listen "roomData" event
socket.on('roomData', ({ room, users }) => {
  // create a new users list with the passed users
  const html = Mustache.render(userTemplate, { room, users });

  // change the users with the new one
  document.querySelector('#users').innerHTML = html;
});

// Emit "join" event which we handle in the ~/src/index file
socket.emit('join', { username, room }, error => {
  if (error) {
    alert(error);
    location.href = '/';
  }
});

// What happens if user wants to send his location
$locationBtn.addEventListener('click', async () => {
  // check if his browser supports navigator API
  if (navigator.geolocation) {
    // if supports then
    let pos = {};
    let url;
    // get the current location of the user
    navigator.geolocation.getCurrentPosition(position => {
      // put the longtitude and latitude into the "pos" object.
      pos.longtitude = position.coords.longitude;
      pos.latitude = position.coords.latitude;
    });

    // use mapquestapi which is created by mozilla to get the current location of the user by his long, lat info.
    await fetch(
      `https://www.mapquestapi.com/staticmap/v5/map?key=tqpG6jBNcyQBQoNB9Tb4TqG33brFW1ql&center=${pos.latitude},${pos.longitude}&zoom=14&type=map`
    ).then(response => (url = response.url));
    // Emit "sendLocation" event and pass the url which contains image about the location of the user.
    socket.emit('sendLocation', url, error => {
      // If there is any error then tell the user about the error.
      if (error) {
        alert(error);
      }
    });
  } else {
    // if the user's browser does not support navigator API then send a message to user.
    alert('Could not reach your location !');
  }
});

// Listen "locationMessage" event
socket.on('locationMessage', ({ username, url, createdAt }) => {
  const html = Mustache.render(imageMessageTemplate, { username, url });
  $messageContainer.insertAdjacentHTML('beforeend', html);
  autoScroll();
});

// What happens when user sends his image
$imageInput.addEventListener('change', () => {
  for (const file of $imageInput.files) {
    reader.readAsDataURL(file);
    let binary;
    reader.addEventListener('load', () => {
      // get the binary data
      binary = reader.result;
      // send the binary data to the server
      socket.emit('sendImage', binary);
    });
  }
});

// Listens if "imageMessage" event happens
socket.on('imageMessage', ({ username, url, createdAt }) => {
  // Create the content
  const html = Mustache.render(imageMessageTemplate, { username, url });

  // insert the content into the container.
  $messageContainer.insertAdjacentHTML('beforeend', html);

  // call the autoscroll function if needed
  autoScroll();

  enlargeImage();
});

// The function that makes the image bigger when you click it on.
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
