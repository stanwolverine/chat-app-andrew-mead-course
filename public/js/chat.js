// Elements
const $sidebar = document.querySelector('#sidebar');
const $sendMessageForm = document.querySelector('#form');
const $sendMessageFormInput = $sendMessageForm.querySelector('#messageInput');
const $sendMessageFormButton = $sendMessageForm.querySelector('#messageButton');
const $sendLocationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const urlTemplate = document.querySelector('#url-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// Options
const { username, room } = Qs.parse(location.search, {
	ignoreQueryPrefix: true,
});

const socket = io();

socket.emit('JOIN', { username, room }, (error) => {
	if (error) {
		alert(error);
		location.href = '/';
		return;
	}

	console.log('Joined');
});

socket.on('ROOM_DATA', ({ room, users }) => {
	const html = Mustache.render(sidebarTemplate, { room, users });

	$sidebar.innerHTML = html;
});

const autoScroll = () => {
	// New Message element
	const $newMessage = $messages.lastElementChild;

	// Height of the new message
	const newMessageStyles = getComputedStyle($newMessage);
	const newMessageMargin = parseInt(newMessageStyles.marginBottom, 10);
	const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

	// Visible Height
	const visibleHeight = $messages.offsetHeight;

	// Height of visible container
	const containerHeight = $messages.scrollHeight;

	// How far have I scrolled?
	const scrollOffset = $messages.scrollTop + visibleHeight;

	if (containerHeight - newMessageHeight <= scrollOffset) {
		$messages.scrollTop = containerHeight;
	}
};

socket.on('MESSAGE', ({ username, message, createdAt }) => {
	const html = Mustache.render(messageTemplate, {
		username,
		message,
		createdAt: moment(createdAt).format('h:mm a'),
	});

	$messages.insertAdjacentHTML('beforeend', html);

	autoScroll();
});

socket.on('LOCATION_MESSAGE', ({ username, url, createdAt }) => {
	const html = Mustache.render(urlTemplate, {
		username,
		url,
		createdAt: moment(createdAt).format('h:mm a'),
	});

	$messages.insertAdjacentHTML('beforeend', html);

	autoScroll();
});

$sendMessageForm.addEventListener('submit', (event) => {
	event.preventDefault();

	const input = $sendMessageFormInput;

	if (input.value.length > 0) {
		$sendMessageFormButton.setAttribute('disabled', 'true');

		socket.emit('SEND_MESSAGE', { message: input.value }, (error) => {
			$sendMessageFormButton.removeAttribute('disabled');

			input.focus();

			if (error) {
				return console.log(error);
			}

			console.log('Message delivered');
		});

		input.value = '';
	}
});

$sendLocationButton.addEventListener('click', () => {
	$sendLocationButton.setAttribute('disabled', 'true');

	if (!navigator.geolocation) {
		return alert('Gelocation is not supported by your browser');
	}

	navigator.geolocation.getCurrentPosition((position) => {
		socket.emit(
			'SEND_LOCATION',
			{
				latitude: position.coords.latitude,
				longitude: position.coords.longitude,
			},
			(error) => {
				$sendLocationButton.removeAttribute('disabled');

				if (error) {
					return console.log(error);
				}

				console.log('Location shared');
			},
		);
	});
});
