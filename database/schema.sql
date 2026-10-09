-- =====================================================================
-- ShareShelf - schema.sql
-- Student Resource & Skill Exchange Platform (Supabase / PostgreSQL)
--
-- Run ONCE on an empty Supabase project, in the SQL Editor.
-- This file mirrors the live SHARESHELF project. Order:
--   1 Tables   2 Indexes   3 Functions & triggers   4 Views
--   5 Row Level Security   6 Storage   7 Required reference data
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. TABLES
-- ---------------------------------------------------------------------

create table public.colleges (
  id             uuid primary key default gen_random_uuid(),
  name           text not null unique,
  slug           text not null unique,
  email_domains  text[] not null default '{}',      -- e.g. {s.amity.edu}
  created_at     timestamptz not null default now()
);

-- One profile per Supabase Auth user (created automatically at signup)
create table public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  college_id     uuid not null references public.colleges(id),
  full_name      text not null,
  department     text,
  year_of_study  smallint check (year_of_study between 1 and 8),
  avatar_path    text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table public.categories (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text not null unique,
  listing_type  text not null check (listing_type in ('borrow','service','sale')),
  created_at    timestamptz not null default now(),
  unique (name, listing_type),
  unique (id, listing_type)
);

-- Every item / service / product is one listing; type-specific fields live in *_details
create table public.listings (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references public.profiles(id) on delete cascade,
  category_id   uuid not null,
  listing_type  text not null check (listing_type in ('borrow','service','sale')),
  title         text not null check (length(trim(title)) > 0),
  description   text,
  status        text not null default 'draft'
                check (status in ('draft','active','paused','closed','sold')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (id, listing_type),
  -- a listing's category must be of the same type as the listing
  constraint listings_category_type_fk
    foreign key (category_id, listing_type) references public.categories(id, listing_type)
);

create table public.borrow_details (
  listing_id         uuid primary key,
  listing_type       text not null default 'borrow' check (listing_type = 'borrow'),
  max_duration_days  integer not null check (max_duration_days > 0),
  expected_deposit   numeric not null default 0 check (expected_deposit >= 0),
  available_from     date,
  available_until    date,
  constraint borrow_dates_valid
    check (available_until is null or available_from is null or available_until >= available_from),
  foreign key (listing_id, listing_type)
    references public.listings(id, listing_type) on delete cascade
);

create table public.service_details (
  listing_id          uuid primary key,
  listing_type        text not null default 'service' check (listing_type = 'service'),
  pricing_type        text not null default 'fixed'
                      check (pricing_type in ('fixed','hourly','negotiable','free')),
  price               numeric check (price is null or price >= 0),
  availability_notes  text,
  constraint service_price_valid check (
    (pricing_type in ('fixed','hourly') and price is not null)
    or (pricing_type in ('negotiable','free') and price is null)
  ),
  foreign key (listing_id, listing_type)
    references public.listings(id, listing_type) on delete cascade
);

create table public.sale_details (
  listing_id      uuid primary key,
  listing_type    text not null default 'sale' check (listing_type = 'sale'),
  price           numeric not null check (price >= 0),
  item_condition  text not null check (item_condition in ('new','like_new','good','fair','poor')),
  foreign key (listing_id, listing_type)
    references public.listings(id, listing_type) on delete cascade
);

create table public.listing_images (
  id            uuid primary key default gen_random_uuid(),
  listing_id    uuid not null references public.listings(id) on delete cascade,
  storage_path  text not null unique,                 -- path inside the listing-images bucket
  sort_order    integer not null default 0 check (sort_order >= 0),
  created_at    timestamptz not null default now()
);

-- Reviewers / admins who handle verifications and reports
create table public.team_members (
  user_id     uuid primary key references public.profiles(id) on delete cascade,
  role        text not null default 'reviewer' check (role in ('reviewer','admin')),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table public.student_verifications (
  id                uuid primary key default gen_random_uuid(),
  profile_id        uuid not null unique references public.profiles(id) on delete cascade,
  document_path     text not null,                    -- path inside the verification-docs bucket
  status            text not null default 'pending'
                    check (status in ('pending','approved','rejected')),
  reviewed_by       uuid references public.team_members(user_id) on delete set null,
  reviewed_at       timestamptz,
  rejection_reason  text,
  created_at        timestamptz not null default now(),
  constraint rejection_reason_valid
    check (status <> 'rejected' or nullif(trim(rejection_reason), '') is not null),
  constraint verification_review_fields_valid check (
    (status = 'pending' and reviewed_by is null and reviewed_at is null)
    or (status in ('approved','rejected') and reviewed_by is not null and reviewed_at is not null)
  )
);

-- "Need -> Match": a student states what they need instead of searching
create table public.need_posts (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references public.profiles(id) on delete cascade,
  category_id  uuid references public.categories(id) on delete set null,
  need_type    text not null check (need_type in ('borrow','service','sale')),
  title        text not null check (length(trim(title)) > 0),
  description  text,
  status       text not null default 'open' check (status in ('open','matched','closed')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.requests (
  id               uuid primary key default gen_random_uuid(),
  listing_id       uuid not null references public.listings(id) on delete restrict,
  requester_id     uuid not null references public.profiles(id) on delete restrict,
  request_type     text not null check (request_type in ('borrow','service','purchase')),
  message          text,
  requested_start  date,
  requested_end    date,
  status           text not null default 'pending'
                   check (status in ('pending','accepted','rejected','cancelled','completed')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  check (requested_end is null or requested_start is null or requested_end >= requested_start),
  unique (id, request_type)
);

-- Created automatically when a request is accepted (see trigger below)
create table public.transactions (
  id                    uuid primary key default gen_random_uuid(),
  request_id            uuid not null unique,
  request_type          text not null,
  transaction_type      text not null check (transaction_type in ('borrow','service','sale')),
  lender_or_seller_id   uuid not null references public.profiles(id) on delete restrict,
  borrower_or_buyer_id  uuid not null references public.profiles(id) on delete restrict,
  agreed_amount         numeric not null default 0 check (agreed_amount >= 0),
  start_date            date,
  due_date              date,
  completed_at          timestamptz,
  status                text not null default 'in_progress'
                        check (status in ('in_progress','returned','completed','cancelled','disputed')),
  created_at            timestamptz not null default now(),
  check (lender_or_seller_id <> borrower_or_buyer_id),
  check (due_date is null or start_date is null or due_date >= start_date),
  check (
    (transaction_type = 'borrow'  and request_type = 'borrow')
    or (transaction_type = 'service' and request_type = 'service')
    or (transaction_type = 'sale'    and request_type = 'purchase')
  ),
  foreign key (request_id, request_type)
    references public.requests(id, request_type) on delete restrict
);

-- Handover / return photos
create table public.transaction_photos (
  id              uuid primary key default gen_random_uuid(),
  transaction_id  uuid not null references public.transactions(id) on delete cascade,
  uploaded_by     uuid not null references public.profiles(id) on delete restrict,
  photo_type      text not null check (photo_type in ('handover','return','condition','other')),
  storage_path    text not null unique,               -- path inside the transaction-photos bucket
  created_at      timestamptz not null default now()
);

create table public.reviews (
  id              uuid primary key default gen_random_uuid(),
  transaction_id  uuid not null references public.transactions(id) on delete cascade,
  reviewer_id     uuid not null references public.profiles(id) on delete restrict,
  reviewee_id     uuid not null references public.profiles(id) on delete restrict,
  rating          smallint not null check (rating between 1 and 5),
  comment         text,
  created_at      timestamptz not null default now(),
  check (reviewer_id <> reviewee_id),
  unique (transaction_id, reviewer_id)                -- one review per person per transaction
);

create table public.reports (
  id                uuid primary key default gen_random_uuid(),
  reporter_id       uuid not null references public.profiles(id) on delete restrict,
  reported_user_id  uuid references public.profiles(id) on delete restrict,
  listing_id        uuid references public.listings(id) on delete restrict,
  reason            text not null,
  details           text,
  status            text not null default 'open'
                    check (status in ('open','reviewing','resolved','dismissed')),
  created_at        timestamptz not null default now(),
  check (reported_user_id is not null or listing_id is not null),
  check (reported_user_id is null or reported_user_id <> reporter_id)
);

create table public.user_blocks (
  blocker_id  uuid not null references public.profiles(id) on delete cascade,
  blocked_id  uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);


-- ---------------------------------------------------------------------
-- 2. INDEXES (speed up browse, search and dashboard queries)
-- ---------------------------------------------------------------------

create index listings_browse_idx on public.listings (listing_type, status, category_id, created_at desc);
create index listings_owner_idx on public.listings (owner_id);
create index listings_search_idx on public.listings
  using gin (to_tsvector('english', title || ' ' || coalesce(description, '')));
create index profiles_college_idx on public.profiles (college_id);
create index listing_images_listing_idx on public.listing_images (listing_id, sort_order);
create index requests_listing_idx on public.requests (listing_id, status);
create index requests_requester_idx on public.requests (requester_id, status);
create index transactions_lender_idx on public.transactions (lender_or_seller_id, status);
create index transactions_borrower_idx on public.transactions (borrower_or_buyer_id, status);
create index transaction_photos_txn_idx on public.transaction_photos (transaction_id);
create index reviews_reviewee_idx on public.reviews (reviewee_id);
create index need_posts_open_idx on public.need_posts (need_type, status, created_at desc);
create index need_posts_student_idx on public.need_posts (student_id);
create index reports_status_idx on public.reports (status);
create index verifications_status_idx on public.student_verifications (status);


-- ---------------------------------------------------------------------
-- 3. FUNCTIONS & TRIGGERS
-- ---------------------------------------------------------------------

-- Helpers used by the security policies
create or replace function public.current_college_id()
returns uuid language sql stable security definer set search_path = ''
as $$ select college_id from public.profiles where id = auth.uid() $$;

create or replace function public.is_team_member()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.team_members where user_id = auth.uid() and active) $$;

create or replace function public.is_blocked_with(other uuid)
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (
  select 1 from public.user_blocks
  where (blocker_id = auth.uid() and blocked_id = other)
     or (blocker_id = other and blocked_id = auth.uid())
) $$;

-- New signup -> profile row, linked to the college that matches the email domain
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare v_college uuid;
begin
  select c.id into v_college
  from public.colleges c
  where lower(split_part(new.email, '@', 2)) = any (select lower(d) from unnest(c.email_domains) d)
  limit 1;

  if v_college is null then
    select id into v_college from public.colleges order by created_at limit 1;
  end if;

  insert into public.profiles (id, college_id, full_name)
  values (
    new.id,
    v_college,
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), split_part(new.email, '@', 1))
  );
  return new;
end $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Keep updated_at fresh
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = ''
as $$ begin new.updated_at = now(); return new; end $$;

create trigger touch_profiles   before update on public.profiles   for each row execute function public.touch_updated_at();
create trigger touch_listings   before update on public.listings   for each row execute function public.touch_updated_at();
create trigger touch_need_posts before update on public.need_posts for each row execute function public.touch_updated_at();

-- Requests: the requester may only cancel; the listing owner may only accept / reject / complete
create or replace function public.guard_request_update()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare v_owner uuid;
begin
  if auth.uid() is null then          -- SQL editor / service role
    new.updated_at = now();
    return new;
  end if;

  if new.listing_id <> old.listing_id or new.requester_id <> old.requester_id or new.request_type <> old.request_type then
    raise exception 'listing, requester and request type cannot be changed';
  end if;

  select owner_id into v_owner from public.listings where id = old.listing_id;

  if auth.uid() = v_owner then
    if new.status not in ('accepted','rejected','completed') then
      raise exception 'owner can only accept, reject or complete a request';
    end if;
  elsif auth.uid() = old.requester_id then
    if new.status <> 'cancelled' then
      raise exception 'requester can only cancel a request';
    end if;
  else
    raise exception 'not allowed';
  end if;

  new.updated_at = now();
  return new;
end $$;

create trigger guard_request_update before update on public.requests
for each row execute function public.guard_request_update();

-- Accepting a request creates the transaction (and marks a purchased item as sold)
create or replace function public.on_request_accepted()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v_owner uuid;
  v_amount numeric;
begin
  if new.status = 'accepted' and old.status is distinct from 'accepted' then
    select owner_id into v_owner from public.listings where id = new.listing_id;

    v_amount := coalesce(
      (select price from public.sale_details where listing_id = new.listing_id),
      (select price from public.service_details where listing_id = new.listing_id),
      0
    );

    insert into public.transactions (
      request_id, request_type, transaction_type,
      lender_or_seller_id, borrower_or_buyer_id,
      agreed_amount, start_date, due_date
    ) values (
      new.id, new.request_type,
      case new.request_type when 'purchase' then 'sale' else new.request_type end,
      v_owner, new.requester_id,
      v_amount, new.requested_start, new.requested_end
    )
    on conflict (request_id) do nothing;

    if new.request_type = 'purchase' then
      update public.listings set status = 'sold' where id = new.listing_id;
    end if;
  end if;
  return new;
end $$;

create trigger on_request_accepted after update on public.requests
for each row execute function public.on_request_accepted();

-- Transactions: parties can move the status forward but cannot rewrite the deal
create or replace function public.guard_transaction_update()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if new.request_id <> old.request_id
     or new.lender_or_seller_id <> old.lender_or_seller_id
     or new.borrower_or_buyer_id <> old.borrower_or_buyer_id
     or new.agreed_amount <> old.agreed_amount
     or new.transaction_type <> old.transaction_type then
    raise exception 'transaction details cannot be changed';
  end if;

  if new.status = 'completed' and old.status <> 'completed' then
    new.completed_at = now();
  end if;
  return new;
end $$;

create trigger guard_transaction_update before update on public.transactions
for each row execute function public.guard_transaction_update();

-- Lock down who can call what directly through the API
revoke execute on function public.handle_new_user()          from public, anon, authenticated;
revoke execute on function public.guard_request_update()     from public, anon, authenticated;
revoke execute on function public.on_request_accepted()      from public, anon, authenticated;
revoke execute on function public.guard_transaction_update() from public, anon, authenticated;
revoke execute on function public.current_college_id()       from public, anon;
revoke execute on function public.is_team_member()           from public, anon;
revoke execute on function public.is_blocked_with(uuid)      from public, anon;
grant  execute on function public.current_college_id()       to authenticated;
grant  execute on function public.is_team_member()           to authenticated;
grant  execute on function public.is_blocked_with(uuid)      to authenticated;


-- ---------------------------------------------------------------------
-- 4. VIEWS (security_invoker = the caller's own access rules still apply)
-- ---------------------------------------------------------------------

-- Average rating and review count per student
create or replace view public.profile_ratings with (security_invoker = true) as
select reviewee_id as profile_id,
       round(avg(rating)::numeric, 1) as avg_rating,
       count(*)::int as review_count
from public.reviews
group by reviewee_id;

-- One ready-made row per listing for the browse / search screens
create or replace view public.listing_cards with (security_invoker = true) as
select
  l.id, l.listing_type, l.title, l.description, l.status, l.created_at, l.category_id,
  c.name as category_name, c.slug as category_slug,
  l.owner_id, p.full_name as owner_name, p.department as owner_department,
  r.avg_rating as owner_rating, coalesce(r.review_count, 0) as owner_review_count,
  coalesce(sa.price, se.price) as price,
  se.pricing_type, se.availability_notes,
  sa.item_condition,
  b.max_duration_days, b.expected_deposit, b.available_from, b.available_until,
  (select li.storage_path from public.listing_images li
    where li.listing_id = l.id order by li.sort_order, li.created_at limit 1) as cover_image_path
from public.listings l
join public.categories c on c.id = l.category_id
join public.profiles p on p.id = l.owner_id
left join public.profile_ratings r on r.profile_id = l.owner_id
left join public.sale_details sa on sa.listing_id = l.id
left join public.service_details se on se.listing_id = l.id
left join public.borrow_details b on b.listing_id = l.id;

grant select on public.profile_ratings to authenticated;
grant select on public.listing_cards   to authenticated;


-- ---------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------

alter table public.colleges              enable row level security;
alter table public.profiles              enable row level security;
alter table public.categories            enable row level security;
alter table public.listings              enable row level security;
alter table public.borrow_details        enable row level security;
alter table public.service_details       enable row level security;
alter table public.sale_details          enable row level security;
alter table public.listing_images        enable row level security;
alter table public.team_members          enable row level security;
alter table public.student_verifications enable row level security;
alter table public.need_posts            enable row level security;
alter table public.requests              enable row level security;
alter table public.transactions          enable row level security;
alter table public.transaction_photos    enable row level security;
alter table public.reviews               enable row level security;
alter table public.reports               enable row level security;
alter table public.user_blocks           enable row level security;

-- Reference data
create policy colleges_read   on public.colleges   for select to anon, authenticated using (true);
create policy categories_read on public.categories for select to anon, authenticated using (true);

-- Profiles: same-college visibility, edit only your own
create policy profiles_read on public.profiles for select to authenticated
  using (id = auth.uid() or college_id = public.current_college_id());
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and college_id = public.current_college_id());

-- Listings: own listings, or active/sold listings from your college (minus blocked users)
create policy listings_read on public.listings for select to authenticated
using (
  owner_id = auth.uid()
  or (
    status in ('active','sold')
    and not public.is_blocked_with(owner_id)
    and exists (select 1 from public.profiles p
                where p.id = owner_id and p.college_id = public.current_college_id())
  )
);
create policy listings_insert_own on public.listings for insert to authenticated with check (owner_id = auth.uid());
create policy listings_update_own on public.listings for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy listings_delete_own on public.listings for delete to authenticated using (owner_id = auth.uid());

-- Detail tables and images: visible when the listing is visible, writable by the listing owner
do $$
declare t text;
begin
  foreach t in array array['borrow_details','service_details','sale_details','listing_images'] loop
    execute format('create policy %I on public.%I for select to authenticated using (exists (select 1 from public.listings l where l.id = listing_id))', t || '_read', t);
    execute format('create policy %I on public.%I for all to authenticated using (exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = auth.uid())) with check (exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = auth.uid()))', t || '_owner_write', t);
  end loop;
end $$;

-- Need posts
create policy need_posts_read on public.need_posts for select to authenticated
using (
  student_id = auth.uid()
  or (not public.is_blocked_with(student_id)
      and exists (select 1 from public.profiles p
                  where p.id = student_id and p.college_id = public.current_college_id()))
);
create policy need_posts_insert_own on public.need_posts for insert to authenticated with check (student_id = auth.uid());
create policy need_posts_update_own on public.need_posts for update to authenticated using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy need_posts_delete_own on public.need_posts for delete to authenticated using (student_id = auth.uid());

-- Requests: visible to the requester and the listing owner
create policy requests_read on public.requests for select to authenticated
using (
  requester_id = auth.uid()
  or exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = auth.uid())
);
create policy requests_insert on public.requests for insert to authenticated
with check (
  requester_id = auth.uid()
  and exists (select 1 from public.listings l
              where l.id = listing_id and l.status = 'active' and l.owner_id <> auth.uid())
);
create policy requests_update on public.requests for update to authenticated
using (
  requester_id = auth.uid()
  or exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = auth.uid())
)
with check (
  requester_id = (select r.requester_id from public.requests r where r.id = requests.id)
);

