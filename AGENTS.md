# Repository Guidelines

## Project Structure & Module Organization
This repository is an Astro site for a personal homepage and blog. Core app code lives in `src/`: routes in `src/pages`, layouts in `src/layouts`, components in `src/components`, and source assets in `src/assets`. Blog posts live in `src/pages/blog` and may be either `.md` or `.mdx`.

Interactive blog posts should use `MDX`, with one Astro component per figure in `src/components/blog`. Use `src/components/blog/FigureFrame.astro` as the shared shell so figures inherit the site's border, background, spacing, and header treatment. Keep figure logic scoped to the figure component or a nearby local module. Do not add new behavior to a global catch-all script.

## Build, Test, and Development Commands
Run commands from the repository root:

- `npm install`: install Astro dependencies.
- `npm run dev`: start the Astro dev server.
- `npm run build`: create the production site in `dist/`.
- `npm run preview`: serve the built site locally for a final check.

## Coding Style & Naming Conventions
Follow the existing code style in each file. Astro components use 2-space indentation in markup and CSS; browser-side figure scripts use semicolon-free ESM with small helper functions. Use `PascalCase` for components and layouts, lowercase route files for pages (`index.astro`), and descriptive slugs for blog files. Keep frontmatter minimal and prefer small, explicit CSS changes.

For interactive posts:

- use `.mdx` whenever a post embeds Astro components
- keep one figure component per interactive element or per tightly related figure family
- prefer local package imports through Astro/Vite over CDN script tags
- keep controls compact and site-native in appearance
- make mobile and desktop interaction states explicit
- avoid a growing global registry or god file for unrelated figures

## Testing Guidelines
There is no dedicated automated test suite yet. Before opening a PR, run `npm run build`. If you touch an interactive figure, also verify the related blog page in a browser and check that controls remain responsive on mobile and desktop widths. Successful local builds and page checks are the current release gate.

## Commit & Pull Request Guidelines
Recent commits use short, imperative subject lines such as `Remove lorem ipsum` and `Add GitHub Pages deploy workflow`. Keep commits focused and titled in that style. PRs should include a brief summary, note generated content or asset changes, link the relevant issue if one exists, and attach screenshots for visible homepage or blog UI updates.

## Deployment Notes
GitHub Actions deploys pushes to `main` through `.github/workflows/deploy.yml` using Node 20 and `npm ci`. Keep build steps reproducible and avoid relying on uncommitted generated files.
