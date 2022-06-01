// SENG 513 A2
// By: Mathew Luong UCID: 30068650
// NOTE: the code below is modified from code found at: 
// https://socket.io/get-started/chat/

const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
// create socket.io instance with server object
const io = new Server(server);

// Array containing all messages (max of 200 messages)
var messages = new Array();
// Array containing all active users
var activeUsers = new Array();

// for static css file (CSS in public folder)
// app.use(express.static('public'));
app.use(express.static(__dirname + '/public'));

// Route handler on home page (sends html file)
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// listen on port 3000
server.listen(3000, () => {
    console.log('Listening on *:3000');
});


// when a client connects log it
io.on('connection', (socket) => {
    console.log('A user connected');
    // broadcast new connection to all clients (except sender)
    socket.on('new connection', (user) => {
        userObj = {
            newUserName: user.newUserName,
            newUserColour: user.newUserColour,
            newUserId: user.newUserId
        }
        // add new user to list of active users
        activeUsers.push(userObj);
        socket.broadcast.emit('new connection', userObj);
    });
});


// When a new user connects emit get message/user events
// Client displays the past 200 messages and active users
io.on('connection', (socket) => {
    // send messages list to new user (on new connection)
    io.to(socket.id).emit('get messages', messages);
    // send list of all active users (on new connection)
    io.to(socket.id).emit('get users', activeUsers);
});


// when a client disconnects log it
io.on('connection', (socket) => {
    socket.on('disconnect', () => {
        console.log('-A User disconnected');
        var removedName;
        // remove user from active user list
        activeUsers.forEach((user,ind) => {
            if(socket.id == user.newUserId) {
                removedName = user.newUserName;
                activeUsers.splice(ind,1);
            }
        });
        socketObj = {
            id: socket.id,
            name: removedName
        }
        // notify clients this user has disconnected
        io.emit('user disconnect',socketObj);
        });
});


// Alert clients a user has changed their name
io.on('connection', (socket) => {
    socket.on('new name', (newObj) => {
        nameObj = {
            newName: newObj.newName,
            oldName: newObj.oldName,
            id: socket.id
        }
        // Update name from list of active users
        activeUsers.forEach((user) => {
            if(socket.id == user.newUserId) {
                user.newName = newObj.newName;
            }
        });
        socket.broadcast.emit('new name', nameObj);
    });
});


// broadcast chat message to all clients (except for sender)
// LearnRPG: https://stackoverflow.com/questions/10058226/send-response-to-all-clients-except-sender
io.on('connection', (socket) => {
    socket.on('chat message', (msg) => {
        let msgObj = {
                text: msg.text,
                time: calcTime(),
                colour: msg.senderColour,
                sender: msg.senderName
        }
        // push msg into array (array contains at max the last 200 messages)
        addNewMessage(msgObj);

        socket.broadcast.emit('chat message', msgObj);
    });
});

// broadcast typing event 
io.on('connection', (socket) => {
    socket.on('typing event', (name) => {
        socket.broadcast.emit('typing event', name);
    });
});


// Only save last 200 messages 
function addNewMessage(msgObj) {
    if(messages.length >= 200) {
        // remove first element
        messages.shift();
        messages.push(msgObj);
    }
    else {
        messages.push(msgObj);
    }
}


// Calculates the time (HH:MM am/pm format)
function calcTime() {
    const d = new Date();
    
    let hour = d.getHours();
    var ampm = hour >= 12 ? 'pm' : 'am';
    // convert to 
    hour = hour % 12;
    hour = hour ? hour : 12; 
    // add 0 if min < 10
    let minute = d.getMinutes();
    minute = minute < 10 ? "0" + minute : minute;
    
    let str = hour + ":" + minute + " " + ampm;
    return str;
}

