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

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "../public")));

io.on("connection", (socket) => {
  console.log("New WebSocket Connection !");
  socket.on("join", ({ username, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, username, room });
    if (error) return callback(error);

    socket.join(user.room);

    socket.emit(
      "message",
      generateMessage("Admin", `Hello ${username}, Welcome To ${room} Room !`)
    );
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        generateMessage("Admin", `${user.username} has joined!`)
      );
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });
    callback();
  });

  socket.on("sendMessage", (msg, callback) => {
    const user = getUser(socket.id);
    io.emit("message", generateMessage(user.username, msg));
    callback();
  });

  socket.on("sendLocation", (url, callback) => {
    const user = getUser(socket.id);
    io.to(user.room).emit(
      "locationMessage",
      generateLocation(user.username, url)
    );
    callback();
  });

  socket.on("sendImage", (binary, callback) => {
    const user = getUser(socket.id);
    io.to(user.room).emit("imageMessage", generateImage(user.username, binary));
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit(
        "message",
        generateMessage(`${user.username} has left!`)
      );
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });
});

server.listen(port, () => console.log(`App is running on port ${port} !`));
