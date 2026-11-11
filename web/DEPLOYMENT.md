# Deploy Reverse Snake to Vercel

Deploy the browser game from `web/`. This folder contains the complete Next.js application, bundled fonts, graphics, dependency lockfile, and Vercel configuration.

## Manual deployment in the dashboard

1. Commit and push the latest project files to a GitHub, GitLab, or Bitbucket repository, including the files in `web/`.
2. Open [Vercel's New Project page](https://vercel.com/new) and import that repository.
3. Set **Root Directory** to **`web`**. This must be selected in the dashboard; `vercel.json` cannot set the project root.
4. Confirm the following settings and click **Deploy**:

| Setting | Value |
| --- | --- |
| Root Directory | `web` |
| Framework Preset | Next.js |
| Node.js Version | `24.x` |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | Leave the default Next.js setting (`.next`) |
| Environment Variables | None required |

`vercel.json` supplies the framework, install command, and build command. The `engines.node` field in `package.json` selects Node.js 24. Vercel serves the built application automatically.

If your Git repository contains only the contents of `web/`, leave Root Directory at the repository root instead.

## Check locally before deployment

From the main project directory, with Node.js 24 installed:

```powershell
cd web
npm ci
npm test
npm run lint
npm run build
npm run typecheck
npm start
```

Open http://localhost:3000 to check the production game. Stop the local server with Ctrl+C.

Vercel builds from source. Keep `package-lock.json`, `src/`, `public/`, and the project configuration files in Git. Generated directories such as `node_modules/`, `.next/`, `out/`, and `.vercel/` are ignored.

## After deployment

Open the HTTPS URL Vercel provides and check that the game loads, starts, moves, dashes, and pauses. Check touch controls on a phone and reload after completing a round to confirm local scores persist.

Gameplay, sounds, and score storage run in the browser. No Python runtime, database, API keys, or additional backend is required. Scores and preferences are stored separately for each browser and site address.

The existing `docs/audit/` reports describe known prototype gameplay issues and proposed future features. This deployment setup hosts the current browser game.
