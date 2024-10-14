const http = require("http");
const express = require("express");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.use(express.static(path.resolve("./public")));

const users = {};

io.on("connection", (socket) => {
  socket.on("join", (username) => {
    users[socket.id] = username;
    io.emit("user-list", Object.values(users));
    console.log(`${username} has joined`);
  });

  socket.on("user-message", (data) => {
    const message = {
      text: data.message,
      user: users[socket.id],
      timestamp: new Date().toLocaleTimeString(),
    };
    io.emit("message", message);
  });

  // Handle private messages
  socket.on("private-message", (data) => {
    const { recipientId, message } = data;
    const privateMessage = {
      text: message,
      user: users[socket.id],
      timestamp: new Date().toLocaleTimeString(),
    };
    socket.to(recipientId).emit("private-message", privateMessage);
  });

  socket.on("typing", (isTyping) => {
    socket.broadcast.emit("typing", { user: users[socket.id], isTyping });
  });

  socket.on("disconnect", () => {
    delete users[socket.id];
    io.emit("user-list", Object.values(users));
    console.log("User Disconnected", socket.id);
  });
});

app.get("/", (req, res) => {
  return res.sendFile("./public/index.html");
});

server.listen(9000, () => console.log("SERVER STARTED"));
