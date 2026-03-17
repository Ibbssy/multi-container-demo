const express = require('express');
const axios = require('axios');
const app = express();

const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:8080'; // Docker Compose service name

app.use(express.static(__dirname));
app.use(express.urlencoded({extended:true})); // For form POST parsing

const isRecognizedHero = (heroName) => heroName && heroName !== 'User';

const escapeHtml = (value = '') => value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const buildPage = ({
    superHeroName = 'User',
    heroCode = '',
    username = '',
    statusMessage = '',
    statusType = 'success',
    dispatchPayload
} = {}) => {
    const safeSuperHeroName = escapeHtml(superHeroName);
    const safeHeroCode = escapeHtml(heroCode);
    const safeUsername = escapeHtml(username);

    const dispatchPanel = isRecognizedHero(superHeroName)
        ? `
        <div class="dispatch-panel">
          <h3>Dispatch Console</h3>
          <p class="dispatch-subtitle">Hero identified. Submit an emergency dispatch.</p>
          <form method="POST" action="/dispatch" class="dispatch-form">
            <input type="hidden" name="username" value="${safeUsername}" />
            <input type="hidden" name="superHeroName" value="${safeSuperHeroName}" />

            <label for="heroCode">Hero code:</label>
            <input
              type="text"
              name="heroCode"
              value="${safeHeroCode}"
              required
            />

            <label for="severity">Severity (1-5):</label>
            <input type="number" name="severity" min="1" max="5" value="1" required />

            <button type="submit">Submit Dispatch</button>
          </form>
        </div>`
        : '';

    const statusPanel = statusMessage
        ? `<div class="status ${escapeHtml(statusType)}">${escapeHtml(statusMessage)}</div>`
        : '';

    const dispatchDetails = dispatchPayload
        ? `
        <div class="dispatch-result">
          <strong>Latest Dispatch</strong>
          <p>ID: ${escapeHtml(dispatchPayload.dispatchId || '')}</p>
          <p>Status: ${escapeHtml(dispatchPayload.status || '')}</p>
          <p>Hero Code: ${escapeHtml(dispatchPayload.heroCode || '')}</p>
          <p>Severity: ${escapeHtml(String(dispatchPayload.severity ?? ''))}</p>
        </div>`
        : '';

    return `
    <html>
    <head>
      <link rel="stylesheet" type="text/css" href="style.css">
    </head>
    <body>
      <div class="logo-wrapper">
        <a href="/" class="logo-link" aria-label="Go to SDN home page">
          <img src="assets/sdn_logo.png" alt="SDN logo" class="logo" />
        </a>
      </div>
      <div class="container">
        <div>
          <h2>Hello Welcome to Superhero Dispatch Network ${safeSuperHeroName}</h2>
        </div>
        <div class="form-container">
          <form method="POST" action="/">
            <label for="username">Enter username:</label>
            <input type="text" name="username" value="${safeUsername}"/>
            <button type="submit">Submit</button>
          </form>
        </div>

        ${statusPanel}
        ${dispatchPanel}
        ${dispatchDetails}
      </div>
    </body>
    </html>`;
};

app.get('/', (req, res) => {
res.send(buildPage());
});

app.post('/', async (req, res) => {
    const username = req.body.username || '';
    console.log(`Received POST request with username: ${username}`);
    let superHeroName = 'User';
    let heroCode = '';
    try {
        console.log(`Calling backend API for username: ${username}`);
        const result = await axios.get(`${BACKEND_URL}/superhero`, {
            params: { username }
        });
        superHeroName = result.data.superHeroName || 'User';
        heroCode = result.data.heroCode || '';
        console.log(`Received super hero name: ${superHeroName} for username: ${username}`);
    } catch (error) {
        console.error(`Error calling backend for username ${username}:`, error.message);
        // fallback to 'User'
    }

    res.send(buildPage({
        superHeroName,
        heroCode,
        username,
        statusMessage: isRecognizedHero(superHeroName)
            ? 'Hero recognized. Dispatch menu unlocked.'
            : 'No recognized hero for that username yet.'
    }));
});

app.post('/dispatch', async (req, res) => {
    const username = req.body.username || '';
    const superHeroName = req.body.superHeroName || 'User';
    const heroCode = req.body.heroCode || '';
    const severity = Number.parseInt(req.body.severity, 10);

    if (!isRecognizedHero(superHeroName)) {
        return res.send(buildPage({
            superHeroName,
            heroCode,
            username,
            statusType: 'error',
            statusMessage: 'Dispatch denied. Please enter a recognized username first.'
        }));
    }

    if (!heroCode || Number.isNaN(severity) || severity < 1) {
        return res.send(buildPage({
            superHeroName,
            heroCode,
            username,
            statusType: 'error',
            statusMessage: 'Please provide a valid hero code and severity (minimum 1).'
        }));
    }

    try {
        const result = await axios.post(`${BACKEND_URL}/dispatches`, {
            heroCode,
            severity
        });

        return res.send(buildPage({
            superHeroName,
            heroCode,
            username,
            statusType: 'success',
            statusMessage: 'Dispatch created successfully.',
            dispatchPayload: result.data
        }));
    } catch (error) {
        const backendMessage = error.response?.data?.message;
        const fallbackMessage = `Dispatch request failed${backendMessage ? `: ${backendMessage}` : '.'}`;
        console.error('Error creating dispatch:', error.message);

        return res.send(buildPage({
            superHeroName,
            heroCode,
            username,
            statusType: 'error',
            statusMessage: fallbackMessage
        }));
    }
});

const port = 6160;
app.listen(port, () => {
    console.log(`Frontend server started on port ${port}`);
});
