// NOTE: the code below is modified from code found at: 
// https://socket.io/get-started/chat/

// socket object waiting for connections 
var socket = io();

var form = document.getElementById('form');
var loginButton = document.getElementById('loginBtn');
var chatContainer = document.getElementById('chatContainer');
var logo = document.getElementById('logo');
var loginContainer = document.getElementById('loginPopup');
var input = document.getElementById('input');
var loginInput = document.getElementById('loginInput');
var loginInput2 = document.getElementById('loginInput2');
var mobileUserListbtn = document.getElementById("userListBtn");
const msgList = document.getElementById('messages');

// Focuses on input when startup
let currIn = loginInput.focus();

// Array keeping track of all usernames in use
var userNames = new Array();

var time;
var senderName;
var senderColour;

var colours = ["#00E5A3", "#4CBBE7", "#FDC5F5", "#FFC482", "#9439A9", "#F1D96C", "#FF0000"];


// Submit button on login popup
loginButton.addEventListener("click" , closeLogin);


function closeLogin() {
    // Check if username already in use
    let name = loginInput.value + " " + loginInput2.value
    if(userNames.includes(name)) {
        alert("Nickname already in use, please select another name");
        window.location.reload();
    }
    else if(loginInput.value == "") {
        alert("Please enter a first name");
        window.location.reload();
    }
    else {
        // Fade the login page and display the chat page
        $("#loginWrapper").fadeOut();
    }

    senderName = name;
    userNames.push(senderName);
    // Choose a random colour for the user
    senderColour = colours[Math.floor(Math.random() * colours.length)];
    colours.splice(colours.indexOf(senderColour),1);

    // notify server a new user has joined
    let newUser = {
        newUserName: senderName,
        newUserColour: senderColour,
        newUserId: socket.id
    }
    socket.emit('new connection', newUser);
    // Add user to users list
    createNewUser(newUser,true);
}

// emit 'chat message' event when send/enter button is pressed
form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (input.value) {
        if(input.value.startsWith('/newcolour ')) {
            changeColour(input.value.slice(11));
            input.value = "";
        }
        else if(input.value.startsWith('/newname ')) {
            changeNickname(input.value.slice(9));
            input.value = "";
        }
        else {
            // Create message on screen 
            let msg = input.value;
            let msgObj = {
                senderName: senderName,
                text: msg,
                senderColour: senderColour
            }
            input.value = '';
            // Get time
            time = localTime();
            // send message to server (server broadcasts it to other users)
            socket.emit('chat message', msgObj);
            // append message to messages list
            createMessageItem(msg,true);
        }

    }
});

// LISTENERS ------------------------------------------------------------------------

// Update username on user list when user changes their name
socket.on('new name', function(nameObj) {
    if(userNames.includes(nameObj.oldName)) {
        userNames.splice(userNames.indexOf(nameObj.oldName),1);
    }
    userNames.push(nameObj.newName);
    // Create new alert string notifying other clients of name change
    let user = document.getElementById(nameObj.id);
    user.lastChild.textContent = nameObj.newName;
    let str = nameObj.oldName + " changed their name to " + nameObj.newName;
    newMessageAlert(str);
});


// Display last 200 messages when new client connects
socket.on('get messages', function(msgList) {
    msgList.forEach((msg) => {
        createMessageItem(msg,false);
    });
});


// Display all active users when new client connects
socket.on('get users', function(userList) {
    userList.forEach((user) => {
        createNewUser(user);
        userNames.push(user.newUserName);
    });
});


// New user joins chat room
// Add username to user list (doesnt add it to list if the username is this users name)
socket.on('new connection', function(user) {
    userNames.push(user.newUserName);
    let str = user.newUserName + " joined the chat";
    newMessageAlert(str);
    createNewUser(user);
});

// on 'chat message' event, display message in textContent
socket.on('chat message', function(msg) {
    createMessageItem(msg, false);
}); 


// when a user disconnects remove them from user list and userNames list
socket.on('user disconnect', function(userId) {
    removeUser(userId.id);
    if(userId.name != undefined) {
        userNames.splice(userNames.indexOf(userId.name),1);
        let str = userId.name + " left the chat";
        newMessageAlert(str, "#ca2a2a");
    }
});


// Handle typing event from server
// Displays a message that specifies <user> is typing...
socket.on('typing event', (name) => {
    let str = name + " is typing...";
    newMessageAlert(str);
});

// https://stackoverflow.com/questions/35120280/how-to-do-typing-and-stop-typing-in-socket-io-and-jquery-properly
// removes '<user> is typing... message
socket.on('typing stopped',(name) => {
    // user stopped typing 
    removeTypingAlert();
});



// LISTENERS ------------------------------------------------------------------------

// Creates a message and appends it to messages list
function createMessageItem(msg, isSender) {
    // list item appended to ul
    var item = document.createElement('li');
    // a tag containing chat message
    var msgText = document.createElement('a');
    // Text ontop of message containing name and time
    var nameTime = document.createElement('p');
    let text = ".messageText";

    // If this user is the sender, make different class names
    // (sender has different styled messages)
    if(isSender) {
        msgText.className = "messageSenderText";
        item.className = "messageSenderLi";
        nameTime.className = "messageNameTime";
        nameTime.style.textAlign = "right";
        nameTime.textContent = senderName + " • " + time;
        nameTime.style.color = senderColour;
        msgText.textContent = msg;
        text = ".messageSenderText";
    }
    else {
        item.className = "messageLi";
        msgText.className = "messageText";
        nameTime.className = "messageNameTime";
        nameTime.style.textAlign = "left";
        nameTime.style.color = msg.colour;
        nameTime.textContent = msg.sender + " • " + msg.time;
        msgText.textContent = msg.text;
    }

    // Removes typing alert 
    removeTypingAlert();

    item.appendChild(nameTime);
    item.appendChild(msgText);
    messages.appendChild(item);


    // Scroll to last message in list
    items = document.querySelectorAll(text);
    last = items[items.length-1];
    last.scrollIntoView();

}

