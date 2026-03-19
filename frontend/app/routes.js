const { createDispatch, createHero, deleteHero, fetchHeroes, updateHero } = require('./services/apiClient');
const { getAccess } = require('./services/accessService');
const { normalizeInput } = require('./utils/html');
const { buildPathWithQuery } = require('./utils/url');
const { buildDatabasePage, buildDispatchPage, buildLoginPage } = require('./views/pages');

const normalizeStatusType = (value) => (value === 'error' ? 'error' : 'success');

const formatBackendError = (error, fallbackMessage) => (
    error.response?.data?.message || fallbackMessage
);

const buildSelectedLocation = (latitude, longitude) => (
    latitude !== null && longitude !== null
        ? { latitude, longitude }
        : null
);

const createRouteHelpers = ({ fetchHeroes: fetchHeroesRequest, normalizeInput: normalizeInputValue, buildPathWithQuery: buildPath }) => {
    const buildHeroRequest = (body) => ({
        username: normalizeInputValue(body.heroUsername),
        superHeroName: normalizeInputValue(body.superHeroName),
        heroCode: normalizeInputValue(body.heroCode)
    });

    const parseCoordinate = (value) => {
        const normalizedValue = normalizeInputValue(value);

        if (!normalizedValue) {
            return null;
        }

        const coordinate = Number.parseFloat(normalizedValue);
        return Number.isFinite(coordinate) ? coordinate : null;
    };

    const resolveDispatchHeroCodes = async () => {
        const heroes = await fetchHeroesRequest('');
        return [...new Set(heroes
            .map((hero) => normalizeInputValue(hero.heroCode))
            .filter(Boolean))]
            .sort((left, right) => left.localeCompare(right));
    };

    const resolveDatabaseState = async (access, search, editUsername) => {
        if (!access.recognized) {
            return {
                heroes: [],
                editingHero: null
            };
        }

        const heroes = await fetchHeroesRequest(search);
        let editingHero = null;

        if (editUsername) {
            editingHero = heroes.find((hero) => hero.username === editUsername) || null;

            if (!editingHero) {
                const allHeroes = await fetchHeroesRequest('');
                editingHero = allHeroes.find((hero) => hero.username === editUsername) || null;
            }
        }

        return { heroes, editingHero };
    };

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

    const buildDatabaseRedirect = ({ username, search, edit, statusMessage, statusType, anchor }) => {
        const path = buildPath('/database', {
            username,
            search,
            edit,
            statusMessage,
            statusType: normalizeStatusType(statusType)
        });

        return anchor ? `${path}#${anchor}` : path;
    };

    const buildHomeRedirect = ({ username, statusMessage, statusType }) => (
        buildPath('/', {
            username,
            statusMessage,
            statusType: normalizeStatusType(statusType)
        })
    );

    return {
        buildDatabaseRedirect,
        buildHeroRequest,
        buildHomeRedirect,
        parseCoordinate,
        resolveDispatchHeroCodes,
        resolveDatabaseState,
        safeResolveDatabaseState
    };
};

