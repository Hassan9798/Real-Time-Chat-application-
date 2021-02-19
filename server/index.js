const express = require('express');

const app = express();
const socketio = require('socket.io');
const http = require('http');
const PORT = process.env.PORT || 5000;
const router = require('./router');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./users');
const { message } = require('statuses');
app.use(router); //middlewares

const server = http.createServer(app);
const io = socketio(server);
io.on('connection', (socket) => {
  socket.on('join', ({ name, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, name, room });
    if (error) return error;
    socket.join(user.room);
    socket.emit('message', {
      user: 'admin',
      text: `${user.name},welcome to ${user.room}`,
    });
    socket.broadcast
      .to(user.room)
      .emit('message', { user: 'admin', text: `${user.name} has joined` });

    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room),
    });
    // callback();
  });
  socket.on('sendMessage', (message, callback) => {
    const user = getUser(socket.id);
    console.log('user is', user);
    io.to(user.room).emit('message', { user: user.name, text: message });
    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room),
    });

    callback();
  });
  socket.on('disconnect', () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.name).emit('message', {
        user: 'admin',
        text: `${user.name} has left`,
      });
    }
  });
});

server.listen(PORT, () => {
  console.log(`server has started at ${PORT}`);
});
