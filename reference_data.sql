-- ShareShelf reference data (the real rows the app needs to work).
-- Run AFTER schema.sql. Safe to run more than once.
-- This is NOT the fictional demo data; that lives in seed.sql.

INSERT INTO public.colleges (name, slug, email_domains)
VALUES ('Amity University Gurugram', 'amity-gurugram', ARRAY['s.amity.edu'])
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.categories (name, slug, listing_type) VALUES
  -- Borrow & Lend
  ('Electronics & Components',   'borrow-electronics',  'borrow'),
  ('Lab Equipment & Coats',      'borrow-lab',          'borrow'),
  ('Books & Notes',              'borrow-books',        'borrow'),
  ('Tools & Instruments',        'borrow-tools',        'borrow'),
  ('Other Items',                'borrow-other',        'borrow'),
  -- Student Services
  ('PPT & Presentation Design',  'service-ppt',         'service'),
  ('Graphic Design (Canva)',     'service-graphic',     'service'),
  ('Tutoring',                   'service-tutoring',    'service'),
  ('Photography',                'service-photography', 'service'),
  ('Video Editing',              'service-video',       'service'),
  ('Resume Formatting',          'service-resume',      'service'),
  ('Coding Help',                'service-coding',      'service'),
  ('Documentation & Reports',    'service-docs',        'service'),
  -- Buying & Selling
  ('Textbooks',                  'sale-textbooks',      'sale'),
  ('Lab Coats & Uniforms',       'sale-lab-coats',      'sale'),
  ('Drawing Sheets & Stationery','sale-stationery',     'sale'),
  ('Calculators',                'sale-calculators',    'sale'),
  ('Project Components',         'sale-components',     'sale')
ON CONFLICT (slug) DO NOTHING;
