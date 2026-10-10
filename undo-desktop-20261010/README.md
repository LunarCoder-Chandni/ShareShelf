# ShareShelf

ShareShelf is a student marketplace with a static frontend, an Express API, and a Supabase PostgreSQL database.

## Run locally

1. Install Node.js 18.18 or newer.
2. In `backend/`, copy `.env.example` to `.env` and fill in the Supabase URL, publishable/anon key, service-role key, and allowed college email domain. Keep `.env` private.
3. In `backend/`, run `npm install` and then `npm run dev`.
4. Serve the `frontend/` directory with VS Code Live Server on port 5500, then open `http://127.0.0.1:5500`. Opening `index.html` as a `file://` URL can fail the API's CORS check.
5. Log in with a college account or sign up. If email confirmation is enabled in Supabase, confirm the signup email before logging in.

The frontend calls the API at `http://localhost:5000/api`. The backend uses the caller's Supabase access token for database operations so row-level security remains in effect.

See [backend/README.md](backend/README.md) for API details and [database/README.md](database/README.md) before setting up a new Supabase project.
