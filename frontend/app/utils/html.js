const { DEFAULT_SUPER_HERO_NAME } = require('../config');

const escapeHtml = (value = '') => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const normalizeInput = (value = '') => String(value).trim();

const isRecognizedHero = (heroName) => heroName && heroName !== DEFAULT_SUPER_HERO_NAME;

module.exports = {
    escapeHtml,
    normalizeInput,
    isRecognizedHero
};
