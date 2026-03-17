const axios = require('axios');

const { BACKEND_URL } = require('../config');

const client = axios.create({
    baseURL: BACKEND_URL
});

const lookupHero = async (username) => {
    const result = await client.get('/superhero', {
        params: { username }
    });
    return result.data;
};

const fetchHeroes = async (search = '') => {
    const result = await client.get('/heroes', {
        params: search ? { search } : undefined
    });
    return Array.isArray(result.data) ? result.data : [];
};

const createHero = async (payload) => {
    const result = await client.post('/heroes', payload);
    return result.data;
};

const updateHero = async (username, payload) => {
    const result = await client.put(`/heroes/${encodeURIComponent(username)}`, payload);
    return result.data;
};

const deleteHero = async (username) => {
    await client.delete(`/heroes/${encodeURIComponent(username)}`);
};

const createDispatch = async (payload) => {
    const result = await client.post('/dispatches', payload);
    return result.data;
};

module.exports = {
    createDispatch,
    createHero,
    deleteHero,
    fetchHeroes,
    lookupHero,
    updateHero
};
