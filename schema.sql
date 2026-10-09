-- ShareShelf database schema
-- Exported from the LIVE Supabase project "SHARESHELF" (ap-south-1) on 2026-10-09.
-- Run order: tables -> constraints -> indexes -> functions -> views -> triggers -> RLS -> storage.
-- Safe to read top to bottom. Run on a fresh Supabase project (SQL editor) to recreate the database.

-- =====================================================================
-- 1. TABLES
-- =====================================================================

CREATE TABLE public.colleges (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  email_domains text[] NOT NULL DEFAULT '{}'::text[]
);

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  college_id uuid NOT NULL,
  full_name text NOT NULL,
  department text,
  year_of_study smallint,
  avatar_path text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  listing_type text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.listings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  category_id uuid NOT NULL,
  listing_type text NOT NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'draft'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.borrow_details (
  listing_id uuid NOT NULL,
  listing_type text NOT NULL DEFAULT 'borrow'::text,
  max_duration_days integer NOT NULL,
  expected_deposit numeric(10,2) NOT NULL DEFAULT 0,
  available_from date,
  available_until date
);

CREATE TABLE public.service_details (
  listing_id uuid NOT NULL,
  listing_type text NOT NULL DEFAULT 'service'::text,
  pricing_type text NOT NULL DEFAULT 'fixed'::text,
  price numeric(10,2),
  availability_notes text
);

CREATE TABLE public.sale_details (
  listing_id uuid NOT NULL,
  listing_type text NOT NULL DEFAULT 'sale'::text,
  price numeric(10,2) NOT NULL,
  item_condition text NOT NULL
);

