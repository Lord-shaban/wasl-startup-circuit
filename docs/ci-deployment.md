# CI and shell deployment

The [CI and Pages workflow](../.github/workflows/ci-pages.yml) runs on pull requests, pushes to `main`, and manual dispatches. It installs the locked pnpm dependencies, checks TypeScript, runs unit tests, builds the static site, and runs Playwright smoke tests in Chromium. A failed check prevents deployment.

Pull requests retain a downloadable `wasl-shell-<run-id>` build artifact for seven days. It contains the current interaction prototype; it is not a complete round or a public PR preview URL.

After a successful `main` run, the workflow publishes `dist/` to GitHub Pages through the `github-pages` environment. The expected address is `https://lord-shaban.github.io/wasl-startup-circuit/`. The address must be opened and checked before it is called live or playable. Vite uses a relative asset base so scripts and styles load from the repository subpath.

## Repository setup

In **Settings → Pages → Build and deployment**, set **Source** to **GitHub Actions**. Keep GitHub Actions enabled for the repository. The deploy job requests only the `pages: write` and `id-token: write` permissions needed by GitHub Pages. Protect the `github-pages` environment so deployments originate from `main`.

## Local equivalent

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
```

The Playwright command starts the Vite development server via `playwright.config.ts`. To inspect the built output, run `pnpm preview` after `pnpm build`.
