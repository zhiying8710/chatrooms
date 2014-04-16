// binge@sf

var socketio = require('socket.io');
var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = [];
var currentRoom = {};

function assignGuestName(socket) {
    var name = 'Guest' + guestNumber;
    nickNames[socket.id] = name;
    socket.emit('nameResult', {
        success : true,
        name : name
    });
    return guestNumber + 1;
}

function joinRoom(socket, room) {
    socket.join(room);
    currentRoom[socket.id] = room;
    socket.emit('joinResult', {
        room : room
    });

    socket.broadcast.to(room).emit('message', {
        text : nickNames[socket.id] + ' has joined ' + room + '.',
        style : 'color: gray;'
    });

    var usersInRoom = io.sockets.clients(room);

    if (usersInRoom.length > 1) {
        var usersInRoomSummary = 'Users currently in ' + room + ": ";
        for ( var index in usersInRoom) {
            var userSocketId = usersInRoom[index].id;
            if (userSocketId !== socket.id) {
                if (index > 0) {
                    usersInRoomSummary += ', ';
                }
                usersInRoomSummary += nickNames[userSocketId];
            }
        }
        usersInRoomSummary += '.';
        socket.emit('message', {
            text : usersInRoomSummary,
            style : 'color: gray;'
        });
    }
}

function handleNameChangeAttempts(socket) {
    socket.on('nameAttempt', function(name) {
        if (name.indexOf('Guest') === 0) {
            socket.emit('nameResult', {
                success : false,
                message : 'Name cannot begin with "Guest"'
            });
        } else {
            if (namesUsed.indexOf(name) === -1) {
                var previousName = nickNames[socket.id];
                var previousNameIndex = namesUsed.indexOf(previousName);
                namesUsed.push(name);
                nickNames[socket.id] = name;

                delete namesUsed[previousNameIndex];
                socket.emit('nameResult', {
                    success : true,
                    name : name
                });
                socket.broadcast.to(currentRoom[socket.id]).emit('message', {
                    text : previousName + ' is now known as ' + name + '.',
                    style : 'color: red;'
                });
            } else {
                socket.emit('nameResult', {
                    success : false,
                    message : 'That name is already in use.'
                });
            }
        }
    });
}

function handleMessageBroadcasting(socket) {
    socket.on('message', function(message) {
        socket.broadcast.to(message.room).emit('message', {
            text : nickNames[socket.id] + ': ' + message.text,
            style : 'font-weight: bold;'
        });
    });
}

function handleRoomJoining(socket) {
    socket.on('join', function(room) {
        socket.leave(currentRoom[socket.id]);
        socket.broadcast.to(currentRoom[socket.id]).emit('message', {
            text : nickNames[socket.id] + ' has leaved.',
            style : 'color: gray;'
        });
        joinRoom(socket, room.newRoom);
    });
}

function handleClientDisconnection(socket) {
    socket.on('disconnect', function() {
        var nn = nickNames[socket.id];
        var nameIndex = namesUsed.indexOf(nn);
        socket.broadcast.to(currentRoom[socket.id]).emit('message', {
            text : nn + ' is off.',
            style : 'color: gray;'
        });
        delete namesUsed[nameIndex];
        delete nickNames[socket.id];
    });
}

exports.listen = function(server) {
    io = socketio.listen(server);
    io.set('log level', 1);
    io.sockets.on('connection', function(socket) {
        guestNumber = assignGuestName(socket);
        joinRoom(socket, 'Weclome');

        handleMessageBroadcasting(socket);
        handleNameChangeAttempts(socket);
        handleRoomJoining(socket);

        socket.on('rooms', function() {
            socket.emit('rooms', io.sockets.manager.rooms);
        });

        socket.on('usersInRoom', function() {
            var tmp = io.sockets.clients(currentRoom[socket.id]);
            var usersInRoom = [];
            for ( var index in tmp) {
                var userSocketId = tmp[index].id;
                usersInRoom.push(nickNames[userSocketId]);
            }
            socket.emit('usersInRoom', usersInRoom);
        });

        handleClientDisconnection(socket);
    });
};