CREATE TABLE public.listing_images (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL,
  storage_path text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.need_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  category_id uuid,
  need_type text NOT NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'open'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL,
  requester_id uuid NOT NULL,
  request_type text NOT NULL,
  message text,
  requested_start date,
  requested_end date,
  status text NOT NULL DEFAULT 'pending'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL,
  request_type text NOT NULL,
  transaction_type text NOT NULL,
  lender_or_seller_id uuid NOT NULL,
  borrower_or_buyer_id uuid NOT NULL,
  agreed_amount numeric(10,2) NOT NULL DEFAULT 0,
  start_date date,
  due_date date,
  completed_at timestamp with time zone,
  status text NOT NULL DEFAULT 'in_progress'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.transaction_photos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL,
  uploaded_by uuid NOT NULL,
  photo_type text NOT NULL,
  storage_path text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL,
  reviewer_id uuid NOT NULL,
  reviewee_id uuid NOT NULL,
  rating smallint NOT NULL,
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  reported_user_id uuid,
  listing_id uuid,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'open'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.user_blocks (
  blocker_id uuid NOT NULL,
  blocked_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.team_members (
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'reviewer'::text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.student_verifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  document_path text NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  rejection_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- =====================================================================
-- 2. CONSTRAINTS (primary keys, unique, checks, foreign keys)
-- =====================================================================

-- Primary keys
ALTER TABLE public.borrow_details ADD CONSTRAINT borrow_details_pkey PRIMARY KEY (listing_id);
ALTER TABLE public.categories ADD CONSTRAINT categories_pkey PRIMARY KEY (id);
ALTER TABLE public.colleges ADD CONSTRAINT colleges_pkey PRIMARY KEY (id);
ALTER TABLE public.listing_images ADD CONSTRAINT listing_images_pkey PRIMARY KEY (id);
ALTER TABLE public.listings ADD CONSTRAINT listings_pkey PRIMARY KEY (id);
ALTER TABLE public.need_posts ADD CONSTRAINT need_posts_pkey PRIMARY KEY (id);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
ALTER TABLE public.reports ADD CONSTRAINT reports_pkey PRIMARY KEY (id);
ALTER TABLE public.requests ADD CONSTRAINT requests_pkey PRIMARY KEY (id);
ALTER TABLE public.reviews ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);
ALTER TABLE public.sale_details ADD CONSTRAINT sale_details_pkey PRIMARY KEY (listing_id);
ALTER TABLE public.service_details ADD CONSTRAINT service_details_pkey PRIMARY KEY (listing_id);
ALTER TABLE public.student_verifications ADD CONSTRAINT student_verifications_pkey PRIMARY KEY (id);
ALTER TABLE public.team_members ADD CONSTRAINT team_members_pkey PRIMARY KEY (user_id);
ALTER TABLE public.transaction_photos ADD CONSTRAINT transaction_photos_pkey PRIMARY KEY (id);
ALTER TABLE public.transactions ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);
ALTER TABLE public.user_blocks ADD CONSTRAINT user_blocks_pkey PRIMARY KEY (blocker_id, blocked_id);

-- Unique constraints
ALTER TABLE public.categories ADD CONSTRAINT categories_id_listing_type_key UNIQUE (id, listing_type);
ALTER TABLE public.categories ADD CONSTRAINT categories_name_listing_type_key UNIQUE (name, listing_type);
ALTER TABLE public.categories ADD CONSTRAINT categories_slug_key UNIQUE (slug);
ALTER TABLE public.colleges ADD CONSTRAINT colleges_name_key UNIQUE (name);
ALTER TABLE public.colleges ADD CONSTRAINT colleges_slug_key UNIQUE (slug);
ALTER TABLE public.listing_images ADD CONSTRAINT listing_images_storage_path_key UNIQUE (storage_path);
ALTER TABLE public.listings ADD CONSTRAINT listings_id_type_unique UNIQUE (id, listing_type);
ALTER TABLE public.requests ADD CONSTRAINT requests_id_request_type_key UNIQUE (id, request_type);
ALTER TABLE public.reviews ADD CONSTRAINT reviews_transaction_id_reviewer_id_key UNIQUE (transaction_id, reviewer_id);
ALTER TABLE public.student_verifications ADD CONSTRAINT student_verifications_profile_id_key UNIQUE (profile_id);
ALTER TABLE public.transaction_photos ADD CONSTRAINT transaction_photos_storage_path_key UNIQUE (storage_path);
ALTER TABLE public.transactions ADD CONSTRAINT transactions_request_id_key UNIQUE (request_id);

-- Check constraints
ALTER TABLE public.borrow_details ADD CONSTRAINT borrow_dates_valid CHECK (((available_until IS NULL) OR (available_from IS NULL) OR (available_until >= available_from)));
ALTER TABLE public.borrow_details ADD CONSTRAINT borrow_details_expected_deposit_check CHECK ((expected_deposit >= (0)::numeric));
ALTER TABLE public.borrow_details ADD CONSTRAINT borrow_details_listing_type_check CHECK ((listing_type = 'borrow'::text));
ALTER TABLE public.borrow_details ADD CONSTRAINT borrow_details_max_duration_days_check CHECK ((max_duration_days > 0));
ALTER TABLE public.categories ADD CONSTRAINT categories_listing_type_check CHECK ((listing_type = ANY (ARRAY['borrow'::text, 'service'::text, 'sale'::text])));
ALTER TABLE public.listing_images ADD CONSTRAINT listing_images_sort_order_check CHECK ((sort_order >= 0));
ALTER TABLE public.listings ADD CONSTRAINT listings_listing_type_check CHECK ((listing_type = ANY (ARRAY['borrow'::text, 'service'::text, 'sale'::text])));
ALTER TABLE public.listings ADD CONSTRAINT listings_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'active'::text, 'paused'::text, 'closed'::text, 'sold'::text])));
ALTER TABLE public.listings ADD CONSTRAINT listings_title_check CHECK ((length(TRIM(BOTH FROM title)) > 0));
ALTER TABLE public.need_posts ADD CONSTRAINT need_posts_need_type_check CHECK ((need_type = ANY (ARRAY['borrow'::text, 'service'::text, 'sale'::text])));
ALTER TABLE public.need_posts ADD CONSTRAINT need_posts_status_check CHECK ((status = ANY (ARRAY['open'::text, 'matched'::text, 'closed'::text])));
ALTER TABLE public.need_posts ADD CONSTRAINT need_posts_title_check CHECK ((length(TRIM(BOTH FROM title)) > 0));
ALTER TABLE public.profiles ADD CONSTRAINT profiles_year_of_study_check CHECK (((year_of_study >= 1) AND (year_of_study <= 8)));
ALTER TABLE public.reports ADD CONSTRAINT reports_check CHECK (((reported_user_id IS NOT NULL) OR (listing_id IS NOT NULL)));
ALTER TABLE public.reports ADD CONSTRAINT reports_check1 CHECK (((reported_user_id IS NULL) OR (reported_user_id <> reporter_id)));
ALTER TABLE public.reports ADD CONSTRAINT reports_status_check CHECK ((status = ANY (ARRAY['open'::text, 'reviewing'::text, 'resolved'::text, 'dismissed'::text])));
ALTER TABLE public.requests ADD CONSTRAINT requests_check CHECK (((requested_end IS NULL) OR (requested_start IS NULL) OR (requested_end >= requested_start)));
ALTER TABLE public.requests ADD CONSTRAINT requests_request_type_check CHECK ((request_type = ANY (ARRAY['borrow'::text, 'service'::text, 'purchase'::text])));
ALTER TABLE public.requests ADD CONSTRAINT requests_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text, 'cancelled'::text, 'completed'::text])));
ALTER TABLE public.reviews ADD CONSTRAINT reviews_check CHECK ((reviewer_id <> reviewee_id));
ALTER TABLE public.reviews ADD CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)));
ALTER TABLE public.sale_details ADD CONSTRAINT sale_details_item_condition_check CHECK ((item_condition = ANY (ARRAY['new'::text, 'like_new'::text, 'good'::text, 'fair'::text, 'poor'::text])));
ALTER TABLE public.sale_details ADD CONSTRAINT sale_details_listing_type_check CHECK ((listing_type = 'sale'::text));
ALTER TABLE public.sale_details ADD CONSTRAINT sale_details_price_check CHECK ((price >= (0)::numeric));
ALTER TABLE public.service_details ADD CONSTRAINT service_details_listing_type_check CHECK ((listing_type = 'service'::text));
ALTER TABLE public.service_details ADD CONSTRAINT service_details_price_check CHECK (((price IS NULL) OR (price >= (0)::numeric)));
ALTER TABLE public.service_details ADD CONSTRAINT service_details_pricing_type_check CHECK ((pricing_type = ANY (ARRAY['fixed'::text, 'hourly'::text, 'negotiable'::text, 'free'::text])));
ALTER TABLE public.service_details ADD CONSTRAINT service_price_valid CHECK ((((pricing_type = ANY (ARRAY['fixed'::text, 'hourly'::text])) AND (price IS NOT NULL)) OR ((pricing_type = ANY (ARRAY['negotiable'::text, 'free'::text])) AND (price IS NULL))));
ALTER TABLE public.student_verifications ADD CONSTRAINT rejection_reason_valid CHECK (((status <> 'rejected'::text) OR (NULLIF(TRIM(BOTH FROM rejection_reason), ''::text) IS NOT NULL)));
ALTER TABLE public.student_verifications ADD CONSTRAINT student_verifications_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])));
ALTER TABLE public.student_verifications ADD CONSTRAINT verification_review_fields_valid CHECK ((((status = 'pending'::text) AND (reviewed_by IS NULL) AND (reviewed_at IS NULL)) OR ((status = ANY (ARRAY['approved'::text, 'rejected'::text])) AND (reviewed_by IS NOT NULL) AND (reviewed_at IS NOT NULL))));
ALTER TABLE public.team_members ADD CONSTRAINT team_members_role_check CHECK ((role = ANY (ARRAY['reviewer'::text, 'admin'::text])));
ALTER TABLE public.transaction_photos ADD CONSTRAINT transaction_photos_photo_type_check CHECK ((photo_type = ANY (ARRAY['handover'::text, 'return'::text, 'condition'::text, 'other'::text])));
ALTER TABLE public.transactions ADD CONSTRAINT transactions_agreed_amount_check CHECK ((agreed_amount >= (0)::numeric));
ALTER TABLE public.transactions ADD CONSTRAINT transactions_check CHECK ((lender_or_seller_id <> borrower_or_buyer_id));
ALTER TABLE public.transactions ADD CONSTRAINT transactions_check1 CHECK (((due_date IS NULL) OR (start_date IS NULL) OR (due_date >= start_date)));
ALTER TABLE public.transactions ADD CONSTRAINT transactions_check2 CHECK ((((transaction_type = 'borrow'::text) AND (request_type = 'borrow'::text)) OR ((transaction_type = 'service'::text) AND (request_type = 'service'::text)) OR ((transaction_type = 'sale'::text) AND (request_type = 'purchase'::text))));
ALTER TABLE public.transactions ADD CONSTRAINT transactions_status_check CHECK ((status = ANY (ARRAY['in_progress'::text, 'returned'::text, 'completed'::text, 'cancelled'::text, 'disputed'::text])));
ALTER TABLE public.transactions ADD CONSTRAINT transactions_transaction_type_check CHECK ((transaction_type = ANY (ARRAY['borrow'::text, 'service'::text, 'sale'::text])));
ALTER TABLE public.user_blocks ADD CONSTRAINT user_blocks_check CHECK ((blocker_id <> blocked_id));