const registerRoutes = (app, dependencies = {}) => {
    const routeDependencies = {
        createDispatch,
        createHero,
        deleteHero,
        fetchHeroes,
        updateHero,
        getAccess,
        normalizeInput,
        buildPathWithQuery,
        buildDatabasePage,
        buildDispatchPage,
        buildLoginPage,
        ...dependencies
    };
    const {
        createDispatch: createDispatchRequest,
        createHero: createHeroRequest,
        deleteHero: deleteHeroRequest,
        fetchHeroes: fetchHeroesRequest,
        updateHero: updateHeroRequest,
        getAccess: getAccessRequest,
        normalizeInput: normalizeInputValue,
        buildPathWithQuery: buildPathWithQueryValue,
        buildDatabasePage: buildDatabasePageValue,
        buildDispatchPage: buildDispatchPageValue,
        buildLoginPage: buildLoginPageValue
    } = routeDependencies;
    const {
        buildDatabaseRedirect,
        buildHeroRequest,
        buildHomeRedirect,
        parseCoordinate,
        resolveDispatchHeroCodes,
        resolveDatabaseState,
        safeResolveDatabaseState
    } = createRouteHelpers({
        fetchHeroes: fetchHeroesRequest,
        normalizeInput: normalizeInputValue,
        buildPathWithQuery: buildPathWithQueryValue
    });

    app.get('/', async (req, res) => {
        const access = await getAccessRequest(req.query.username);
        const requestStatusMessage = normalizeInputValue(req.query.statusMessage);
        const statusMessage = requestStatusMessage || (access.username
            ? access.recognized
                ? 'Hero recognized. Dispatch and database access unlocked.'
                : 'Unrecognised username. Access remains locked.'
            : '');

        res.send(buildLoginPageValue({
            access,
            statusMessage,
            statusType: requestStatusMessage
                ? normalizeStatusType(req.query.statusType)
                : access.username && !access.recognized ? 'error' : 'success'
        }));
    });

    app.post('/login', async (req, res) => {
        const username = normalizeInputValue(req.body.username);
        res.redirect(buildPathWithQueryValue('/', { username }));
    });

    app.get('/dispatch', async (req, res) => {
        const access = await getAccessRequest(req.query.username);
        const statusMessage = access.recognized
            ? ''
            : access.username
                ? 'Dispatch denied. Please log in with a recognized hero username first.'
                : 'Enter a valid hero username on the login page to unlock dispatch.';

        if (!access.recognized) {
            return res.send(buildDispatchPageValue({
                access,
                statusMessage,
                statusType: 'error'
            }));
        }

        try {
            const heroCodes = await resolveDispatchHeroCodes();
            const selectedHeroCode = heroCodes.includes(access.heroCode)
                ? access.heroCode
                : heroCodes[0] || '';

            return res.send(buildDispatchPageValue({
                access: {
                    ...access,
                    heroCode: selectedHeroCode
                },
                heroCodes,
                selectedHeroCode,
                statusMessage: heroCodes.length ? '' : 'No hero codes are currently available for dispatch.',
                statusType: heroCodes.length ? 'success' : 'error'
            }));
        } catch (error) {
            console.error('Error loading dispatch options:', error.message);

            return res.send(buildDispatchPageValue({
                access,
                heroCodes: [],
                selectedHeroCode: '',
                statusMessage: 'Unable to load hero codes for dispatch right now.',
                statusType: 'error'
            }));
        }
    });

    app.post('/dispatch', async (req, res) => {
        const access = await getAccessRequest(req.body.username);
        const heroCode = normalizeInputValue(req.body.heroCode);
        const severity = Number.parseInt(req.body.severity, 10);
        const latitude = parseCoordinate(req.body.latitude);
        const longitude = parseCoordinate(req.body.longitude);
        const selectedLocation = buildSelectedLocation(latitude, longitude);

        if (!access.recognized) {
            return res.send(buildDispatchPageValue({
                access,
                statusMessage: 'Dispatch denied. Please enter a recognized username first.',
                statusType: 'error'
            }));
        }

        let heroCodes = [];

        try {
            heroCodes = await resolveDispatchHeroCodes();
        } catch (error) {
            console.error('Error loading dispatch options:', error.message);

            return res.send(buildDispatchPageValue({
                access,
                heroCodes: [],
                selectedHeroCode: '',
                statusMessage: 'Unable to load hero codes for dispatch right now.',
                statusType: 'error'
            }));
        }

        const selectedHeroCode = heroCodes.includes(heroCode)
            ? heroCode
            : heroCodes.includes(access.heroCode)
                ? access.heroCode
                : heroCodes[0] || '';

        if (!heroCodes.length) {
            return res.send(buildDispatchPageValue({
                access: {
                    ...access,
                    heroCode: ''
                },
                heroCodes,
                selectedHeroCode: '',
                selectedLocation,
                statusMessage: 'No hero codes are currently available for dispatch.',
                statusType: 'error'
            }));
        }

        const hasValidLocation = latitude !== null
            && longitude !== null
            && latitude >= -90 && latitude <= 90
            && longitude >= -180 && longitude <= 180;

        if (!heroCode || !heroCodes.includes(heroCode) || Number.isNaN(severity) || severity < 1 || severity > 5 || !hasValidLocation) {
            return res.send(buildDispatchPageValue({
                access: {
                    ...access,
                    heroCode: selectedHeroCode
                },
                heroCodes,
                selectedHeroCode,
                selectedLocation,
                statusMessage: 'Please provide a valid hero code, map location, and severity between 1 and 5.',
                statusType: 'error'
            }));
        }

        try {
            const dispatchPayload = await createDispatchRequest({
                heroCode,
                severity,
                latitude,
                longitude
            });

            return res.send(buildDispatchPageValue({
                access: {
                    ...access,
                    heroCode
                },
                heroCodes,
                selectedHeroCode: heroCode,
                selectedLocation,
                statusMessage: 'Dispatch created successfully.',
                statusType: 'success',
                dispatchPayload
            }));
        } catch (error) {
            console.error('Error creating dispatch:', error.message);

            return res.send(buildDispatchPageValue({
                access: {
                    ...access,
                    heroCode
                },
                heroCodes,
                selectedHeroCode: heroCode,
                selectedLocation,
                statusMessage: formatBackendError(error, 'Dispatch request failed.'),
                statusType: 'error'
            }));
        }
    });

    app.get('/database', async (req, res) => {
        const access = await getAccessRequest(req.query.username);
        const search = normalizeInputValue(req.query.search);
        const editUsername = normalizeInputValue(req.query.edit);
        const requestStatusMessage = normalizeInputValue(req.query.statusMessage);

        try {
            const { heroes, editingHero } = await resolveDatabaseState(access, search, editUsername);
            const statusMessage = requestStatusMessage || (!access.recognized
                ? (access.username
                    ? 'Database access denied. Please use a recognised hero username.'
                    : 'Enter a valid hero username on the login page to access the database.')
                : '');

            return res.send(buildDatabasePageValue({
                access,
                heroes,
                search,
                editingUsername: editUsername,
                editingHero,
                statusMessage,
                statusType: requestStatusMessage
                    ? normalizeStatusType(req.query.statusType)
                    : 'error'
            }));
        } catch (error) {
            console.error('Error loading database page:', error.message);

            return res.send(buildDatabasePageValue({
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
        const access = await getAccessRequest(req.body.username);
        const search = normalizeInputValue(req.body.search);
        const heroRequest = buildHeroRequest(req.body);

        if (!access.recognized) {
            return res.send(buildDatabasePageValue({
                access,
                heroes: [],
                search,
                formValues: heroRequest,
                statusMessage: 'Database access denied. Please enter a recognised username first.',
                statusType: 'error'
            }));
        }

        try {
            await createHeroRequest(heroRequest);
            return res.redirect(buildDatabaseRedirect({
                username: access.username,
                search,
                statusMessage: 'Hero created successfully.',
                statusType: 'success'
            }));
        } catch (error) {
            console.error('Error creating hero:', error.message);
            const { heroes } = await safeResolveDatabaseState(access, search, '');

            return res.send(buildDatabasePageValue({
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
        const access = await getAccessRequest(req.body.username);
        const search = normalizeInputValue(req.body.search);
        const existingUsername = req.params.username;
        const heroRequest = buildHeroRequest(req.body);

        if (!access.recognized) {
            return res.send(buildDatabasePageValue({
                access,
                heroes: [],
                search,
                editingUsername: existingUsername,
                editingHero: null,
                formValues: heroRequest,
                statusMessage: 'Database access denied. Please enter a recognised username first.',
                statusType: 'error'
            }));
        }

        try {
            await updateHeroRequest(existingUsername, heroRequest);
            const nextUsername = existingUsername === access.username
                ? heroRequest.username
                : access.username;

            return res.redirect(buildDatabaseRedirect({
                username: nextUsername,
                search,
                statusMessage: 'Hero updated successfully.',
                statusType: 'success'
            }));
        } catch (error) {
            console.error('Error updating hero:', error.message);
            const { heroes, editingHero } = await safeResolveDatabaseState(access, search, existingUsername);

            return res.send(buildDatabasePageValue({
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
        const access = await getAccessRequest(req.body.username);
        const search = normalizeInputValue(req.body.search);
        const existingUsername = req.params.username;

        if (!access.recognized) {
            return res.send(buildDatabasePageValue({
                access,
                heroes: [],
                search,
                statusMessage: 'Database access denied. Please enter a recognised username first.',
                statusType: 'error'
            }));
        }

        try {
            await deleteHeroRequest(existingUsername);
            if (existingUsername === access.username) {
                return res.redirect(buildHomeRedirect({
                    statusMessage: 'Your hero profile was deleted. Please log in again.',
                    statusType: 'success'
                }));
            }

            return res.redirect(buildDatabaseRedirect({
                username: access.username,
                search,
                statusMessage: 'Hero deleted successfully.',
                statusType: 'success'
            }));
        } catch (error) {
            console.error('Error deleting hero:', error.message);
            const { heroes } = await safeResolveDatabaseState(access, search, '');

            return res.send(buildDatabasePageValue({
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
