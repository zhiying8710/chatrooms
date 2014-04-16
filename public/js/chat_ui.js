// binge@sf

function divEscapedContentElement(message, style, attr) {
    return $('<div style="' + style + '"' + attr + '></div>').text(message);
}

function divSystemContentElement(message) {
    return $('<div></div>').html('<i>' + message + '</i>');
}

function processUserInput(chatApp, socket) {
    var message = $('#send-message').val();
    $('#send-message').val('');
    if(!$.trim(message)) {
        return;
    }
    var systemMessage;

    if (message.charAt(0) === '/') {
        systemMessage = chatApp.processCommand(message);
        if (systemMessage) {
            $('#messages').append(divSystemContentElement('<span style="color: blue;">' + systemMessage + '</span>'));
        }
    } else {
        chatApp.sendMessage($('#room').text(), message);
        message = 'You: ' + message;
        $('#messages').append(divEscapedContentElement(message, 'color: blue;'));
        $('#messages').scrollTop($('#messages').prop('scrollHeight'));
    }

}

var socket = io.connect();
$(document).ready(function() {
    var chatApp = new Chat(socket);
    socket.on('nameResult', function(result) {
        var message = '';
        if (result.success) {
            message = '<span style="color: gray;">You are now known as ' + result.name + '.</span>';
            $('#send-message').attr('placeholder', result.name);
        } else {
            message = '<span style="color: red;">' + result.message + '</span>';
        }
        $('#messages').append(divSystemContentElement(message));
    });

    socket.on('joinResult', function(result) {
        if(result.success) {
            $('#room').text(result.room);
            $('#messages').append(divSystemContentElement('<span style="color: red;">' + 'Room changed.' + '</span>'));
        } else {
            $('#messages').append(divSystemContentElement('<span style="color: red;">' + result.text + '</span>'));
        }
    });

    socket.on('message', function(message) {
        var newElement = $('<div style="' + message.style + '"></div>').text(message.text);
        $('#messages').append(newElement);
    });

    socket.on('rooms', function(roomsInfo) {
        $('#room-list div').remove();
        var roomsPwd = roomsInfo.roomsPwd;
        var rooms = roomsInfo.rooms;
        for ( var room in rooms) {
            room = room.substring(1, room.length);
            var style = '';
            var attr = '';
            if (room != '') {
                if(room == $('#room').text()) {
                    style = 'color: red';
                }
                if (roomsPwd[room]) {
                    attr = 'pwd="pwd"';
                }
                $('#room-list').append(divEscapedContentElement(room, style, attr));
            }
        }

        $('#room-list div').click(function() {
            if($(this).text() == $('#room').text()) {
                return;
            }
            if($(this).attr('pwd')) {
                alert('This room need a password, please use /join_pwd command to join it.');
            } else {
                chatApp.processCommand('/join ' + $(this).text());
            }
            $('#send-message').focus();
        });
    });

    socket.on('usersInRoom', function(usersInRoom){
         $('#usersInRoom-list div').remove();
         for ( var i in usersInRoom) {
             var nn = usersInRoom[i];
             var style = '';
             if(nn == $('#send-message').attr('placeholder')) {
                 style = 'color: red;';
             }
             $('#usersInRoom-list').append(divEscapedContentElement(nn, style));
         }
    });

    setInterval(function() {
        socket.emit('rooms');
    }, 1000);

    setInterval(function() {
        socket.emit('usersInRoom');
    }, 1000);

    $('#send-message').focus();

    $('#send-button').click(function() {
        processUserInput(chatApp, socket);
    });
});
