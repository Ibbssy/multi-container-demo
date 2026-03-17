const { createDispatch, createHero, deleteHero, fetchHeroes, updateHero } = require('./services/apiClient');
const { getAccess } = require('./services/accessService');
const { normalizeInput } = require('./utils/html');
const { buildPathWithQuery } = require('./utils/url');
const { buildDatabasePage, buildDispatchPage, buildLoginPage } = require('./views/pages');

const resolveDatabaseState = async (access, search, editUsername) => {
    if (!access.recognized) {
        return {
            heroes: [],
            editingHero: null
        };
    }

    const heroes = await fetchHeroes(search);
    let editingHero = null;

    if (editUsername) {
        editingHero = heroes.find((hero) => hero.username === editUsername) || null;

        if (!editingHero) {
            const allHeroes = await fetchHeroes('');
            editingHero = allHeroes.find((hero) => hero.username === editUsername) || null;
        }
    }

    return { heroes, editingHero };
};

// Database mutations should still render a usable page even if the roster reload fails afterwards.
const safeResolveDatabaseState = async (access, search, editUsername) => {
    try {
        return await resolveDatabaseState(access, search, editUsername);
    } catch (error) {
        console.error('Error loading hero database state:', error.message);
        return {
            heroes: [],
            editingHero: null
        };
    }
};

const buildHeroRequest = (body) => ({
    username: normalizeInput(body.heroUsername),
    superHeroName: normalizeInput(body.superHeroName),
    heroCode: normalizeInput(body.heroCode)
});

const formatBackendError = (error, fallbackMessage) => (
    error.response?.data?.message || fallbackMessage
);