-- Foreign keys
ALTER TABLE public.borrow_details ADD CONSTRAINT borrow_details_listing_id_listing_type_fkey FOREIGN KEY (listing_id, listing_type) REFERENCES public.listings(id, listing_type) ON DELETE CASCADE;
ALTER TABLE public.listing_images ADD CONSTRAINT listing_images_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;
ALTER TABLE public.listings ADD CONSTRAINT listings_category_type_fk FOREIGN KEY (category_id, listing_type) REFERENCES public.categories(id, listing_type);
ALTER TABLE public.listings ADD CONSTRAINT listings_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.need_posts ADD CONSTRAINT need_posts_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;
ALTER TABLE public.need_posts ADD CONSTRAINT need_posts_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_college_id_fkey FOREIGN KEY (college_id) REFERENCES public.colleges(id);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.reports ADD CONSTRAINT reports_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE RESTRICT;
ALTER TABLE public.reports ADD CONSTRAINT reports_reported_user_id_fkey FOREIGN KEY (reported_user_id) REFERENCES public.profiles(id) ON DELETE RESTRICT;
ALTER TABLE public.reports ADD CONSTRAINT reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.profiles(id) ON DELETE RESTRICT;
ALTER TABLE public.requests ADD CONSTRAINT requests_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE RESTRICT;
ALTER TABLE public.requests ADD CONSTRAINT requests_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES public.profiles(id) ON DELETE RESTRICT;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_reviewee_id_fkey FOREIGN KEY (reviewee_id) REFERENCES public.profiles(id) ON DELETE RESTRICT;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.profiles(id) ON DELETE RESTRICT;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(id) ON DELETE CASCADE;
ALTER TABLE public.sale_details ADD CONSTRAINT sale_details_listing_id_listing_type_fkey FOREIGN KEY (listing_id, listing_type) REFERENCES public.listings(id, listing_type) ON DELETE CASCADE;
ALTER TABLE public.service_details ADD CONSTRAINT service_details_listing_id_listing_type_fkey FOREIGN KEY (listing_id, listing_type) REFERENCES public.listings(id, listing_type) ON DELETE CASCADE;
ALTER TABLE public.student_verifications ADD CONSTRAINT student_verifications_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.student_verifications ADD CONSTRAINT student_verifications_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.team_members(user_id) ON DELETE SET NULL;
ALTER TABLE public.team_members ADD CONSTRAINT team_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.transaction_photos ADD CONSTRAINT transaction_photos_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(id) ON DELETE CASCADE;
ALTER TABLE public.transaction_photos ADD CONSTRAINT transaction_photos_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id) ON DELETE RESTRICT;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_borrower_or_buyer_id_fkey FOREIGN KEY (borrower_or_buyer_id) REFERENCES public.profiles(id) ON DELETE RESTRICT;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_lender_or_seller_id_fkey FOREIGN KEY (lender_or_seller_id) REFERENCES public.profiles(id) ON DELETE RESTRICT;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_request_id_request_type_fkey FOREIGN KEY (request_id, request_type) REFERENCES public.requests(id, request_type) ON DELETE RESTRICT;
ALTER TABLE public.user_blocks ADD CONSTRAINT user_blocks_blocked_id_fkey FOREIGN KEY (blocked_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.user_blocks ADD CONSTRAINT user_blocks_blocker_id_fkey FOREIGN KEY (blocker_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- =====================================================================
-- 3. INDEXES
-- =====================================================================

CREATE INDEX listing_images_listing_idx ON public.listing_images USING btree (listing_id, sort_order);
CREATE INDEX listings_browse_idx ON public.listings USING btree (listing_type, status, category_id, created_at DESC);
CREATE INDEX listings_owner_idx ON public.listings USING btree (owner_id);
CREATE INDEX listings_search_idx ON public.listings USING gin (to_tsvector('english'::regconfig, ((title || ' '::text) || COALESCE(description, ''::text))));
CREATE INDEX need_posts_open_idx ON public.need_posts USING btree (need_type, status, created_at DESC);
CREATE INDEX need_posts_student_idx ON public.need_posts USING btree (student_id);
CREATE INDEX profiles_college_idx ON public.profiles USING btree (college_id);
CREATE INDEX reports_status_idx ON public.reports USING btree (status);
CREATE INDEX requests_listing_idx ON public.requests USING btree (listing_id, status);
CREATE INDEX requests_requester_idx ON public.requests USING btree (requester_id, status);
CREATE INDEX reviews_reviewee_idx ON public.reviews USING btree (reviewee_id);
CREATE INDEX verifications_status_idx ON public.student_verifications USING btree (status);
CREATE INDEX transaction_photos_txn_idx ON public.transaction_photos USING btree (transaction_id);
CREATE INDEX transactions_borrower_idx ON public.transactions USING btree (borrower_or_buyer_id, status);
CREATE INDEX transactions_lender_idx ON public.transactions USING btree (lender_or_seller_id, status);

-- =====================================================================
-- 4. FUNCTIONS
-- =====================================================================

-- Which college does the logged-in student belong to?
CREATE OR REPLACE FUNCTION public.current_college_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$ select college_id from public.profiles where id = auth.uid() $function$;

-- Is there a block between the logged-in student and another student (either direction)?
CREATE OR REPLACE FUNCTION public.is_blocked_with(other uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$ select exists (
  select 1 from public.user_blocks
  where (blocker_id = auth.uid() and blocked_id = other)
     or (blocker_id = other and blocked_id = auth.uid())
) $function$;

-- Is the logged-in user an active team member (reviewer/admin)?
CREATE OR REPLACE FUNCTION public.is_team_member()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$ select exists (select 1 from public.team_members where user_id = auth.uid() and active) $function$;

-- Keeps updated_at fresh.
CREATE OR REPLACE FUNCTION public.touch_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$ begin new.updated_at = now(); return new; end $function$;

-- On signup: create a profile and link the college by email domain (e.g. s.amity.edu).
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$declare v_college uuid;
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
end$function$;

-- Rules for changing a request: requester can only cancel; owner can only accept/reject/complete.
CREATE OR REPLACE FUNCTION public.guard_request_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_owner uuid;
begin
  if auth.uid() is null then
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
end $function$;

-- Accepting a request creates a transaction (and marks a purchased listing as sold).
CREATE OR REPLACE FUNCTION public.on_request_accepted()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
end $function$;

-- Transaction details are locked after creation; completing stamps completed_at.
CREATE OR REPLACE FUNCTION public.guard_transaction_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
end $function$;

-- =====================================================================
-- 5. VIEWS
-- =====================================================================

CREATE OR REPLACE VIEW public.profile_ratings AS
 SELECT reviewee_id AS profile_id,
    round(avg(rating), 1) AS avg_rating,
    (count(*))::integer AS review_count
   FROM public.reviews
  GROUP BY reviewee_id;

-- One row per listing for browse/search screens.
CREATE OR REPLACE VIEW public.listing_cards AS
 SELECT l.id,
    l.listing_type,
    l.title,
    l.description,
    l.status,
    l.created_at,
    l.category_id,
    c.name AS category_name,
    c.slug AS category_slug,
    l.owner_id,
    p.full_name AS owner_name,
    p.department AS owner_department,
    r.avg_rating AS owner_rating,
    COALESCE(r.review_count, 0) AS owner_review_count,
    COALESCE(sa.price, se.price) AS price,
    se.pricing_type,
    se.availability_notes,
    sa.item_condition,
    b.max_duration_days,
    b.expected_deposit,
    b.available_from,
    b.available_until,
    ( SELECT li.storage_path
           FROM public.listing_images li
          WHERE (li.listing_id = l.id)
          ORDER BY li.sort_order, li.created_at
         LIMIT 1) AS cover_image_path
   FROM ((((((public.listings l
     JOIN public.categories c ON ((c.id = l.category_id)))
     JOIN public.profiles p ON ((p.id = l.owner_id)))
     LEFT JOIN public.profile_ratings r ON ((r.profile_id = l.owner_id)))
     LEFT JOIN public.sale_details sa ON ((sa.listing_id = l.id)))
     LEFT JOIN public.service_details se ON ((se.listing_id = l.id)))
     LEFT JOIN public.borrow_details b ON ((b.listing_id = l.id)));

-- =====================================================================
-- 6. TRIGGERS
-- =====================================================================

CREATE TRIGGER touch_listings BEFORE UPDATE ON public.listings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER touch_need_posts BEFORE UPDATE ON public.need_posts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER touch_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER guard_request_update BEFORE UPDATE ON public.requests FOR EACH ROW EXECUTE FUNCTION public.guard_request_update();
CREATE TRIGGER on_request_accepted AFTER UPDATE ON public.requests FOR EACH ROW EXECUTE FUNCTION public.on_request_accepted();
CREATE TRIGGER guard_transaction_update BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.guard_transaction_update();
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================================
-- 7. ROW LEVEL SECURITY
-- =====================================================================

ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.borrow_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.need_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_verifications ENABLE ROW LEVEL SECURITY;

-- colleges / categories: anyone can read
CREATE POLICY colleges_read ON public.colleges AS PERMISSIVE FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY categories_read ON public.categories AS PERMISSIVE FOR SELECT TO anon, authenticated USING (true);

-- profiles: same college only; edit your own
CREATE POLICY profiles_read ON public.profiles AS PERMISSIVE FOR SELECT TO authenticated
  USING (((id = auth.uid()) OR (college_id = current_college_id())));
CREATE POLICY profiles_update_own ON public.profiles AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((id = auth.uid()))
  WITH CHECK (((id = auth.uid()) AND (college_id = current_college_id())));

-- listings: own college, active/sold only, not blocked; owners manage their own
CREATE POLICY listings_read ON public.listings AS PERMISSIVE FOR SELECT TO authenticated
  USING (((owner_id = auth.uid()) OR ((status = ANY (ARRAY['active'::text, 'sold'::text])) AND (NOT is_blocked_with(owner_id)) AND (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = listings.owner_id) AND (p.college_id = current_college_id())))))));
