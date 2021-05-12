const app = require('./app');
const { PORT } = require('./config');

app.listen(PORT, () => console.info('Server listening on port: ', PORT));
