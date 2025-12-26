# Prayer Schedule Generator

## Overview
A React + Vite application for generating Islamic prayer schedules. Users can configure settings like ZIP code, Asr school, and iqama times to generate a monthly prayer schedule.

## Project Structure
- `src/` - React frontend source code
  - `components/` - React components (PrayerRow, SettingsForm)
  - `pages/` - Page components (MonthlySchedule)
  - `api/` - API integrations (aladhan.ts)
  - `utils/` - Utility functions
  - `App.tsx` - Main application component
  - `main.tsx` - Application entry point
  - `styles.css` - Application styles
- `server.js` - Express production server
- `index.html` - HTML entry point
- `vite.config.mjs` - Vite configuration

## Development
- Dev server: `npm run dev` (runs on port 5000)
- Build: `npm run build`
- Production: `node server.js`

## Key Technologies
- React 18
- Vite 5
- TypeScript
- Express (production server)
- xlsx (Excel export)

## Deployment
- Build step: `npm run build`
- Start command: `node server.js`
- The production server serves the built app from the `dist` folder on port 5000
