# ShareShelf API

The Express API uses the existing Supabase schema in `../database/schema.sql`.

## Local setup

1. Copy `.env.example` to `.env` and set the Supabase URL, publishable key (or legacy anon key), and college email domain.
2. Set `ALLOWED_EMAIL_DOMAINS` to the exact college email domains in `public.colleges.email_domains`.
3. From this directory, install the declared dependencies with `npm install`.
4. Start the API with `npm run dev`; `GET /api/health` checks the API and its database connection.

## Routes

- `POST /api/auth/signup`, `/login`, `/refresh`; `GET /api/auth/me`
- `GET /api/profiles/me`, `PATCH /api/profiles/me`, `GET /api/profiles/:id`
- `GET /api/listings/public` and `GET /api/categories` are read-only guest routes for fictional demo listings and categories.
- `GET`, `POST`, `GET /:id`, and `DELETE /:id` on `/api/listings`
- `GET`, `POST`, and `PATCH /:id/status` on `/api/requests`
- `GET /api/transactions` and `PATCH /api/transactions/:id/status`

Protected routes require `Authorization: Bearer <access_token>`. Database reads and writes use that user's token so Supabase RLS policies apply. Guest browsing reads only from the restricted `public_listing_cards` view, which contains demo listings and excludes owner IDs. The backend does not require a service-role key.

Listing creation accepts `listing_type` values `borrow`, `service`, or `sale`, a `category_id`, a non-empty `title`, and the matching details required by the schema.

The backend uses the publishable key for Auth and public college lookup, then the signed-in user's JWT for protected database work. It does not require a service-role or secret key. The frontend's **My activity** section lets requesters cancel pending requests, listing owners accept or reject them, and transaction parties complete the supported lifecycle. Borrowers mark items returned; the owner then marks the loan complete. For services and sales, either participant can complete the transaction.
