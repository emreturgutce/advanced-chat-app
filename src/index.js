const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");

const {
  generateMessage,
  generateLocation,
  generateImage,
} = require("./utils/messages");
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require("./utils/users");

// Creating Socket.io server
const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;

// Telling server our static files are in the public dir.
app.use(express.static(path.join(__dirname, "../public")));

// When a socket connected.
io.on("connection", (socket) => {
  console.log("New WebSocket Connection !");

  // What happens when a socket connected.
  socket.on("join", ({ username, room }, callback) => {

    // Add the connected user to the users list which is in the utils/users file.
    const { error, user } = addUser({ id: socket.id, username, room });

    if (error) return callback(error);

    // Add the connected user to the room
    socket.join(user.room);

    // Emit "message" event which sends welcome message to the connected user.
    socket.emit(
      "message",
      generateMessage("Admin", `Hello ${username}, Welcome To ${room} Room !`)
    );

    // Emit "message" event which sends everybody except the connected user "new user has joined message"
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        generateMessage("Admin", `${user.username} has joined!`)
      );

    // Emit "roomData" event which sends to room about data about room name and users that in the room.
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });

    callback();
  });

  // What happens when user wants to send a message to the room
  socket.on("sendMessage", (msg, callback) => {
    // Find who wants to send the message
    const user = getUser(socket.id);

    // Emit "message" event which sends the message that the user typed to the room
    io.to(user.room).emit("message", generateMessage(user.username, msg));

    callback();
  });

  // What happens when user wants to send his location to the room
  socket.on("sendLocation", (url, callback) => {
    // Find the user
    const user = getUser(socket.id);

    // Emit "locationMessage" event to the room which sends the location of the user
    io.to(user.room).emit(
      "locationMessage",
      generateLocation(user.username, url)
    );

    callback();
  });

  // What happens when user wants to send an image
  socket.on("sendImage", (binary, callback) => {
    // Get the user
    const user = getUser(socket.id);

    // Emit "imageMessage" event which sends the picture to the room
    io.to(user.room).emit("imageMessage", generateImage(user.username, binary));
  });

  // What happens when user wants to disconnect
  socket.on("disconnect", () => {
    // Remove the user from list
    const user = removeUser(socket.id);

    // If the user is exist then
    if (user) {
      // Send everybody a message in the room which says "the user has left"
      io.to(user.room).emit(
        "message",
        generateMessage(`${user.username} has left!`)
      );
      // Refresh the room data
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });
});

// Listen the given port
server.listen(port, () => console.log(`App is running on port ${port} !`));
