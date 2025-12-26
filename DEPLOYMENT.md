## Deployment

This project is a Vite + React app. Two quick deployment options are provided below.

**Replit (serve built site)**
- Push or upload this repo to Replit.
- Replit will run `npm install`. We added a `postinstall` script that runs `npm run build`.
- Set the Run command to:

```bash
npm start
```

- `start` runs `node server.js`, which serves the `dist` folder.
- If you need environment secrets (e.g., API keys), add them via Replit Secrets and access via `process.env` on the server.

**Vercel (recommended for static sites)**
- Push repo to GitHub.
- In Vercel, import the repo and Vercel will auto-detect Vite.
- Build command: `npm run build` (auto-detected)
- Output directory: `dist`

**Local preview**
- Build locally: `npm run build`
- Serve locally (after build): `npm start` or use `npx serve -s dist -l 3000`

If you want, I can create a GitHub repo and push these changes, or add CI/CD config for automatic deploys to Vercel/Netlify.