const registerRoutes = (app) => {
    app.get('/', async (req, res) => {
        const access = await getAccess(req.query.username);
        const statusMessage = access.username
            ? access.recognized
                ? 'Hero recognized. Dispatch and database access unlocked.'
                : 'Greeting delivered. Access remains locked for unrecognized usernames.'
            : '';

        res.send(buildLoginPage({
            access,
            statusMessage,
            statusType: access.username && !access.recognized ? 'error' : 'success'
        }));
    });

    app.post('/login', async (req, res) => {
        const username = normalizeInput(req.body.username);
        res.redirect(buildPathWithQuery('/', { username }));
    });

    app.get('/dispatch', async (req, res) => {
        const access = await getAccess(req.query.username);
        const statusMessage = access.recognized
            ? ''
            : access.username
                ? 'Dispatch denied. Please log in with a recognized hero username first.'
                : 'Enter a valid hero username on the login page to unlock dispatch.';

        res.send(buildDispatchPage({
            access,
            statusMessage,
            statusType: 'error'
        }));
    });

    app.post('/dispatch', async (req, res) => {
        const access = await getAccess(req.body.username);
        const heroCode = normalizeInput(req.body.heroCode);
        const severity = Number.parseInt(req.body.severity, 10);

        if (!access.recognized) {
            return res.send(buildDispatchPage({
                access,
                statusMessage: 'Dispatch denied. Please enter a recognized username first.',
                statusType: 'error'
            }));
        }

        if (!heroCode || Number.isNaN(severity) || severity < 1 || severity > 5) {
            return res.send(buildDispatchPage({
                access: {
                    ...access,
                    heroCode: heroCode || access.heroCode
                },
                statusMessage: 'Please provide a valid hero code and severity between 1 and 5.',
                statusType: 'error'
            }));
        }

        try {
            const dispatchPayload = await createDispatch({
                heroCode,
                severity
            });

            return res.send(buildDispatchPage({
                access: {
                    ...access,
                    heroCode
                },
                statusMessage: 'Dispatch created successfully.',
                statusType: 'success',
                dispatchPayload
            }));
        } catch (error) {
            console.error('Error creating dispatch:', error.message);

            return res.send(buildDispatchPage({
                access: {
                    ...access,
                    heroCode
                },
                statusMessage: formatBackendError(error, 'Dispatch request failed.'),
                statusType: 'error'
            }));
        }
    });

    app.get('/database', async (req, res) => {
        const access = await getAccess(req.query.username);
        const search = normalizeInput(req.query.search);
        const editUsername = normalizeInput(req.query.edit);

        try {
            const { heroes, editingHero } = await resolveDatabaseState(access, search, editUsername);

            return res.send(buildDatabasePage({
                access,
                heroes,
                search,
                editingUsername: editUsername,
                editingHero,
                statusMessage: !access.recognized
                    ? (access.username
                        ? 'Database access denied. Please use a recognized hero username.'
                        : 'Enter a valid hero username on the login page to access the database.')
                    : '',
                statusType: 'error'
            }));
        } catch (error) {
            console.error('Error loading database page:', error.message);

            return res.send(buildDatabasePage({
                access,
                heroes: [],
                search,
                editingUsername: editUsername,
                editingHero: null,
                statusMessage: 'Unable to load the hero database right now.',
                statusType: 'error'
            }));
        }
    });

    app.post('/database/heroes', async (req, res) => {
        const access = await getAccess(req.body.username);
        const search = normalizeInput(req.body.search);
        const heroRequest = buildHeroRequest(req.body);

        if (!access.recognized) {
            return res.send(buildDatabasePage({
                access,
                heroes: [],
                search,
                formValues: heroRequest,
                statusMessage: 'Database access denied. Please enter a recognized username first.',
                statusType: 'error'
            }));
        }

        try {
            await createHero(heroRequest);
            const { heroes } = await safeResolveDatabaseState(access, search, '');

            return res.send(buildDatabasePage({
                access,
                heroes,
                search,
                statusMessage: 'Hero created successfully.',
                statusType: 'success'
            }));
        } catch (error) {
            console.error('Error creating hero:', error.message);
            const { heroes } = await safeResolveDatabaseState(access, search, '');

            return res.send(buildDatabasePage({
                access,
                heroes,
                search,
                formValues: heroRequest,
                statusMessage: formatBackendError(error, 'Unable to create hero.'),
                statusType: 'error'
            }));
        }
    });

    app.post('/database/heroes/:username/update', async (req, res) => {
        const access = await getAccess(req.body.username);
        const search = normalizeInput(req.body.search);
        const existingUsername = req.params.username;
        const heroRequest = buildHeroRequest(req.body);

        if (!access.recognized) {
            return res.send(buildDatabasePage({
                access,
                heroes: [],
                search,
                editingUsername: existingUsername,
                editingHero: null,
                formValues: heroRequest,
                statusMessage: 'Database access denied. Please enter a recognized username first.',
                statusType: 'error'
            }));
        }

        try {
            await updateHero(existingUsername, heroRequest);
            const nextEditingUsername = heroRequest.username;
            const { heroes, editingHero } = await safeResolveDatabaseState(access, search, nextEditingUsername);

            return res.send(buildDatabasePage({
                access,
                heroes,
                search,
                editingUsername: nextEditingUsername,
                editingHero,
                statusMessage: 'Hero updated successfully.',
                statusType: 'success'
            }));
        } catch (error) {
            console.error('Error updating hero:', error.message);
            const { heroes, editingHero } = await safeResolveDatabaseState(access, search, existingUsername);

            return res.send(buildDatabasePage({
                access,
                heroes,
                search,
                editingUsername: existingUsername,
                editingHero,
                formValues: heroRequest,
                statusMessage: formatBackendError(error, 'Unable to update hero.'),
                statusType: 'error'
            }));
        }
    });

    app.post('/database/heroes/:username/delete', async (req, res) => {
        const access = await getAccess(req.body.username);
        const search = normalizeInput(req.body.search);
        const existingUsername = req.params.username;

        if (!access.recognized) {
            return res.send(buildDatabasePage({
                access,
                heroes: [],
                search,
                statusMessage: 'Database access denied. Please enter a recognized username first.',
                statusType: 'error'
            }));
        }

        try {
            await deleteHero(existingUsername);
            const { heroes } = await safeResolveDatabaseState(access, search, '');

            return res.send(buildDatabasePage({
                access,
                heroes,
                search,
                statusMessage: 'Hero deleted successfully.',
                statusType: 'success'
            }));
        } catch (error) {
            console.error('Error deleting hero:', error.message);
            const { heroes } = await safeResolveDatabaseState(access, search, '');

            return res.send(buildDatabasePage({
                access,
                heroes,
                search,
                statusMessage: formatBackendError(error, 'Unable to delete hero.'),
                statusType: 'error'
            }));
        }
    });
};

module.exports = {
    registerRoutes
};
