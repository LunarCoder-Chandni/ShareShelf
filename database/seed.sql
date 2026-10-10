-- =====================================================================
-- ShareShelf - seed.sql
-- Fictional demo data for the hackathon. Safe to run more than once.
-- Run AFTER schema.sql, in the Supabase SQL Editor.
--
-- The 4 demo students below are data only: they have no password, so
-- nobody can log in as them. Sign up with your own @s.amity.edu email
-- to test the app; you will see these listings because you are in the
-- same college.
-- =====================================================================

-- 1. Four fictional students (profile rows are created by the signup trigger)
insert into auth.users
  (instance_id, id, aud, role, email, email_confirmed_at,
   raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000','a0000000-0000-0000-0000-000000000001','authenticated','authenticated',
   'demo.aarav@s.amity.edu', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Aarav Sharma"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000','a0000000-0000-0000-0000-000000000002','authenticated','authenticated',
   'demo.meera@s.amity.edu', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Meera Nair"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000','a0000000-0000-0000-0000-000000000003','authenticated','authenticated',
   'demo.rohan@s.amity.edu', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Rohan Verma"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000','a0000000-0000-0000-0000-000000000004','authenticated','authenticated',
   'demo.ananya@s.amity.edu', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Ananya Gupta"}', now(), now())
on conflict (id) do nothing;

update public.profiles set department = 'Computer Science',  year_of_study = 2 where id = 'a0000000-0000-0000-0000-000000000001';
update public.profiles set department = 'Electronics',       year_of_study = 3 where id = 'a0000000-0000-0000-0000-000000000002';
update public.profiles set department = 'Mechanical',        year_of_study = 2 where id = 'a0000000-0000-0000-0000-000000000003';
update public.profiles set department = 'Design',            year_of_study = 1 where id = 'a0000000-0000-0000-0000-000000000004';

-- 2. Listings (8 borrow, 8 services, 8 for sale)
insert into public.listings (id, owner_id, category_id, listing_type, title, description, status) values
  -- Borrow & Lend
  ('b0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001',(select id from public.categories where slug='borrow-electronics'),'borrow',
   'Arduino UNO R3','Original board with USB cable. Works perfectly, good for lab projects.','active'),
  ('b0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000003',(select id from public.categories where slug='borrow-tools'),'borrow',
   'Soldering Iron Kit','Iron, stand, solder wire and flux. Please return it clean.','active'),
  ('b0000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000002',(select id from public.categories where slug='borrow-lab'),'borrow',
   'Lab Coat (Size M)','Clean lab coat, washed before every lending.','active'),
  ('b0000000-0000-0000-0000-000000000004','a0000000-0000-0000-0000-000000000004',(select id from public.categories where slug='borrow-books'),'borrow',
   'Engineering Mechanics Textbook','Good condition, no torn pages. Handy for exam week.','active'),
  ('b0000000-0000-0000-0000-000000000005','a0000000-0000-0000-0000-000000000001',(select id from public.categories where slug='borrow-tools'),'borrow',
   'Digital Multimeter','Auto-ranging multimeter with probes.','active'),
  -- Student Services
  ('b0000000-0000-0000-0000-000000000006','a0000000-0000-0000-0000-000000000002',(select id from public.categories where slug='service-ppt'),'service',
   'PPT Designing','Clean, consistent slide decks for projects and presentations.','active'),
  ('b0000000-0000-0000-0000-000000000007','a0000000-0000-0000-0000-000000000004',(select id from public.categories where slug='service-graphic'),'service',
   'Canva Poster & Logo Design','Event posters, social media posts and simple logos.','active'),
  ('b0000000-0000-0000-0000-000000000008','a0000000-0000-0000-0000-000000000001',(select id from public.categories where slug='service-tutoring'),'service',
   'Data Structures Tutoring','C/C++ data structures, step by step with practice problems.','active'),
  ('b0000000-0000-0000-0000-000000000009','a0000000-0000-0000-0000-000000000003',(select id from public.categories where slug='service-resume'),'service',
   'Resume Formatting','One-page ATS-friendly resume layout.','active'),
  ('b0000000-0000-0000-0000-000000000010','a0000000-0000-0000-0000-000000000003',(select id from public.categories where slug='service-video'),'service',
   'Video Editing for Reels & Projects','Cuts, captions and basic colour grading. Price depends on length.','active'),
  -- Buying & Selling
  ('b0000000-0000-0000-0000-000000000011','a0000000-0000-0000-0000-000000000003',(select id from public.categories where slug='sale-lab-coats'),'sale',
   'Lab Coat (Size L), barely used','Worn only a few times. Selling because I am graduating out of the lab.','active'),
  ('b0000000-0000-0000-0000-000000000012','a0000000-0000-0000-0000-000000000004',(select id from public.categories where slug='sale-stationery'),'sale',
   'A2 Drawing Sheets (pack of 10)','Unopened pack of drawing sheets.','active'),
  ('b0000000-0000-0000-0000-000000000013','a0000000-0000-0000-0000-000000000002',(select id from public.categories where slug='sale-calculators'),'sale',
   'Scientific Calculator','Fully working scientific calculator with cover.','active'),
  ('b0000000-0000-0000-0000-000000000014','a0000000-0000-0000-0000-000000000001',(select id from public.categories where slug='sale-textbooks'),'sale',
   'Engineering Physics Textbook','Some highlighting in the first chapters, otherwise clean.','active'),
  ('b0000000-0000-0000-0000-000000000015','a0000000-0000-0000-0000-000000000002',(select id from public.categories where slug='sale-components'),'sale',
   'Breadboard + Jumper Wire Kit','Breadboard with a full set of jumper wires, used for one project.','active'),
  ('b0000000-0000-0000-0000-000000000016','a0000000-0000-0000-0000-000000000001',(select id from public.categories where slug='borrow-drafting'),'borrow',
   'Scientific Calculator for Short-Term Borrow','Fully working scientific calculator with protective case. Available for exam and lab use.','active'),
  ('b0000000-0000-0000-0000-000000000017','a0000000-0000-0000-0000-000000000003',(select id from public.categories where slug='borrow-electronics'),'borrow',
   'Arduino UNO Starter Kit','Arduino UNO board with USB cable and a small set of jumper wires for coursework.','active'),
  ('b0000000-0000-0000-0000-000000000018','a0000000-0000-0000-0000-000000000002',(select id from public.categories where slug='borrow-sheet-holders'),'borrow',
   'A2 Drawing Board and Sheet Holder','Drawing board with clips and a reusable sheet holder. Please return in good condition.','active'),
  ('b0000000-0000-0000-0000-000000000019','a0000000-0000-0000-0000-000000000004',(select id from public.categories where slug='service-ppt'),'service',
   'PPT Creation for Class Projects','Custom slide deck with clean layouts, diagrams and consistent formatting.','active'),
  ('b0000000-0000-0000-0000-000000000020','a0000000-0000-0000-0000-000000000001',(select id from public.categories where slug='service-tutoring'),'service',
   'Math and Physics Tutoring','One-to-one help with engineering math and introductory physics problem solving.','active'),
  ('b0000000-0000-0000-0000-000000000021','a0000000-0000-0000-0000-000000000003',(select id from public.categories where slug='service-vfx'),'service',
   'Short Video VFX and Animation','Basic motion graphics, titles and visual effects for student project videos.','active'),
  ('b0000000-0000-0000-0000-000000000022','a0000000-0000-0000-0000-000000000002',(select id from public.categories where slug='sale-sheet-holders'),'sale',
   'Drawing Sheet Holder and Clips','Reusable holder and clips for A2 drawing sheets.','active'),
  ('b0000000-0000-0000-0000-000000000023','a0000000-0000-0000-0000-000000000004',(select id from public.categories where slug='sale-art'),'sale',
   'Canvas and Art Starter Set','Small canvas board set with unused basic brushes.','active'),
  ('b0000000-0000-0000-0000-000000000024','a0000000-0000-0000-0000-000000000003',(select id from public.categories where slug='sale-drafting-tools'),'sale',
   'Mini Drafter with Drafting Tools','Mini drafter and basic drafting tools in working condition.','active')
on conflict (id) do nothing;

insert into public.borrow_details (listing_id, max_duration_days, expected_deposit) values
  ('b0000000-0000-0000-0000-000000000001', 3, 100),
  ('b0000000-0000-0000-0000-000000000002', 2, 150),
  ('b0000000-0000-0000-0000-000000000003', 3, 50),
  ('b0000000-0000-0000-0000-000000000004', 7, 0),
  ('b0000000-0000-0000-0000-000000000005', 2, 200),
  ('b0000000-0000-0000-0000-000000000016', 5, 100),
  ('b0000000-0000-0000-0000-000000000017', 7, 150),
  ('b0000000-0000-0000-0000-000000000018', 3, 100)
on conflict (listing_id) do nothing;

insert into public.service_details (listing_id, pricing_type, price, availability_notes) values
  ('b0000000-0000-0000-0000-000000000006', 'fixed',      150, 'Delivery in 1 day'),
  ('b0000000-0000-0000-0000-000000000007', 'fixed',      100, 'Delivery in 1-2 days'),
  ('b0000000-0000-0000-0000-000000000008', 'hourly',     200, 'Evenings and weekends'),
  ('b0000000-0000-0000-0000-000000000009', 'fixed',       80, 'Delivery in 1 day'),
  ('b0000000-0000-0000-0000-000000000010', 'negotiable', null, 'Depends on video length'),
  ('b0000000-0000-0000-0000-000000000019', 'fixed', 250, 'Up to 10 slides; delivery in 2 days.'),
  ('b0000000-0000-0000-0000-000000000020', 'hourly', 200, 'Evenings by appointment.'),
  ('b0000000-0000-0000-0000-000000000021', 'fixed', 400, 'Price covers a short clip up to 30 seconds.')
on conflict (listing_id) do nothing;

insert into public.sale_details (listing_id, price, item_condition) values
  ('b0000000-0000-0000-0000-000000000011', 250, 'like_new'),
  ('b0000000-0000-0000-0000-000000000012', 120, 'new'),
  ('b0000000-0000-0000-0000-000000000013', 600, 'good'),
  ('b0000000-0000-0000-0000-000000000014', 180, 'good'),
  ('b0000000-0000-0000-0000-000000000015', 150, 'good'),
  ('b0000000-0000-0000-0000-000000000022', 180, 'good'),
  ('b0000000-0000-0000-0000-000000000023', 300, 'like_new'),
  ('b0000000-0000-0000-0000-000000000024', 450, 'good')
on conflict (listing_id) do nothing;

-- 3. Need -> Match posts
insert into public.need_posts (id, student_id, category_id, need_type, title, description) values
  ('d0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000004',
   (select id from public.categories where slug='borrow-electronics'),'borrow',
   'Need an Arduino UNO for 2 days','Have a lab submission on Friday and no board.'),
  ('d0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000003',
   (select id from public.categories where slug='service-graphic'),'service',
   'Need someone to design a project poster','A1 size poster for the department exhibition.')
on conflict (id) do nothing;

-- 4. A few finished and pending requests so ratings and dashboards are not empty
do $$
begin
  if not exists (select 1 from public.requests where id = 'c0000000-0000-0000-0000-000000000001') then

    insert into public.requests (id, listing_id, requester_id, request_type, message, requested_start, requested_end) values
      ('c0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000006','a0000000-0000-0000-0000-000000000003','service','Need a 12-slide deck for my project review.', null, null),
      ('c0000000-0000-0000-0000-000000000002','b0000000-0000-0000-0000-000000000008','a0000000-0000-0000-0000-000000000004','service','Struggling with linked lists, can we do two sessions?', null, null),
      ('c0000000-0000-0000-0000-000000000003','b0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000002','borrow','Need it for the microcontroller lab.', current_date - 6, current_date - 3);

    -- accepting creates the transaction automatically (database trigger)
    update public.requests set status = 'accepted'
      where id in ('c0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000002','c0000000-0000-0000-0000-000000000003');

    update public.transactions set status = 'completed', completed_at = now()
      where request_id in ('c0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000002','c0000000-0000-0000-0000-000000000003');

    update public.requests set status = 'completed'
      where id in ('c0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000002','c0000000-0000-0000-0000-000000000003');

    insert into public.reviews (transaction_id, reviewer_id, reviewee_id, rating, comment) values
      ((select id from public.transactions where request_id = 'c0000000-0000-0000-0000-000000000001'),'a0000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000002',5,'Delivered the slides in a day. Clean design.'),
      ((select id from public.transactions where request_id = 'c0000000-0000-0000-0000-000000000001'),'a0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000003',5,'Clear brief and quick payment.'),
      ((select id from public.transactions where request_id = 'c0000000-0000-0000-0000-000000000002'),'a0000000-0000-0000-0000-000000000004','a0000000-0000-0000-0000-000000000001',4,'Explained linked lists really well.'),
      ((select id from public.transactions where request_id = 'c0000000-0000-0000-0000-000000000002'),'a0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000004',5,'Came prepared with good questions.'),
      ((select id from public.transactions where request_id = 'c0000000-0000-0000-0000-000000000003'),'a0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000001',5,'Board worked perfectly, owner was very helpful.'),
      ((select id from public.transactions where request_id = 'c0000000-0000-0000-0000-000000000003'),'a0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000002',5,'Returned on time and in the same condition.');

    -- two requests still waiting for the owner to respond
    insert into public.requests (id, listing_id, requester_id, request_type, message, requested_start, requested_end) values
      ('c0000000-0000-0000-0000-000000000004','b0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000004','borrow','Can I borrow it for a weekend project?', current_date + 1, current_date + 2),
      ('c0000000-0000-0000-0000-000000000005','b0000000-0000-0000-0000-000000000013','a0000000-0000-0000-0000-000000000001','purchase','Is the calculator still available?', null, null);
  end if;
end $$;
