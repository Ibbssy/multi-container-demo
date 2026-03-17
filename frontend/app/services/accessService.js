const { DEFAULT_SUPER_HERO_NAME } = require('../config');
const { lookupHero } = require('./apiClient');
const { isRecognizedHero, normalizeInput } = require('../utils/html');

const getAccess = async (username) => {
    const trimmedUsername = normalizeInput(username);

    if (!trimmedUsername) {
        return {
            username: '',
            superHeroName: DEFAULT_SUPER_HERO_NAME,
            heroCode: '',
            recognized: false
        };
    }

    try {
        const hero = await lookupHero(trimmedUsername);
        const superHeroName = hero.superHeroName || DEFAULT_SUPER_HERO_NAME;
        const heroCode = hero.heroCode || '';

        return {
            username: trimmedUsername,
            superHeroName,
            heroCode,
            recognized: isRecognizedHero(superHeroName)
        };
    } catch (error) {
        console.error(`Hero lookup failed for username ${trimmedUsername}:`, error.message);

        return {
            username: trimmedUsername,
            superHeroName: DEFAULT_SUPER_HERO_NAME,
            heroCode: '',
            recognized: false
        };
    }
};

module.exports = {
    getAccess
};
