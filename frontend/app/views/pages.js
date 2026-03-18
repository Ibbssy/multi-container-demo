const { escapeHtml } = require('../utils/html');
const { buildPathWithQuery, encodePathSegment } = require('../utils/url');
const {
    buildLayout,
    createAccessDeniedMarkup,
    createGreetingCard,
    createStatusMarkup
} = require('./layout');

const buildLoginPage = ({ access, statusMessage, statusType = 'success' }) => {
    const unlockedContent = access.recognized
        ? `
          <section class="panel access-panel">
            <h3>Mission Control Access</h3>
            <p class="panel-subtitle">Your hero profile has been verified. Access to SDN services granted.</p>
            <div class="card-link-grid">
              <a class="feature-card" href="${buildPathWithQuery('/dispatch', { username: access.username })}">
                <strong>Dispatch</strong>
                <span>Open the emergency dispatch console.</span>
              </a>
              <a class="feature-card" href="${buildPathWithQuery('/database', { username: access.username })}">
                <strong>Hero Database</strong>
                <span>Review and manage the registered hero roster.</span>
              </a>
            </div>
          </section>
        `
        : `
          <section class="panel access-panel locked-panel">
            <h3>Unrecognised user</h3>
            <p class="panel-subtitle">Access to SDN services are only available to SDN registered heroes.</p>
          </section>
        `;

    const introStatusMessage = statusMessage || (!access.username
        ? 'Enter a username to continue.'
        : undefined);
    const introStatusType = statusMessage ? statusType : 'success';

    return buildLayout({
        pageTitle: 'Superhero Dispatch Network',
        activePage: 'login',
        access,
        content: `
          <div class="page-grid login-grid">
            <section class="panel login-panel">
              <div class="panel-heading">
                <h2>Hero Login</h2>
                <p class="panel-subtitle">Enter a registered hero username to access SDN services.</p>
              </div>
              <form method="POST" action="/login" class="stack-form">
                <label for="username">Enter username:</label>
                <input id="username" type="text" name="username" value="${escapeHtml(access.username)}" required />
                <button type="submit">Enter Network</button>
              </form>
              ${createStatusMarkup(introStatusMessage, introStatusType)}
            </section>
            ${createGreetingCard({
                access,
                subtitle: access.recognized
                    ? 'Hero recognised. Access to SDN services granted.'
                    : 'Unknown user, please redirect to SDN Subscription App.',
                statusMessage: '',
                statusType
            })}
            ${unlockedContent}
          </div>
        `
    });
};

const buildDispatchHeroCodeOptions = (heroCodes, selectedHeroCode) => {
    if (!heroCodes.length) {
        return '<option value="">No hero codes available</option>';
    }

    return heroCodes.map((heroCode) => {
        const selectedAttribute = heroCode === selectedHeroCode ? ' selected' : '';
        return `<option value="${escapeHtml(heroCode)}"${selectedAttribute}>${escapeHtml(heroCode)}</option>`;
    }).join('');
};

