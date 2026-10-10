# ShareShelf

ShareShelf is a student marketplace with a static frontend, an Express API, and a Supabase PostgreSQL database.

## Run locally

1. Install Node.js 18.18 or newer.
2. In `backend/`, copy `.env.example` to `.env` and set the Supabase URL, publishable (or legacy anon) key, and allowed college email domain. Keep `.env` private.
3. In `backend/`, run `npm install` and then `npm run dev`.
4. The API serves the frontend at `http://localhost:5000`; VS Code Live Server on port 5500 remains available for browser development.
5. Log in with a college account or sign up. If email confirmation is enabled in Supabase, confirm the signup email before logging in.

The frontend calls the API at `http://localhost:5000/api`. The backend uses the caller's Supabase access token for database operations so row-level security remains in effect.

## Desktop app

The ShareShelf home screen is a student dashboard with profile details, recent activity, and Borrow, Services, and Sell entry points. The existing browser frontend remains available.

1. Set up `backend/.env` as described above and install the backend dependencies once with `npm install` from `backend/`.
2. From this project folder, run `npm install` once to install Electron.
3. Start the desktop window with `npm run dev` (or `npm run app`). It opens the dashboard directly and starts the local API when needed.

The dashboard can open before backend setup. Sign-in and live profile/history data need `backend/.env` configured and the local API on port 5000.

To undo the desktop/dashboard changes and restore the saved frontend and backend files, run `powershell -ExecutionPolicy Bypass -File .\undo-desktop-changes.ps1` from this folder. The backup stays in `undo-desktop-20261010`.

See [backend/README.md](backend/README.md) for API details and [database/README.md](database/README.md) before setting up a new Supabase project.
