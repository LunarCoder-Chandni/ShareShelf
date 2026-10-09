# ShareShelf: Database

Supabase (PostgreSQL) project **SHARESHELF** (`ap-south-1`).
Owner of this part: Divyanka.

## Files

| File | What it is |
|---|---|
| `schema.sql` | Everything: tables, rules, indexes, functions, views, triggers, security (RLS), storage buckets |
| `reference_data.sql` | The real starting rows: Amity University Gurugram + 18 categories |
| `seed.sql` | Fictional demo data for testing (add it here from your own copy) |

## How to set up a fresh database

1. Create a Supabase project.
2. Open **SQL Editor**, paste `schema.sql`, run it.
3. Paste `reference_data.sql`, run it.
4. (Optional) Paste `seed.sql` for demo data.

## What is in the database

**17 tables:** colleges, profiles, categories, listings, borrow_details, service_details, sale_details, listing_images, need_posts, requests, transactions, transaction_photos, reviews, reports, user_blocks, student_verifications, team_members.

**Views (use these for reading):**
- `listing_cards`: one row per listing for browse and search
- `profile_ratings`: average rating and review count per student

**Storage buckets:** `listing-images` (public), `transaction-photos` (private), `verification-docs` (private).

## Rules the database enforces by itself

- Students only see listings and need posts from **their own college**.
- Blocked users cannot see each other.
- Requests, transactions and photos are visible only to the **two people involved**.
- On signup, a profile is created automatically and the college is linked by email domain (`s.amity.edu`).
- Accepting a request creates a transaction automatically. A purchased listing becomes `sold`.
- The requester can only **cancel**. The listing owner can only **accept, reject or complete**.
- A review is allowed only **after a completed transaction** between the two people.

## For teammates

- **Backend:** use the Supabase client with the logged-in user's token so the security rules apply. Never put the service-role key in frontend code or in this repo.
- **Frontend:** read listings from `listing_cards`. Upload listing images to `listing-images/<your user id>/<file>`.
- Need a new column or rule? Ask Divyanka. Do not edit the live database directly.

## Not tested yet

This export was generated from the live project and has **not** been re-run on a blank database. The full flow (sign up, create a listing, request, accept, complete, review) still needs a real-login test.
