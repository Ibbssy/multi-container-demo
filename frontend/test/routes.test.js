const test = require('node:test');
const assert = require('node:assert/strict');

const { registerRoutes } = require('../app/routes');

const createPageRenderer = (page) => (payload) => JSON.stringify({ page, payload });

const createTestDependencies = (overrides = {}) => ({
    getAccess: async (username) => {
        const normalizedUsername = String(username || '').trim();

        if (!normalizedUsername) {
            return {
                username: '',
                superHeroName: 'User',
                heroCode: '',
                recognized: false
            };
        }

        return {
            username: normalizedUsername,
            superHeroName: 'IronMan',
            heroCode: 'SHELLHEAD',
            recognized: true
        };
    },
    fetchHeroes: async () => ([
        { username: 'tony', superHeroName: 'IronMan', heroCode: 'SHELLHEAD' },
        { username: 'diana', superHeroName: 'WonderWoman', heroCode: 'AMAZON' }
    ]),
    createDispatch: async (payload) => ({
        dispatchId: 'dispatch-123',
        status: 'CREATED',
        ...payload
    }),
    createHero: async (payload) => payload,
    updateHero: async (username, payload) => ({ username, ...payload }),
    deleteHero: async () => {},
    buildLoginPage: createPageRenderer('login'),
    buildDispatchPage: createPageRenderer('dispatch'),
    buildDatabasePage: createPageRenderer('database'),
    ...overrides
});

const createRegisteredRoutes = (dependencies) => {
    const routes = {
        GET: new Map(),
        POST: new Map()
    };
    const app = {
        get: (path, handler) => routes.GET.set(path, handler),
        post: (path, handler) => routes.POST.set(path, handler)
    };

    registerRoutes(app, dependencies);

    return routes;
};

const createResponse = () => {
    const response = {
        body: undefined,
        redirectedTo: undefined
    };

    response.send = (body) => {
        response.body = body;
        return response;
    };
    response.redirect = (location) => {
        response.redirectedTo = location;
        return response;
    };

    return response;
};

test('POST /login trims the username and redirects home', async () => {
    const routes = createRegisteredRoutes(createTestDependencies());
    const handler = routes.POST.get('/login');
    const response = createResponse();

    await handler({
        body: {
            username: '  tony  '
        }
    }, response);

    assert.equal(response.redirectedTo, '/?username=tony');
});

test('GET /dispatch renders an access denied state for unrecognized users', async () => {
    const routes = createRegisteredRoutes(createTestDependencies({
        getAccess: async (username) => ({
            username: String(username || '').trim(),
            superHeroName: 'User',
            heroCode: '',
            recognized: false
        })
    }));
    const handler = routes.GET.get('/dispatch');
    const response = createResponse();

    await handler({
        query: {
            username: 'unknown'
        }
    }, response);

    const body = JSON.parse(response.body);
    assert.equal(body.page, 'dispatch');
    assert.equal(body.payload.statusType, 'error');
    assert.match(body.payload.statusMessage, /Dispatch denied/);
});

test('POST /dispatch rejects invalid form input before calling the backend', async () => {
    let createDispatchCallCount = 0;
    const routes = createRegisteredRoutes(createTestDependencies({
        createDispatch: async () => {
            createDispatchCallCount += 1;
            return {};
        }
    }));
    const handler = routes.POST.get('/dispatch');
    const response = createResponse();

    await handler({
        body: {
            username: 'tony',
            heroCode: 'SHELLHEAD',
            severity: '9',
            latitude: '',
            longitude: ''
        }
    }, response);

    const body = JSON.parse(response.body);
    assert.equal(body.page, 'dispatch');
    assert.equal(body.payload.statusType, 'error');
    assert.match(body.payload.statusMessage, /Please provide a valid hero code/);
    assert.equal(createDispatchCallCount, 0);
});

test('POST /dispatch submits a valid dispatch and returns the payload', async () => {
    const routes = createRegisteredRoutes(createTestDependencies());
    const handler = routes.POST.get('/dispatch');
    const response = createResponse();

    await handler({
        body: {
            username: 'tony',
            heroCode: 'SHELLHEAD',
            severity: '3',
            latitude: '-37.810176',
            longitude: '144.962734'
        }
    }, response);

    const body = JSON.parse(response.body);
    assert.equal(body.page, 'dispatch');
    assert.equal(body.payload.statusType, 'success');
    assert.equal(body.payload.dispatchPayload.dispatchId, 'dispatch-123');
    assert.equal(body.payload.dispatchPayload.heroCode, 'SHELLHEAD');
});

test('POST /database/heroes redirects home when the active user deletes their own profile', async () => {
    const routes = createRegisteredRoutes(createTestDependencies());
    const handler = routes.POST.get('/database/heroes/:username/delete');
    const response = createResponse();

    await handler({
        params: {
            username: 'tony'
        },
        body: {
            username: 'tony',
            search: ''
        }
    }, response);

    assert.equal(
        response.redirectedTo,
        '/?statusMessage=Your+hero+profile+was+deleted.+Please+log+in+again.&statusType=success'
    );
});
