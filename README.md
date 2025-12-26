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
