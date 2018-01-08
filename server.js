var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

users = {};
connections = [];

server.listen(process.env.PORT || 3000);
console.log('...Server Running...');

app.get('/', function (request, response) {
	response.sendFile(__dirname + '/index.html');
});

io.sockets.on('connection', function (socket) {
	
	//Connect
	connections.push(socket);
	console.log('Connected: %s connections connected', connections.length);

	//New user
	socket.on('new user', function (data, callback) {
		if (data in users) {
			callback(false);
		}
		else {
			callback(true);
			socket.username = data;
			users[socket.username]=socket;
			// users.push(socket.username);
			updateUsernames();	
		}
	});

	function updateUsernames(){
		io.sockets.emit('get users', Object.keys(users));
	}

	//Send message
	socket.on('send message', function (data, callback) {
		// console.log(data);
		var msg = data.trim();
		if(msg.substr(0,3) === '/w ')
		{
			msg = msg.substr(3);
			var ind = msg.indexOf(' ');
			if (ind != -1){
				var name = msg.substring(0, ind);
				var msg = msg.substring(ind + 1);
				if (name in users) {
					users[name].emit('whisper', {msg:msg, user:socket.username});
					console.log('Whisper!');
				}
				else {
					callback('Error! Enter a valid user...');
				}
			}
			else {
				callback('Error, Please enter a valid message...');
			}
		}
		else {
			io.sockets.emit('new message', {msg:data, user:socket.username});
		}
	});

	//Disconnect
	socket.on('disconnect', function (data) {
		// if (!socket.username) return;
		// users.splice(users.indexOf(socket.user), 1);
		delete users[socket.username];
		// connections.splice(connections.indexOf(socket), 1);
		updateUsernames();
		console.log('Disconnected: %s connections connected', connections.length);
	});
})