function getLastChild() {
    let msgs = msgList.childNodes;
    return msgList.lastChild;
}

// Creates a new user in users list
function createNewUser(user, isUser) {
    let item = document.createElement('li');
    item.className = "userLi";
    item.id = user.newUserId;

    let icon = document.createElement('span');
    icon.className = "usersIcon";
    icon.style.backgroundColor = user.newUserColour;
    let initials = user.newUserName.split(' ').map(function(item){return item[0]}).join('');

    icon.textContent = initials;
    // a tag containing username 
    var userName = document.createElement('span');
    userName.className = "usersListName";
    // item.style.borderRight = "6px solid " + user.newUserColour;
    if(isUser != undefined) {
        userName.textContent = user.newUserName + " (You)";
    }
    else {
        userName.textContent = user.newUserName;        
    }

    // Li consists of icon followed by username
    item.appendChild(icon);
    item.appendChild(userName);

    users.appendChild(item);
}


function changeNickname(newName) {
    if(!userNames.includes(newName)) {
        // remove username from list of taken usernames
        userNames.splice(userNames.indexOf(senderName),1);
        userNames.push(newName);
        // send message to clients to notify name change
        let nameObj = {
            oldName: senderName,
            newName: newName
        }
        // change name in users list
        let user = document.getElementById(socket.id);
        user.lastChild.textContent = nameObj.newName + " (You)";
        socket.emit('new name', nameObj);
        senderName = newName;
    }
    else if(senderName == newName) {
        alert("This is already your name, please choose another name");
    }
    else {
        alert("Nickname taken, please choose another name");
    }
}


function changeColour(newColour) {
    // check if string is valid hexcolor
    let hex = /^#[0-9A-F]{6}$/i;
    if(hex.test(newColour)) {
        senderColour = newColour;
    }
    else {
        alert("Invalid. Please enter a valid hexcolour: <#RRGGBB>");
    }
}

// Creates a gray message in the middle of chat 
function newMessageAlert(str, colour) {
    let newUser = document.createElement('li');
    newUser.className = "newUserLi";
    newUser.textContent = str;
    if(colour != undefined) {
        newUser.style.color = colour;
    }
    messages.appendChild(newUser);
    newUser.scrollIntoView();
}


var typingTimeout = undefined;
var isTyping = false;


function timeoutFunction(){
    isTyping = false;
    socket.emit('typing stopped');
  }
  

function sendTypingEvent() {
    // User was not typing before (new typing event)
    if(isTyping == false) {
        // sends a typing event to the server 
        isTyping = true;
        socket.emit('typing event', senderName);
        typingTimeout = setTimeout(timeoutFunction, 5000);
    }
    // User resumes typing, clear the timeout
    else {
        clearTimeout(timeout);
        timeout = setTimeout(timeoutFunction, 5000);
    }
}

function removeTypingAlert() {
    let msgs = msgList.childNodes;
    for(i = 0; i < msgs.length; i++) {
        // E.G. send typing stopped event when a user clicks enter
        // removes "user is typing" alert 
        if(msgs[i].textContent.includes(" is typing...") && msgs[i].className == "newUserLi") {
            msgList.removeChild(msgs[i]);
        }
    }
}


// removes disconnected user from users list
function removeUser(userId) {
    try {
        let user = document.getElementById(userId);
        users.removeChild(user);
    }
    catch(e) {
        // User is no longer in list (TypeError)
    }
}

// Toggle darkmode
function darkModeToggle() {
    let msgList = document.getElementById('messagesList');
    let userList = document.getElementById('usersList');
    let userListNames = document.querySelectorAll('.usersListName');
    let input = document.getElementById('input');
    let body = document.getElementById('bodyLight');
    let header1 = document.getElementById('header1');
    let header2 = document.getElementById('header2');
    let btn1 = document.getElementById("darkModeBtn");
    let btn3 = document.getElementById("userListBtn");
    let logo = document.getElementById("chatLogo");


    userListNames.forEach(el => {
        el.classList.toggle('usersListNameDark');
    })
    msgList.classList.toggle('messagesListDark');
    userList.classList.toggle('usersListDark');
    input.classList.toggle('inputDark');
    body.classList.toggle('bodyDark');
    header1.classList.toggle('headerDark');
    header2.classList.toggle('headerDark');
    btn1.classList.toggle('darkModeBtnDark');
    btn3.classList.toggle('darkModeBtnDark');
    logo.classList.toggle('chatLogoDark');
}

// https://www.w3schools.com/howto/howto_css_overlay.asp
// Mobile: displays the user list when button is pressed
function displayUserList() {
    let list = document.getElementById("usersList");
    let clone = list.cloneNode(true);
    clone.className = "usersListMobile";
    let btn = document.getElementById("userListBtn");


    if(list.style.display === "block") {
        btn.style.backgroundColor = "#202423";
        list.style.display = "none";
    }
    else {
        list.style.display = "block";
        btn.style.backgroundColor = "#00E5A3";
    }

}

// Mobile: hides the user list when overlay is pressed
function hideUserList() {
    document.getElementById("usersList").style.display = "none";
}


// Returns the local time
// Only used when a client enters a message
// Otherwise the server calculates the time (when messages from others are broadcasted)
function localTime() {
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