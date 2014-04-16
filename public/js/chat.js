// binge@sf

var Chat = function(socket) {
    this.socket = socket;
};

Chat.prototype.sendMessage = function(room, text) {
    var message = {
        room : room,
        text : text
    };
    this.socket.emit('message', message);
};

Chat.prototype.changeRoom = function(room) {
    this.socket.emit('join', {
        newRoom : room
    });
};

Chat.prototype.changeRoomWithPwd = function(room, pwd) {
    this.socket.emit('join_pwd', {
        newRoom : room,
        pwd : pwd
    });
};

Chat.prototype.processCommand = function(command) {
    var words = command.split(' ');
    command = words[0].substring(1, words[0].length).toLowerCase();
    var message = '';
    switch (command) {
    case 'join':
        words.shift();
        var room = words.join(' ');
        this.changeRoom(room);
        break;
    case 'nick':
        words.shift();
        var name = words.join(' ');
        this.socket.emit('nameAttempt', name);
        break;
    case 'join_pwd':
        words.shift();
        var name_pwd = words.join(' ');
        var sep = '$';
        var i = name_pwd.indexOf(sep);
        name = name_pwd.substring(0, i);
        var pwd = name_pwd.substring(i + sep.length);
        this.changeRoomWithPwd(name, pwd);
        break;
    default:
        message = 'Unrecognized command.';
        break;
    }
    return message;
};
