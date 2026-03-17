const express = require('express');

const { PORT, STATIC_DIR } = require('./config');
const { registerRoutes } = require('./routes');

const app = express();

app.use(express.static(STATIC_DIR));
app.use(express.urlencoded({ extended: true }));

registerRoutes(app);

app.listen(PORT, () => {
    console.log(`Frontend server started on port ${PORT}`);
});