const buildDispatchPage = ({
    access,
    heroCodes = [],
    selectedHeroCode = '',
    selectedLocation = null,
    statusMessage,
    statusType = 'success',
    dispatchPayload
}) => {
    const hasSelectedLocation = Boolean(
        selectedLocation
        && Number.isFinite(selectedLocation.latitude)
        && Number.isFinite(selectedLocation.longitude)
    );
    const latestDispatchLocation = dispatchPayload
        && dispatchPayload.latitude !== undefined
        && dispatchPayload.longitude !== undefined
        ? {
            latitude: Number(dispatchPayload.latitude),
            longitude: Number(dispatchPayload.longitude)
        }
        : selectedLocation;
    const hiddenLatitudeValue = hasSelectedLocation ? String(selectedLocation.latitude) : '';
    const hiddenLongitudeValue = hasSelectedLocation ? String(selectedLocation.longitude) : '';
    const locationSummary = hasSelectedLocation
        ? `${selectedLocation.latitude.toFixed(6)}, ${selectedLocation.longitude.toFixed(6)}`
        : 'No location selected yet.';
    const dispatchConsoleMarkup = access.recognized
        ? `
          <section class="panel dispatch-panel dispatch-console-panel">
            <h3>Dispatch Console</h3>
            <p class="dispatch-subtitle">Hero identified. Submit an emergency dispatch.</p>
            <form method="POST" action="/dispatch" class="stack-form">
              <input type="hidden" name="username" value="${escapeHtml(access.username)}" />

              <label for="heroCode">Hero code:</label>
              <select id="heroCode" name="heroCode" ${heroCodes.length ? '' : 'disabled'} required>
                ${buildDispatchHeroCodeOptions(heroCodes, selectedHeroCode)}
              </select>

              <label for="severity">Severity (1-5):</label>
              <input id="severity" type="number" name="severity" min="1" max="5" value="1" required />

              <div class="dispatch-map-panel">
                <label for="dispatch-map">Emergency location:</label>
                <p class="map-helper">Click the map to place the dispatch marker, then drag it to fine-tune the exact location.</p>
                <div
                  id="dispatch-map"
                  class="dispatch-map"
                  data-default-lat="-37.810176"
                  data-default-lng="144.962734"
                  data-selected-lat="${escapeHtml(hiddenLatitudeValue)}"
                  data-selected-lng="${escapeHtml(hiddenLongitudeValue)}"
                ></div>
                <p class="map-readout">Selected coordinates: <strong id="dispatch-location-readout">${escapeHtml(locationSummary)}</strong></p>
                <input id="dispatchLatitude" type="hidden" name="latitude" value="${escapeHtml(hiddenLatitudeValue)}" />
                <input id="dispatchLongitude" type="hidden" name="longitude" value="${escapeHtml(hiddenLongitudeValue)}" />
                <noscript>
                  <p class="status error">JavaScript is required to choose a dispatch location on the map.</p>
                </noscript>
              </div>

              <button type="submit" ${heroCodes.length ? '' : 'disabled'}>Submit Dispatch</button>
            </form>
            ${createStatusMarkup(statusMessage, statusType)}
          </section>
        `
        : createAccessDeniedMarkup(access.username);
    const latestDispatchMarkup = dispatchPayload
        ? `
          <section class="panel dispatch-result dispatch-result-panel">
            <h3>Latest Dispatch</h3>
            <p><strong>ID:</strong> ${escapeHtml(dispatchPayload.dispatchId || '')}</p>
            <p><strong>Status:</strong> ${escapeHtml(dispatchPayload.status || '')}</p>
            <p><strong>Hero Code:</strong> ${escapeHtml(dispatchPayload.heroCode || '')}</p>
            <p><strong>Severity:</strong> ${escapeHtml(String(dispatchPayload.severity ?? ''))}</p>
            <p><strong>Location:</strong> ${escapeHtml(
                latestDispatchLocation
                    ? `${Number(latestDispatchLocation.latitude).toFixed(6)}, ${Number(latestDispatchLocation.longitude).toFixed(6)}`
                    : 'Unavailable'
            )}</p>
          </section>
        `
        : '';

    return buildLayout({
        pageTitle: 'Dispatch Console',
        activePage: 'dispatch',
        access,
        headContent: access.recognized
            ? `
              <link
                rel="stylesheet"
                href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
                integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
                crossorigin=""
              />
            `
            : '',
        scripts: access.recognized
            ? `
              <script
                src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
                integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
                crossorigin=""
                defer
              ></script>
              <script src="assets/dispatch-map.js" defer></script>
            `
            : '',
        content: `
          <div class="page-grid dispatch-grid">
            ${createGreetingCard({
                access,
                title: 'Current Access',
                subtitle: access.recognized
                    ? 'Dispatch operations are available for the validated hero below.'
                    : 'This page is visible, but operations stay locked until a valid hero username is entered.',
                statusMessage: !access.recognized ? statusMessage : '',
                statusType
            })}
            ${dispatchConsoleMarkup}
            ${latestDispatchMarkup}
          </div>
        `
    });
};

const buildDatabaseRows = ({ heroes, username, search }) => {
    if (!heroes.length) {
        return `
          <tr>
            <td colspan="4" class="empty-row">No heroes match the current search.</td>
          </tr>
        `;
    }

    return heroes.map((hero) => `
        <tr>
          <td><span class="hero-table-value">${escapeHtml(hero.username)}</span></td>
          <td><span class="hero-table-value">${escapeHtml(hero.superHeroName)}</span></td>
          <td><span class="hero-table-value">${escapeHtml(hero.heroCode)}</span></td>
          <td>
            <div class="table-actions">
              <a
                class="text-link"
                href="${buildPathWithQuery('/database', {
                    username,
                    search,
                    edit: hero.username
                })}#hero-form-panel"
              >
                Edit
              </a>
              <form method="POST" action="/database/heroes/${encodePathSegment(hero.username)}/delete" class="inline-form">
                <input type="hidden" name="username" value="${escapeHtml(username)}" />
                <input type="hidden" name="search" value="${escapeHtml(search)}" />
                <button type="submit" class="ghost-button">Delete</button>
              </form>
            </div>
          </td>
        </tr>
    `).join('');
};

