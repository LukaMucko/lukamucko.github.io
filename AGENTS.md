# Repository Guidelines

## Project Structure & Module Organization
This repository is an Astro site for a personal homepage and blog. Core app code lives in `src/`: routes in `src/pages`, layouts in `src/layouts`, components in `src/components`, and source assets in `src/assets`. Jupyter notebooks that feed blog content live in `src/notebooks`. Generated notebook assets are published from `public/nb-assets`, while automation lives in `scripts/`, mainly `scripts/nb-processor.mjs`.

## Build, Test, and Development Commands
Run commands from the repository root:

- `npm install`: install Astro, React, and blog-processing dependencies.
- `npm run dev`: start Astro dev server and watch notebooks for MDX regeneration.
- `npm run gen-blog`: convert notebooks in `src/notebooks` into blog posts under `src/pages/blog`.
- `npm run build`: create the production site in `dist/`.
- `npm run preview`: serve the built site locally for a final check.
- `npm run astro -- check`: run Astro's project validation when you want a lightweight correctness pass.

## Coding Style & Naming Conventions
Follow the existing code style in each file. Astro components use 2-space indentation in markup and CSS; the notebook processor uses semicolon-free ESM with small helper functions. Use `PascalCase` for components and layouts (`Plotly.astro`), lowercase route files for pages (`index.astro`), and descriptive slugs for generated blog files. Keep frontmatter minimal and prefer small, explicit CSS changes.

## Testing Guidelines
There is no dedicated automated test suite yet. Before opening a PR, run `npm run build` and `npm run astro -- check`. If you touch notebook conversion, also run `npm run gen-blog` and verify the generated blog page plus related files in `public/nb-assets`. Successful local builds and page checks are the current release gate.

## Commit & Pull Request Guidelines
Recent commits use short, imperative subject lines such as `Remove lorem ipsum` and `Add GitHub Pages deploy workflow`. Keep commits focused and titled in that style. PRs should include a brief summary, note generated content or asset changes, link the relevant issue if one exists, and attach screenshots for visible homepage or blog UI updates.

## Deployment Notes
GitHub Actions deploys pushes to `main` through `.github/workflows/deploy.yml` using Node 20 and `npm ci`. Keep build steps reproducible and avoid relying on uncommitted generated files.
