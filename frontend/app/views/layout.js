const { escapeHtml } = require('../utils/html');
const { buildPathWithQuery } = require('../utils/url');

const createStatusMarkup = (statusMessage, statusType = 'success') => (
    statusMessage
        ? `<div class="status ${escapeHtml(statusType)}">${escapeHtml(statusMessage)}</div>`
        : ''
);

const createNavMarkup = ({ username, recognized, activePage }) => {
    const dispatchHref = buildPathWithQuery('/dispatch', { username });
    const databaseHref = buildPathWithQuery('/database', { username });

    const navLink = (page, label, href) => {
        if (!recognized) {
            return `<span class="nav-link disabled">${label}</span>`;
        }

        const activeClass = activePage === page ? ' active' : '';
        return `<a class="nav-link${activeClass}" href="${href}">${label}</a>`;
    };

    return `
      <header class="topbar">
        <div class="brand-row">
          <a href="${buildPathWithQuery('/', { username })}" class="logo-link" aria-label="Go to SDN home page">
            <img src="assets/sdn_logo.png" alt="SDN logo" class="logo" />
          </a>
          <nav class="top-nav" aria-label="Primary">
            ${navLink('dispatch', 'Dispatch', dispatchHref)}
            ${navLink('database', 'Database', databaseHref)}
          </nav>
        </div>
        <div class="topbar-meta">
          ${username ? `<span class="hero-pill">${escapeHtml(username)}</span>` : ''}
          <span class="hero-pill ${recognized ? 'unlocked' : 'locked'}">
            ${recognized ? 'Access Granted' : 'Access Locked'}
          </span>
        </div>
      </header>
    `;
};

const createGreetingCard = ({ access, title, subtitle, statusMessage, statusType }) => `
    <section class="panel welcome-panel">
      <div class="panel-heading">
        <h2>Hello Welcome to Superhero Dispatch Network ${escapeHtml(access.superHeroName)}</h2>
        <p class="panel-subtitle">${escapeHtml(subtitle)}</p>
      </div>
      <div class="hero-summary-grid">
        <div class="hero-summary-item">
          <span class="summary-label">Username</span>
          <strong>${escapeHtml(access.username || 'Not entered')}</strong>
        </div>
        <div class="hero-summary-item">
          <span class="summary-label">Hero identity</span>
          <strong>${escapeHtml(access.superHeroName)}</strong>
        </div>
        <div class="hero-summary-item">
          <span class="summary-label">Hero code</span>
          <strong>${escapeHtml(access.heroCode || 'Unavailable')}</strong>
        </div>
      </div>
      ${title ? `<h3 class="section-title">${escapeHtml(title)}</h3>` : ''}
      ${createStatusMarkup(statusMessage, statusType)}
    </section>
`;

const createAccessDeniedMarkup = (username) => `
    <section class="panel access-panel locked-panel">
      <h3>Restricted Access</h3>
      <p class="panel-subtitle">A valid hero username is required before dispatch and database controls are available.</p>
      <a class="button-link" href="${buildPathWithQuery('/', { username })}">Return to Login</a>
    </section>
`;

const buildLayout = ({ pageTitle, activePage, access, content }) => `
    <html>
    <head>
      <title>${escapeHtml(pageTitle)}</title>
      <link rel="stylesheet" type="text/css" href="style.css">
      <meta name="viewport" content="width=device-width, initial-scale=1" />
    </head>
    <body>
      ${createNavMarkup({
          username: access.username,
          recognized: access.recognized,
          activePage
      })}
      <main class="page-shell ${escapeHtml(activePage || 'login')}">
        ${content}
      </main>
    </body>
    </html>
`;

module.exports = {
    buildLayout,
    createAccessDeniedMarkup,
    createGreetingCard,
    createStatusMarkup
};