CREATE POLICY listings_insert_own ON public.listings AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((owner_id = auth.uid()));
CREATE POLICY listings_update_own ON public.listings AS PERMISSIVE FOR UPDATE TO authenticated USING ((owner_id = auth.uid())) WITH CHECK ((owner_id = auth.uid()));
CREATE POLICY listings_delete_own ON public.listings AS PERMISSIVE FOR DELETE TO authenticated USING ((owner_id = auth.uid()));

-- borrow_details / service_details / sale_details / listing_images:
-- readable if you can see the listing; only the listing owner can write
CREATE POLICY borrow_details_read ON public.borrow_details AS PERMISSIVE FOR SELECT TO authenticated
  USING ((EXISTS ( SELECT 1 FROM listings l WHERE (l.id = borrow_details.listing_id))));
CREATE POLICY borrow_details_owner_write ON public.borrow_details AS PERMISSIVE FOR ALL TO authenticated
  USING ((EXISTS ( SELECT 1 FROM listings l WHERE ((l.id = borrow_details.listing_id) AND (l.owner_id = auth.uid())))))
  WITH CHECK ((EXISTS ( SELECT 1 FROM listings l WHERE ((l.id = borrow_details.listing_id) AND (l.owner_id = auth.uid())))));

CREATE POLICY service_details_read ON public.service_details AS PERMISSIVE FOR SELECT TO authenticated
  USING ((EXISTS ( SELECT 1 FROM listings l WHERE (l.id = service_details.listing_id))));
