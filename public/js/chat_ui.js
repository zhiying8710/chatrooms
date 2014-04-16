// binge@sf

function divEscapedContentElement(message, style) {
    return $('<div style="' + style + '"></div>').text(message);
}

function divSystemContentElement(message) {
    return $('<div></div>').html('<i>' + message + '</i>');
}

function processUserInput(chatApp, socket) {
    var message = $('#send-message').val();
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

    $('#send-message').val('');
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
        $('#room').text(result.room);
        $('#messages').append(divSystemContentElement('<span style="color: red;">' + 'Room changed.' + '</span>'));
    });

    socket.on('message', function(message) {
        var newElement = $('<div style="' + message.style + '"></div>').text(message.text);
        $('#messages').append(newElement);
    });

    socket.on('rooms', function(rooms) {
        $('#room-list div').remove();
        for ( var room in rooms) {
            room = room.substring(1, room.length);
            var style = '';
            if (room != '') {
                if(room == $('#room').text()) {
                    style = 'color: red';
                }
                $('#room-list').append(divEscapedContentElement(room, style));
            }
        }

        $('#room-list div').click(function() {
            if($(this).text() == $('#room').text()) {
                return;
            }
            chatApp.processCommand('/join ' + $(this).text());
            $('#send-message').focus();
        });
    });

    socket.on('usersInRoom', function(usersInRoom){
         $('#usersInRoom-list div').remove();
         for ( var i in usersInRoom) {
             var nn = usersInRoom[i];
             var style = '';
             if(nn == $('#send-message').attr('placeholder')) {
                 nn = nn + '(Yourself)';
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
