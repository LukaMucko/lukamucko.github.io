# Repository Guidelines

## Project Structure & Module Organization
This repository is an Astro site for a personal homepage and blog. Core app code lives in `src/`: routes in `src/pages`, layouts in `src/layouts`, components in `src/components`, and source assets in `src/assets`. Blog posts live as Markdown files in `src/pages/blog`. Native interactive blog figures are implemented as browser custom elements in `public/scripts/interactive-figures.js` and embedded directly in Markdown with custom HTML tags.

## Build, Test, and Development Commands
Run commands from the repository root:

- `npm install`: install Astro dependencies.
- `npm run dev`: start the Astro dev server.
- `npm run build`: create the production site in `dist/`.
- `npm run preview`: serve the built site locally for a final check.

## Coding Style & Naming Conventions
Follow the existing code style in each file. Astro components use 2-space indentation in markup and CSS; browser-side figure scripts use semicolon-free ESM with small helper functions. Use `PascalCase` for components and layouts, lowercase route files for pages (`index.astro`), and descriptive slugs for blog files. Keep frontmatter minimal and prefer small, explicit CSS changes.

For interactive posts, wrap custom figure tags in `<div class="interactive-figure">...</div>` so they inherit the site-wide border, background, and shadow treatment.

## Testing Guidelines
There is no dedicated automated test suite yet. Before opening a PR, run `npm run build`. If you touch an interactive figure, also verify the related blog page in a browser and check that controls remain responsive on mobile and desktop widths. Successful local builds and page checks are the current release gate.

## Commit & Pull Request Guidelines
Recent commits use short, imperative subject lines such as `Remove lorem ipsum` and `Add GitHub Pages deploy workflow`. Keep commits focused and titled in that style. PRs should include a brief summary, note generated content or asset changes, link the relevant issue if one exists, and attach screenshots for visible homepage or blog UI updates.

## Deployment Notes
GitHub Actions deploys pushes to `main` through `.github/workflows/deploy.yml` using Node 20 and `npm ci`. Keep build steps reproducible and avoid relying on uncommitted generated files.