CREATE POLICY service_details_owner_write ON public.service_details AS PERMISSIVE FOR ALL TO authenticated
  USING ((EXISTS ( SELECT 1 FROM listings l WHERE ((l.id = service_details.listing_id) AND (l.owner_id = auth.uid())))))
  WITH CHECK ((EXISTS ( SELECT 1 FROM listings l WHERE ((l.id = service_details.listing_id) AND (l.owner_id = auth.uid())))));

CREATE POLICY sale_details_read ON public.sale_details AS PERMISSIVE FOR SELECT TO authenticated
  USING ((EXISTS ( SELECT 1 FROM listings l WHERE (l.id = sale_details.listing_id))));
CREATE POLICY sale_details_owner_write ON public.sale_details AS PERMISSIVE FOR ALL TO authenticated
  USING ((EXISTS ( SELECT 1 FROM listings l WHERE ((l.id = sale_details.listing_id) AND (l.owner_id = auth.uid())))))
  WITH CHECK ((EXISTS ( SELECT 1 FROM listings l WHERE ((l.id = sale_details.listing_id) AND (l.owner_id = auth.uid())))));

CREATE POLICY listing_images_read ON public.listing_images AS PERMISSIVE FOR SELECT TO authenticated
  USING ((EXISTS ( SELECT 1 FROM listings l WHERE (l.id = listing_images.listing_id))));