const buildDatabasePage = ({
    access,
    heroes,
    search = '',
    statusMessage,
    statusType = 'success',
    formValues = {},
    editingUsername = '',
    editingHero
}) => {
    const isEditing = Boolean(editingHero);
    const formAction = isEditing
        ? `/database/heroes/${encodePathSegment(editingUsername)}/update`
        : '/database/heroes';
    const submitLabel = isEditing ? 'Save Hero' : 'Add Hero';
    const currentFormValues = {
        username: formValues.username ?? editingHero?.username ?? '',
        superHeroName: formValues.superHeroName ?? editingHero?.superHeroName ?? '',
        heroCode: formValues.heroCode ?? editingHero?.heroCode ?? ''
    };

    const databaseContent = access.recognized
        ? `
          <div class="page-grid database-grid">
            <div class="sidebar-stack">
              ${createGreetingCard({
                  access,
                  title: 'Database Access',
                  subtitle: 'Validated heroes can search and manage the current roster.',
                  statusMessage: '',
                  statusType
              })}
              <section class="panel">
                <h3>Search Heroes</h3>
                <form method="GET" action="/database" class="stack-form">
                  <input type="hidden" name="username" value="${escapeHtml(access.username)}" />
                  <label for="search">Search by username, hero, or code:</label>
                  <input id="search" type="text" name="search" value="${escapeHtml(search)}" />
                  <div class="button-row">
                    <button type="submit">Search</button>
                    <a class="button-link secondary" href="${buildPathWithQuery('/database', { username: access.username })}">Clear</a>
                  </div>
                </form>
              </section>
              <section class="panel hero-form-panel" id="hero-form-panel">
                <div class="section-header">
                  <h3>${isEditing ? 'Edit Hero' : 'Add Hero'}</h3>
                  ${isEditing
                      ? `<a class="text-link" href="${buildPathWithQuery('/database', { username: access.username, search })}">Cancel edit</a>`
                      : ''}
                </div>
                <form method="POST" action="${formAction}" class="stack-form">
                  <input type="hidden" name="username" value="${escapeHtml(access.username)}" />
                  <input type="hidden" name="search" value="${escapeHtml(search)}" />

                  <label for="heroUsername">Username</label>
                  <input id="heroUsername" type="text" name="heroUsername" value="${escapeHtml(currentFormValues.username)}" required />

                  <label for="heroName">Hero name</label>
                  <input id="heroName" type="text" name="superHeroName" value="${escapeHtml(currentFormValues.superHeroName)}" required />

                  <label for="heroCodeInput">Hero code</label>
                  <input id="heroCodeInput" type="text" name="heroCode" value="${escapeHtml(currentFormValues.heroCode)}" required />

                  <button type="submit">${submitLabel}</button>
                </form>
                ${createStatusMarkup(statusMessage, statusType)}
              </section>
            </div>
            <section class="panel table-panel">
              <div class="section-header">
                <h3>Hero Database</h3>
                <span class="table-count">${heroes.length} record${heroes.length === 1 ? '' : 's'}</span>
              </div>
              <div class="table-wrap">
                <table class="hero-table">
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Hero</th>
                      <th>Code</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${buildDatabaseRows({
                        heroes,
                        username: access.username,
                        search
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        `
        : `
          <div class="page-grid database-grid">
            ${createGreetingCard({
                access,
                title: 'Database Access',
                subtitle: 'The roster is only available to validated hero usernames.',
                statusMessage,
                statusType
            })}
            ${createAccessDeniedMarkup(access.username)}
          </div>
        `;

    return buildLayout({
        pageTitle: 'Hero Database',
        activePage: 'database',
        access,
        content: databaseContent
    });
};

module.exports = {
    buildDatabasePage,
    buildDispatchPage,
    buildLoginPage
};
