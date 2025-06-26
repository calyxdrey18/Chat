// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// This will store our users: { socketId: username }
const users = {};

// Serve the static files from the 'public' directory
app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // When a user joins with a username
    socket.on('join', (username) => {
        users[socket.id] = username;
        // Broadcast to all clients that the user list has been updated
        io.emit('updateUserList', Object.values(users));
        // Broadcast a system message that a user has joined
        socket.broadcast.emit('systemMessage', `${username} has joined the chat.`);
    });

    // When a user sends a chat message
    socket.on('chatMessage', (msg) => {
        const username = users[socket.id] || 'Anonymous';
        // Broadcast the message to all clients
        io.emit('newMessage', { text: msg, user: { username: username, id: socket.id } });
    });

    // When a user disconnects
    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
        const username = users[socket.id];
        if (username) {
            delete users[socket.id];
            // Broadcast the updated user list and a system message
            io.emit('updateUserList', Object.values(users));
            io.emit('systemMessage', `${username} has left the chat.`);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});