CREATE POLICY listing_images_owner_write ON public.listing_images AS PERMISSIVE FOR ALL TO authenticated
  USING ((EXISTS ( SELECT 1 FROM listings l WHERE ((l.id = listing_images.listing_id) AND (l.owner_id = auth.uid())))))
  WITH CHECK ((EXISTS ( SELECT 1 FROM listings l WHERE ((l.id = listing_images.listing_id) AND (l.owner_id = auth.uid())))));

-- need_posts: own college, not blocked; manage your own
CREATE POLICY need_posts_read ON public.need_posts AS PERMISSIVE FOR SELECT TO authenticated
  USING (((student_id = auth.uid()) OR ((NOT is_blocked_with(student_id)) AND (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = need_posts.student_id) AND (p.college_id = current_college_id())))))));
CREATE POLICY need_posts_insert_own ON public.need_posts AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((student_id = auth.uid()));
CREATE POLICY need_posts_update_own ON public.need_posts AS PERMISSIVE FOR UPDATE TO authenticated USING ((student_id = auth.uid())) WITH CHECK ((student_id = auth.uid()));
CREATE POLICY need_posts_delete_own ON public.need_posts AS PERMISSIVE FOR DELETE TO authenticated USING ((student_id = auth.uid()));

-- requests: visible only to the requester and the listing owner
CREATE POLICY requests_read ON public.requests AS PERMISSIVE FOR SELECT TO authenticated
  USING (((requester_id = auth.uid()) OR (EXISTS ( SELECT 1 FROM listings l WHERE ((l.id = requests.listing_id) AND (l.owner_id = auth.uid()))))));
