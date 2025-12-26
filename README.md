# Prayer Schedule

Simple Vite + React + TypeScript app to fetch monthly prayer times from Aladhan and compute iqama times.

Setup (macOS):

```bash
cd "Prayer TIme"
npm install
npm run dev
```

Notes:
- Uses Zippopotam.us to convert US ZIP to coordinates, then calls Aladhan calendar endpoint.
- Settings are persisted in localStorage.

GitHub Pages
---------------
- This repo includes a GitHub Actions workflow that builds the app and publishes the `dist` folder to the `gh-pages` branch on pushes to `main`.
- After pushing to GitHub, enable Pages in the repository settings if it's not already enabled. The site will be available at:

	https://<your-github-username>.github.io/<repo-name>/

Replace `<your-github-username>` and `<repo-name>` with your GitHub account and repository name.

If you prefer Vercel or Netlify, see `DEPLOYMENT.md` for instructions.
