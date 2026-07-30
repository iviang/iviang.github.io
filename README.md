# Personal site

Static personal site for Vivian Nguyen. Plain HTML, CSS, and JavaScript, no build step and no
dependencies. The projects section loads public repositories from the GitHub API at page load.

## Files

```
index.html        Page content and structure
css/styles.css    Design tokens at the top, everything else references them
js/projects.js    Fetches and renders the GitHub project cards
```

## Run it locally

Open `index.html` in a browser and it works. If you want a local server (closer to how it behaves
when deployed):

```
python -m http.server 8000
```

Then visit http://localhost:8000

## Change what shows in Projects

Everything configurable lives in the `CONFIG` object at the top of `js/projects.js`:

- `username` - which GitHub account to pull from
- `exclude` - repo names to hide, for example `['CSE-160']`
- `featured` - repo names to pin to the front, in the order you list them
- `showForks` / `showArchived` - both off by default
- `maxProjects` - how many cards to render

Private repos never appear. The API only returns public ones for an unauthenticated request, which
is the point: nothing can leak from here.

## Change the look

Edit the token block at the top of `css/styles.css`. Colors, spacing, type sizes, and radii are all
named there and referenced everywhere else, so changing `--color-accent` in one place changes every
accent on the page. Dark mode is a second token block that overrides the colors under
`prefers-color-scheme: dark`.

## Deploy to GitHub Pages

1. Create a public repo on GitHub. Naming it `iviang.github.io` gets you the root domain; any other
   name serves the site at `iviang.github.io/<repo-name>/`.
2. Push this folder to it.
3. In the repo, go to Settings, then Pages, and set Source to "Deploy from a branch", branch `main`,
   folder `/ (root)`.
4. Wait a minute, then load the URL Pages shows you.

There is no build step, so what you push is what gets served.

## Known limits

- The GitHub API allows 60 unauthenticated requests per hour per visitor IP. A visitor who reloads
  more than that in an hour sees a rate limit message with a link to the profile instead of the
  cards. Adding a token would fix it, but the token would be visible in the page source, so it is
  not worth doing.
- Projects load after first paint, so the section shows "Loading projects..." briefly.

## Before this is really done

- Add your LinkedIn URL in `index.html` (the placeholder link is marked).
- Rewrite the hero and About copy in your own words. What is there now is a starting draft.
- Add descriptions to your repos on GitHub. Cards without one say so, which is honest but plain.