-- Transactions and photos: only the two people involved
create policy transactions_read on public.transactions for select to authenticated
  using (auth.uid() in (lender_or_seller_id, borrower_or_buyer_id));
create policy transactions_update on public.transactions for update to authenticated
  using (auth.uid() in (lender_or_seller_id, borrower_or_buyer_id))
  with check (auth.uid() in (lender_or_seller_id, borrower_or_buyer_id));

create policy txn_photos_read on public.transaction_photos for select to authenticated
using (exists (select 1 from public.transactions t
               where t.id = transaction_id and auth.uid() in (t.lender_or_seller_id, t.borrower_or_buyer_id)));
create policy txn_photos_insert on public.transaction_photos for insert to authenticated
with check (
  uploaded_by = auth.uid()
  and exists (select 1 from public.transactions t
              where t.id = transaction_id and auth.uid() in (t.lender_or_seller_id, t.borrower_or_buyer_id))
);

-- Reviews: public to the campus; only the two parties of a completed transaction can write one
create policy reviews_read on public.reviews for select to authenticated using (true);
create policy reviews_insert on public.reviews for insert to authenticated
with check (
  reviewer_id = auth.uid()
  and exists (
    select 1 from public.transactions t
    where t.id = transaction_id
      and t.status = 'completed'
      and ((t.lender_or_seller_id = auth.uid() and t.borrower_or_buyer_id = reviewee_id)
        or (t.borrower_or_buyer_id = auth.uid() and t.lender_or_seller_id = reviewee_id))
  )
);

