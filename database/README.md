# ShareShelf - Database

PostgreSQL on **Supabase**. These files describe and recreate the database structure.
They are **not** the live database: the live one is the Supabase project `SHARESHELF`.

| File | What it does |
|---|---|
| `schema.sql` | Tables, constraints, indexes, triggers, views, security rules (RLS), storage buckets, and the required reference data (college + categories). |
| `seed.sql` | Optional fictional demo data: 4 students, 24 listings (8 each for borrow, services and sale), 2 needs, 3 finished deals with reviews, 2 pending requests. |

Guest visitors can browse the fictional demo listings through the read-only `public_listing_cards` view. Real student listings and all account actions still require sign-in.

## How to run (new or empty Supabase project)

1. Supabase dashboard -> **SQL Editor** -> **New query**.
2. Paste all of `schema.sql` -> **Run**. Do this **once** (running it twice errors on "already exists").
3. Optional: paste all of `seed.sql` -> **Run**. This one is safe to run again.
4. Authentication -> Providers -> keep **Email** on. Turn off "Confirm email" while testing if you do not want to wait for mails.

The live project has the previous schema applied. Changes made to `schema.sql` are local until you apply them to Supabase. Do not run the complete schema against the existing project; it is for a new, empty project. Apply reviewed changes to an existing project as targeted SQL migrations.

The current local schema does not collect student ID documents. If the older live project has a `student_verifications` table or `verification-docs` bucket, those remain there until a separately reviewed migration removes them; this repository change does not delete live data.

## The 16 tables

| Group | Tables |
|---|---|
| People | `colleges`, `profiles` (one per login, created automatically at signup), `team_members` (reviewers/admins) |
| Listings | `categories`, `listings`, `borrow_details`, `service_details`, `sale_details`, `listing_images` |
| Need -> Match | `need_posts` |
| Deals | `requests`, `transactions`, `transaction_photos`, `reviews` |
| Trust and safety | `reports`, `user_blocks` |

Every listing is one row in `listings`, plus one row in the matching details table (`borrow_details`, `service_details` or `sale_details`).

## What the database does by itself

- **Signup** creates a `profiles` row and links the student to a college by email domain (`s.amity.edu` -> Amity University Gurugram).
- **Accepting a request** creates the `transactions` row automatically. For a purchase the listing is marked `sold`.
- **Rules are enforced in the database**: requesters can cancel pending requests; listing owners can accept or reject pending requests; borrowers mark loans returned and owners complete them; service and sale transactions can be completed by either party. A requester can cancel an in-progress transaction; cancelled sales return to active listings. Transaction details cannot be edited, and reviews are only allowed after completion, between the two people involved, once each.
- **Visibility**: students only see listings and needs from their own college, and never from users who blocked them or whom they blocked. Requests, transactions and handover photos are visible only to the two people involved.

## Useful views

- `listing_cards` - one row per listing with category, owner name, owner rating, price, deposit, condition and cover image. Use this for the Borrow / Services / Buy-Sell browse pages and search.
- `profile_ratings` - average rating and review count per student.

## For the backend teammate

- **Always call Supabase with the logged-in user's token** (the `Authorization: Bearer <access_token>` from the frontend) so the security rules apply. Only use the service-role key for admin jobs, and never put it in the frontend.
- **Browse and search**: `select * from listing_cards where listing_type = 'borrow' and status = 'active'`. Filter on `category_slug`, `price`, `owner_rating`. Text search uses `title` and `description`.
- The frontend uses `GET /api/categories` to load the category IDs required when creating a listing.
- **Create a listing**: insert into `listings` as a draft, then insert the matching row into `borrow_details` / `service_details` / `sale_details` with the same `listing_id`, then activate the listing. The backend follows this order so incomplete listings are not published.
- **Request flow**: create a request (`borrow`, `service` or `purchase`) -> owner accepts or rejects -> an accepted request creates a transaction -> borrower marks a loan returned and owner completes it, or either party completes a service or sale -> transaction completion closes the request.
- **Images** (storage paths, upload with the user's token):
  - `listing-images`: `{user_id}/{listing_id}/{filename}` (public), then add a `listing_images` row.
  - `transaction-photos`: `{transaction_id}/{filename}` (private), then add a `transaction_photos` row.
- **Demo accounts** from `seed.sql` have no password. Sign up with a real `@s.amity.edu` email to test.
- **Making someone a reviewer**: insert their `user_id` into `team_members` (SQL Editor).

## Security reminders

- Never commit `.env` files, the service-role key or the database password.
- The frontend may only use the project URL and the **publishable (anon) key**.
- `seed.sql` is fictional data only. Do not put real student details in it.
