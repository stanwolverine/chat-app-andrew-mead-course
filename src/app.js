const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');

const {
	generateMessage,
	generateLocationMessage,
} = require('./utils/messages');
const {
	addUser,
	removeUser,
	getUser,
	getUsersInRoom,
} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const filter = new Filter();

app.use(express.static(path.join(__dirname, '..', 'public')));

io.on('connection', (socket) => {
	socket.on('JOIN', ({ username, room }, callback) => {
		const { user, error } = addUser({ id: socket.id, username, room });

		if (error) {
			return callback(error);
		}

		socket.join(user.room);

		socket.emit('MESSAGE', generateMessage('Admin', 'Welcome!'));

		socket.broadcast
			.to(user.room)
			.emit(
				'MESSAGE',
				generateMessage('Admin', `${user.username} has joined.`),
			);

		io.to(user.room).emit('ROOM_DATA', {
			room: user.room,
			users: getUsersInRoom(user.room),
		});

		callback();
	});

	socket.on('SEND_MESSAGE', ({ message }, callback) => {
		if (filter.isProfane(message)) {
			return callback('Profanity is not allowed!');
		}

		const { room, username } = getUser(socket.id);

		io.to(room).emit('MESSAGE', generateMessage(username, message));

		callback();
	});

	socket.on('SEND_LOCATION', ({ latitude, longitude }, callback) => {
		const { room, username } = getUser(socket.id);

		io.to(room).emit(
			'LOCATION_MESSAGE',
			generateLocationMessage(
				username,
				`https://google.com/maps?q=${latitude},${longitude}`,
			),
		);

		callback();
	});

	socket.on('disconnect', () => {
		const user = removeUser(socket.id);

		if (user) {
			io.to(user.room).emit(
				'MESSAGE',
				generateMessage('Admin', `${user.username} left room.`),
			);

			io.to(user.room).emit('ROOM_DATA', {
				room: user.room,
				users: getUsersInRoom(user.room),
			});
		}
	});
});

module.exports = server;
