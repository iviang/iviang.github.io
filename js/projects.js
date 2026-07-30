/*
  Loads public repositories from the GitHub REST API and renders them as cards.

  No API key: the unauthenticated endpoint is rate limited to 60 requests per hour per
  visitor IP address, which is far more than a personal site needs. A key would have to be
  shipped in client-side JavaScript to be used here, which would mean publishing it.
*/

const CONFIG = {
  username: 'iviang',

  // Repos to keep off the site regardless of what the API returns.
  exclude: [],

  // Repos listed here sort to the front, in this order. Everything else follows by
  // most-recently-pushed. Leave empty to sort purely by recency.
  featured: [],

  // Forks and archived repos are hidden by default: they are rarely what you want to be
  // judged on. Flip either to true to show them.
  showForks: false,
  showArchived: false,

  maxProjects: 12,
};

const listEl = document.getElementById('projects-list');
const statusEl = document.getElementById('projects-status');

/**
 * Ranks a repo for display. Featured repos sort first in their listed order; the rest
 * fall back to push recency.
 */
function sortKey(repo) {
  const featuredIndex = CONFIG.featured.indexOf(repo.name);
  return {
    featured: featuredIndex === -1 ? Infinity : featuredIndex,
    pushedAt: new Date(repo.pushed_at).getTime(),
  };
}

function compareRepos(a, b) {
  const ka = sortKey(a);
  const kb = sortKey(b);
  if (ka.featured !== kb.featured) return ka.featured - kb.featured;
  return kb.pushedAt - ka.pushedAt;
}

function formatUpdated(isoDate) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(date);
}

/**
 * Builds one card.
 *
 * Everything from the API is inserted with textContent rather than innerHTML. Repo
 * descriptions and topic names are text that anyone could have written, so treating them
 * as markup would be an injection hole.
 */
function renderProject(repo) {
  const item = document.createElement('li');
  item.className = 'project';

  const title = document.createElement('h3');
  title.className = 'project__title';
  const link = document.createElement('a');
  link.href = repo.html_url;
  link.rel = 'noopener';
  link.textContent = repo.name;
  title.append(link);

  const description = document.createElement('p');
  description.className = 'project__description';
  if (repo.description) {
    description.textContent = repo.description;
  } else {
    // Say the description is missing rather than inventing one or leaving a blank card.
    description.classList.add('project__description--empty');
    description.textContent = 'No description on GitHub yet.';
  }

  const meta = document.createElement('p');
  meta.className = 'project__meta';

  if (repo.language) {
    const lang = document.createElement('span');
    lang.className = 'project__lang';
    lang.textContent = repo.language;
    meta.append(lang);
  }

  // Only show a star count when there is at least one. "0 stars" on every card is noise.
  if (repo.stargazers_count > 0) {
    const stars = document.createElement('span');
    stars.textContent = `${repo.stargazers_count} star${repo.stargazers_count === 1 ? '' : 's'}`;
    meta.append(stars);
  }

  const updated = formatUpdated(repo.pushed_at);
  if (updated) {
    const updatedEl = document.createElement('span');
    updatedEl.textContent = `Updated ${updated}`;
    meta.append(updatedEl);
  }

  item.append(title, description);
  if (meta.childElementCount > 0) item.append(meta);

  if (Array.isArray(repo.topics) && repo.topics.length > 0) {
    const topics = document.createElement('ul');
    topics.className = 'project__topics';
    repo.topics.slice(0, 4).forEach((topic) => {
      const topicEl = document.createElement('li');
      topicEl.textContent = topic;
      topics.append(topicEl);
    });
    item.append(topics);
  }

  return item;
}

function showStatus(message, isError = false) {
  statusEl.hidden = false;
  statusEl.textContent = message;
  statusEl.classList.toggle('status--error', isError);
}

async function loadProjects() {
  const url = `https://api.github.com/users/${CONFIG.username}/repos?per_page=100&sort=pushed`;

  let response;
  try {
    response = await fetch(url, {
      // Opting into the topics preview media type so repo.topics comes back populated.
      headers: { Accept: 'application/vnd.github+json' },
    });
  } catch (networkError) {
    showStatus(
      `Could not reach GitHub. See the projects directly at github.com/${CONFIG.username}`,
      true,
    );
    return;
  }

  if (response.status === 403 || response.status === 429) {
    // Distinguish the rate limit from a real failure, since it resolves on its own.
    showStatus(
      `GitHub's rate limit was hit, so the list could not load right now. ` +
        `Try again in a few minutes, or see github.com/${CONFIG.username}`,
      true,
    );
    return;
  }

  if (!response.ok) {
    showStatus(
      `GitHub returned an error (${response.status}). See github.com/${CONFIG.username}`,
      true,
    );
    return;
  }

  const repos = await response.json();

  const visible = repos
    .filter((repo) => CONFIG.showForks || !repo.fork)
    .filter((repo) => CONFIG.showArchived || !repo.archived)
    .filter((repo) => !CONFIG.exclude.includes(repo.name))
    .sort(compareRepos)
    .slice(0, CONFIG.maxProjects);

  if (visible.length === 0) {
    showStatus('No public repositories to show yet.');
    return;
  }

  const fragment = document.createDocumentFragment();
  visible.forEach((repo) => fragment.append(renderProject(repo)));
  listEl.append(fragment);

  statusEl.hidden = true;
}

loadProjects();