CREATE POLICY requests_insert ON public.requests AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (((requester_id = auth.uid()) AND (EXISTS ( SELECT 1 FROM listings l WHERE ((l.id = requests.listing_id) AND (l.status = 'active'::text) AND (l.owner_id <> auth.uid()))))));
CREATE POLICY requests_update ON public.requests AS PERMISSIVE FOR UPDATE TO authenticated
  USING (((requester_id = auth.uid()) OR (EXISTS ( SELECT 1 FROM listings l WHERE ((l.id = requests.listing_id) AND (l.owner_id = auth.uid()))))))
  WITH CHECK ((requester_id = ( SELECT r.requester_id FROM requests r WHERE (r.id = requests.id))));

-- transactions / photos: only the two people involved
CREATE POLICY transactions_read ON public.transactions AS PERMISSIVE FOR SELECT TO authenticated
  USING (((auth.uid() = lender_or_seller_id) OR (auth.uid() = borrower_or_buyer_id)));
CREATE POLICY transactions_update ON public.transactions AS PERMISSIVE FOR UPDATE TO authenticated
  USING (((auth.uid() = lender_or_seller_id) OR (auth.uid() = borrower_or_buyer_id)))
  WITH CHECK (((auth.uid() = lender_or_seller_id) OR (auth.uid() = borrower_or_buyer_id)));

CREATE POLICY txn_photos_read ON public.transaction_photos AS PERMISSIVE FOR SELECT TO authenticated
  USING ((EXISTS ( SELECT 1 FROM transactions t WHERE ((t.id = transaction_photos.transaction_id) AND ((auth.uid() = t.lender_or_seller_id) OR (auth.uid() = t.borrower_or_buyer_id))))));
CREATE POLICY txn_photos_insert ON public.transaction_photos AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (((uploaded_by = auth.uid()) AND (EXISTS ( SELECT 1 FROM transactions t WHERE ((t.id = transaction_photos.transaction_id) AND ((auth.uid() = t.lender_or_seller_id) OR (auth.uid() = t.borrower_or_buyer_id)))))));

-- reviews: readable by all logged-in users; only after a completed transaction between the two people
CREATE POLICY reviews_read ON public.reviews AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY reviews_insert ON public.reviews AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (((reviewer_id = auth.uid()) AND (EXISTS ( SELECT 1 FROM transactions t WHERE ((t.id = reviews.transaction_id) AND (t.status = 'completed'::text) AND (((t.lender_or_seller_id = auth.uid()) AND (t.borrower_or_buyer_id = reviews.reviewee_id)) OR ((t.borrower_or_buyer_id = auth.uid()) AND (t.lender_or_seller_id = reviews.reviewee_id))))))));