-- Reports and blocks
create policy reports_insert      on public.reports for insert to authenticated with check (reporter_id = auth.uid());
create policy reports_read        on public.reports for select to authenticated using (reporter_id = auth.uid() or public.is_team_member());
create policy reports_team_update on public.reports for update to authenticated using (public.is_team_member()) with check (public.is_team_member());

create policy blocks_read_own   on public.user_blocks for select to authenticated using (blocker_id = auth.uid());
create policy blocks_insert_own on public.user_blocks for insert to authenticated with check (blocker_id = auth.uid() and blocked_id <> auth.uid());
create policy blocks_delete_own on public.user_blocks for delete to authenticated using (blocker_id = auth.uid());

-- Verification
create policy verif_read        on public.student_verifications for select to authenticated using (profile_id = auth.uid() or public.is_team_member());
create policy verif_insert_own  on public.student_verifications for insert to authenticated with check (profile_id = auth.uid() and status = 'pending');
create policy verif_team_update on public.student_verifications for update to authenticated using (public.is_team_member()) with check (public.is_team_member());

create policy team_members_read on public.team_members for select to authenticated
  using (user_id = auth.uid() or public.is_team_member());


-- ---------------------------------------------------------------------
-- 6. STORAGE BUCKETS AND POLICIES
--   listing-images      path: {user_id}/{listing_id}/{file}   (public read)
--   transaction-photos  path: {transaction_id}/{file}         (private, the two parties)
--   verification-docs   path: {user_id}/{file}                (private, owner + reviewers)
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('listing-images',     'listing-images',     true,  5242880, array['image/jpeg','image/png','image/webp']),
  ('transaction-photos', 'transaction-photos', false, 5242880, array['image/jpeg','image/png','image/webp']),
  ('verification-docs',  'verification-docs',  false, 5242880, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do nothing;

create policy listing_images_read on storage.objects for select to authenticated
  using (bucket_id = 'listing-images');
create policy listing_images_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'listing-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy listing_images_update on storage.objects for update to authenticated
  using (bucket_id = 'listing-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy listing_images_delete on storage.objects for delete to authenticated
  using (bucket_id = 'listing-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy txn_photos_storage_read on storage.objects for select to authenticated
  using (
    bucket_id = 'transaction-photos'
    and exists (select 1 from public.transactions t
                where t.id::text = (storage.foldername(name))[1]
                  and auth.uid() in (t.lender_or_seller_id, t.borrower_or_buyer_id))
  );
create policy txn_photos_storage_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'transaction-photos'
    and exists (select 1 from public.transactions t
                where t.id::text = (storage.foldername(name))[1]
                  and auth.uid() in (t.lender_or_seller_id, t.borrower_or_buyer_id))
  );

create policy verif_docs_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'verification-docs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy verif_docs_read on storage.objects for select to authenticated
  using (bucket_id = 'verification-docs'
         and ((storage.foldername(name))[1] = auth.uid()::text or public.is_team_member()));


-- ---------------------------------------------------------------------
-- 7. REQUIRED REFERENCE DATA (the app needs these to work; not demo data)
-- ---------------------------------------------------------------------

insert into public.colleges (name, slug, email_domains)
values ('Amity University Gurugram', 'amity-gurugram', array['s.amity.edu'])
on conflict (slug) do update set name = excluded.name, email_domains = excluded.email_domains;

insert into public.categories (name, slug, listing_type) values
  ('Electronics & Components',    'borrow-electronics',   'borrow'),
  ('Lab Equipment & Coats',       'borrow-lab',           'borrow'),
  ('Books & Notes',               'borrow-books',         'borrow'),
  ('Tools & Instruments',         'borrow-tools',         'borrow'),
  ('Other Items',                 'borrow-other',         'borrow'),
  ('PPT & Presentation Design',   'service-ppt',          'service'),
  ('Graphic Design (Canva)',      'service-graphic',      'service'),
  ('Tutoring',                    'service-tutoring',     'service'),
  ('Photography',                 'service-photography',  'service'),
  ('Video Editing',               'service-video',        'service'),
  ('Resume Formatting',           'service-resume',       'service'),
  ('Coding Help',                 'service-coding',       'service'),
  ('Documentation & Reports',     'service-docs',         'service'),
  ('Textbooks',                   'sale-textbooks',       'sale'),
  ('Lab Coats & Uniforms',        'sale-lab-coats',       'sale'),
  ('Drawing Sheets & Stationery', 'sale-stationery',      'sale'),
  ('Calculators',                 'sale-calculators',     'sale'),
  ('Project Components',          'sale-components',      'sale')
on conflict (slug) do nothing;
