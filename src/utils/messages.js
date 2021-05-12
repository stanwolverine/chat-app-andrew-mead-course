const generateMessage = (username, text) => {
	return {
		username,
		message: text,
		createdAt: Date.now(),
	};
};

const generateLocationMessage = (username, text) => {
	return {
		username,
		url: text,
		createdAt: Date.now(),
	};
};

module.exports = {
	generateMessage,
	generateLocationMessage,
};