-- reports: reporter + team members
CREATE POLICY reports_insert ON public.reports AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((reporter_id = auth.uid()));
CREATE POLICY reports_read ON public.reports AS PERMISSIVE FOR SELECT TO authenticated USING (((reporter_id = auth.uid()) OR is_team_member()));
CREATE POLICY reports_team_update ON public.reports AS PERMISSIVE FOR UPDATE TO authenticated USING (is_team_member()) WITH CHECK (is_team_member());

-- user_blocks: you only see and manage your own blocks
CREATE POLICY blocks_read_own ON public.user_blocks AS PERMISSIVE FOR SELECT TO authenticated USING ((blocker_id = auth.uid()));
CREATE POLICY blocks_insert_own ON public.user_blocks AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((blocker_id = auth.uid()) AND (blocked_id <> auth.uid())));
CREATE POLICY blocks_delete_own ON public.user_blocks AS PERMISSIVE FOR DELETE TO authenticated USING ((blocker_id = auth.uid()));

-- student_verifications / team_members
CREATE POLICY verif_read ON public.student_verifications AS PERMISSIVE FOR SELECT TO authenticated USING (((profile_id = auth.uid()) OR is_team_member()));
CREATE POLICY verif_insert_own ON public.student_verifications AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((profile_id = auth.uid()) AND (status = 'pending'::text)));
CREATE POLICY verif_team_update ON public.student_verifications AS PERMISSIVE FOR UPDATE TO authenticated USING (is_team_member()) WITH CHECK (is_team_member());
CREATE POLICY team_members_read ON public.team_members AS PERMISSIVE FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR is_team_member()));

-- =====================================================================
-- 8. STORAGE BUCKETS + POLICIES
-- =====================================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('listing-images', 'listing-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('transaction-photos', 'transaction-photos', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('verification-docs', 'verification-docs', false) ON CONFLICT (id) DO NOTHING;

-- listing-images: upload into your own folder (<user_id>/...)
CREATE POLICY listing_images_read ON storage.objects AS PERMISSIVE FOR SELECT TO authenticated
  USING ((bucket_id = 'listing-images'::text));
CREATE POLICY listing_images_insert ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (((bucket_id = 'listing-images'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
CREATE POLICY listing_images_update ON storage.objects AS PERMISSIVE FOR UPDATE TO authenticated
  USING (((bucket_id = 'listing-images'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
CREATE POLICY listing_images_delete ON storage.objects AS PERMISSIVE FOR DELETE TO authenticated
  USING (((bucket_id = 'listing-images'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

-- transaction-photos: folder name = transaction id; only the two people involved
CREATE POLICY txn_photos_storage_read ON storage.objects AS PERMISSIVE FOR SELECT TO authenticated
  USING (((bucket_id = 'transaction-photos'::text) AND (EXISTS ( SELECT 1 FROM transactions t WHERE (((t.id)::text = (storage.foldername(objects.name))[1]) AND ((auth.uid() = t.lender_or_seller_id) OR (auth.uid() = t.borrower_or_buyer_id)))))));
CREATE POLICY txn_photos_storage_insert ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (((bucket_id = 'transaction-photos'::text) AND (EXISTS ( SELECT 1 FROM transactions t WHERE (((t.id)::text = (storage.foldername(objects.name))[1]) AND ((auth.uid() = t.lender_or_seller_id) OR (auth.uid() = t.borrower_or_buyer_id)))))));

-- verification-docs: upload into your own folder; you or a team member can read
CREATE POLICY verif_docs_insert ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (((bucket_id = 'verification-docs'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
CREATE POLICY verif_docs_read ON storage.objects AS PERMISSIVE FOR SELECT TO authenticated
  USING (((bucket_id = 'verification-docs'::text) AND (((storage.foldername(name))[1] = (auth.uid())::text) OR is_team_member())));

-- NOTE: the live project ALSO has an extra bucket 'student-verification-documents' with two
-- policies ("Students upload own verification documents" / "Students read own verification
-- documents"). It is not part of the original design and looks like a leftover duplicate of
-- 'verification-docs'. It is intentionally NOT included here. Drop it in the live project
-- if nothing uses it.
