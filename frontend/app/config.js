const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

module.exports = {
    BACKEND_URL: process.env.BACKEND_URL || 'http://backend:8080',
    DEFAULT_SUPER_HERO_NAME: 'User',
    PORT: 6160,
    ROOT_DIR,
    STATIC_DIR: ROOT_DIR
};
