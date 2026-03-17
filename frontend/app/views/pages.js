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
            <p class="panel-subtitle">Your hero profile has been verified. Choose a destination to continue.</p>
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
            <h3>Greeting Only</h3>
            <p class="panel-subtitle">Unknown usernames still receive the greeting, but dispatch and database tools remain unavailable.</p>
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
                <p class="panel-subtitle">Enter a hero username to unlock the dispatch console and database tools.</p>
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
                    ? 'Validated heroes can continue into dispatch or database operations.'
                    : 'A greeting is always available, but only validated heroes can continue.',
                statusMessage: '',
                statusType
            })}
            ${unlockedContent}
          </div>
        `
    });
};

const buildDispatchPage = ({ access, statusMessage, statusType = 'success', dispatchPayload }) => {
    const dispatchContent = access.recognized
        ? `
          <section class="panel dispatch-panel">
            <h3>Dispatch Console</h3>
            <p class="dispatch-subtitle">Hero identified. Submit an emergency dispatch.</p>
            <form method="POST" action="/dispatch" class="stack-form">
              <input type="hidden" name="username" value="${escapeHtml(access.username)}" />

              <label for="heroCode">Hero code:</label>
              <input id="heroCode" type="text" name="heroCode" value="${escapeHtml(access.heroCode)}" required />

              <label for="severity">Severity (1-5):</label>
              <input id="severity" type="number" name="severity" min="1" max="5" value="1" required />

              <button type="submit">Submit Dispatch</button>
            </form>
            ${createStatusMarkup(statusMessage, statusType)}
          </section>
          ${dispatchPayload
              ? `
                <section class="panel dispatch-result">
                  <h3>Latest Dispatch</h3>
                  <p><strong>ID:</strong> ${escapeHtml(dispatchPayload.dispatchId || '')}</p>
                  <p><strong>Status:</strong> ${escapeHtml(dispatchPayload.status || '')}</p>
                  <p><strong>Hero Code:</strong> ${escapeHtml(dispatchPayload.heroCode || '')}</p>
                  <p><strong>Severity:</strong> ${escapeHtml(String(dispatchPayload.severity ?? ''))}</p>
                </section>
              `
              : ''}
        `
        : createAccessDeniedMarkup(access.username);

    return buildLayout({
        pageTitle: 'Dispatch Console',
        activePage: 'dispatch',
        access,
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
            ${dispatchContent}
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
          <td>${escapeHtml(hero.username)}</td>
          <td>${escapeHtml(hero.superHeroName)}</td>
          <td>${escapeHtml(hero.heroCode)}</td>
          <td>
            <div class="table-actions">
              <a
                class="text-link"
                href="${buildPathWithQuery('/database', {
                    username,
                    search,
                    edit: hero.username
                })}"
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
              <section class="panel">
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
