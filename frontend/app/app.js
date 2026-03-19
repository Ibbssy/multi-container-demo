const express = require('express');

const { PORT, STATIC_DIR } = require('./config');
const { registerRoutes } = require('./routes');

const createApp = (dependencies) => {
    const app = express();

    app.use(express.static(STATIC_DIR));
    app.use(express.urlencoded({ extended: true }));

    registerRoutes(app, dependencies);

    return app;
};

const startServer = (dependencies) => {
    const app = createApp(dependencies);

    return app.listen(PORT, () => {
        console.log(`Frontend server started on port ${PORT}`);
    });
};

if (require.main === module) {
    startServer();
}

module.exports = {
    createApp,
    startServer
};
