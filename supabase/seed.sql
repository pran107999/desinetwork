-- Seed data: 11 launch cities (D9) and the category taxonomy (PRD §4.1).
-- Loaded by `supabase db reset` (local). Rows are looked up by slug, never by id.

------------------------------------------------------------------------------
-- Cities
------------------------------------------------------------------------------

insert into public.cities (name, state_label, slug, sort_order) values
  ('Edison', 'NJ', 'edison-nj', 1),
  ('New York City', 'NY', 'new-york-city-ny', 2),
  ('San Francisco Bay Area', 'CA', 'sf-bay-area-ca', 3),
  ('Dallas', 'TX', 'dallas-tx', 4),
  ('Houston', 'TX', 'houston-tx', 5),
  ('Chicago', 'IL', 'chicago-il', 6),
  ('Atlanta', 'GA', 'atlanta-ga', 7),
  ('Seattle', 'WA', 'seattle-wa', 8),
  ('Washington', 'DC', 'washington-dc', 9),
  ('Raleigh', 'NC', 'raleigh-nc', 10),
  ('Pittsburgh', 'PA', 'pittsburgh-pa', 11);

------------------------------------------------------------------------------
-- Top-level categories (price_label null = no price on listings)
------------------------------------------------------------------------------

insert into public.categories (name, slug, price_label, sort_order) values
  ('Roommates & Rentals', 'rentals', 'Rent / month', 1),
  ('Real Estate', 'real-estate', 'Price', 2),
  ('Jobs', 'jobs', null, 3),
  ('Buy & Sell', 'buy-sell', 'Price', 4),
  ('Autos', 'autos', 'Price', 5),
  ('Services', 'services', 'Rate', 6),
  ('Community', 'community', null, 7);

------------------------------------------------------------------------------
-- Subcategories (the price label lives on the parent only)
------------------------------------------------------------------------------

insert into public.categories (parent_id, name, slug, sort_order)
select p.id, s.name, s.slug, s.sort_order
from (values
  ('rentals', 'Room for rent', 'room-for-rent', 1),
  ('rentals', 'Roommate wanted', 'roommate-wanted', 2),
  ('rentals', 'Apartment', 'apartment', 3),
  ('rentals', 'Sublet', 'sublet', 4),
  ('real-estate', 'House for sale', 'house-for-sale', 1),
  ('real-estate', 'Condo', 'condo', 2),
  ('real-estate', 'Commercial', 'commercial', 3),
  ('jobs', 'Full-time', 'full-time', 1),
  ('jobs', 'Part-time', 'part-time', 2),
  ('jobs', 'Contract', 'contract', 3),
  ('jobs', 'Internship', 'internship', 4),
  ('buy-sell', 'Furniture', 'furniture', 1),
  ('buy-sell', 'Electronics', 'electronics', 2),
  ('buy-sell', 'Appliances', 'appliances', 3),
  ('buy-sell', 'Kids items', 'kids-items', 4),
  ('buy-sell', 'Free stuff', 'free-stuff', 5),
  ('autos', 'Cars', 'cars', 1),
  ('autos', 'Bikes', 'bikes', 2),
  ('services', 'Babysitting / Nanny', 'babysitting-nanny', 1),
  ('services', 'Tutoring', 'tutoring', 2),
  ('services', 'Cooking / Tiffin', 'cooking-tiffin', 3),
  ('services', 'Tax / Accounting', 'tax-accounting', 4),
  ('services', 'Immigration', 'immigration', 5),
  ('services', 'Cleaning', 'cleaning', 6),
  ('services', 'Beauty', 'beauty', 7),
  ('community', 'Carpool', 'carpool', 1),
  ('community', 'Travel companion', 'travel-companion', 2),
  ('community', 'Lost & found', 'lost-found', 3),
  ('community', 'Announcements', 'announcements', 4)
) as s (parent_slug, name, slug, sort_order)
join public.categories p on p.slug = s.parent_slug and p.parent_id is null;

------------------------------------------------------------------------------
-- Category fields. "parent_slug/sub_slug" targets a subcategory;
-- a bare slug targets a top-level category (field shared by all its subs).
------------------------------------------------------------------------------

insert into public.category_fields (category_id, key, label, type, options, required, filterable, sort_order)
select c.id, f.key, f.label, f.type::public.field_type, f.options::jsonb, f.required, f.filterable, f.sort_order
from (values
  -- Roommates & Rentals
  ('rentals', null, 'available_date', 'Available from', 'date', null, true, true, 1),
  ('rentals', null, 'deposit', 'Deposit', 'money', null, false, false, 2),
  ('rentals', null, 'gender_preference', 'Gender preference', 'select',
    '[{"value":"any","label":"Any"},{"value":"male","label":"Male"},{"value":"female","label":"Female"}]',
    false, true, 3),
  ('rentals', null, 'food_preference', 'Food preference', 'select',
    '[{"value":"any","label":"Any"},{"value":"veg_only","label":"Veg only"},{"value":"non_veg_ok","label":"Non-veg OK"}]',
    false, true, 4),
  ('rentals', null, 'furnished', 'Furnished', 'bool', null, false, true, 5),
  ('rentals', null, 'utilities_included', 'Utilities included', 'bool', null, false, false, 6),

  -- Real Estate
  ('real-estate', null, 'sq_ft', 'Square feet', 'number', null, false, true, 3),
  ('real-estate', 'house-for-sale', 'beds', 'Bedrooms', 'number', null, true, true, 1),
  ('real-estate', 'house-for-sale', 'baths', 'Bathrooms', 'number', null, true, false, 2),
  ('real-estate', 'condo', 'beds', 'Bedrooms', 'number', null, true, true, 1),
  ('real-estate', 'condo', 'baths', 'Bathrooms', 'number', null, true, false, 2),

  -- Jobs (job type is the subcategory)
  ('jobs', null, 'work_mode', 'Work mode', 'select',
    '[{"value":"onsite","label":"Onsite"},{"value":"remote","label":"Remote"},{"value":"hybrid","label":"Hybrid"}]',
    true, true, 1),
  ('jobs', null, 'visa_sponsorship', 'Visa sponsorship', 'bool', null, false, true, 2),
  ('jobs', null, 'salary_min', 'Salary from', 'money', null, false, false, 3),
  ('jobs', null, 'salary_max', 'Salary to', 'money', null, false, false, 4),
  ('jobs', null, 'salary_period', 'Salary period', 'select',
    '[{"value":"hour","label":"Per hour"},{"value":"year","label":"Per year"}]',
    false, false, 5),

  -- Buy & Sell
  ('buy-sell', null, 'condition', 'Condition', 'select',
    '[{"value":"new","label":"New"},{"value":"like_new","label":"Like new"},{"value":"good","label":"Good"},{"value":"fair","label":"Fair"}]',
    true, true, 1),
  ('buy-sell', null, 'negotiable', 'Price negotiable', 'bool', null, false, false, 2),

  -- Autos
  ('autos', null, 'make', 'Make', 'text', null, true, true, 1),
  ('autos', null, 'model', 'Model', 'text', null, true, false, 2),
  ('autos', null, 'year', 'Year', 'number', null, true, true, 3),
  ('autos', null, 'mileage', 'Mileage', 'number', null, true, true, 4),

  -- Services
  ('services', null, 'service_area', 'Service area', 'text', null, true, false, 1),
  ('services', null, 'rate_unit', 'Rate per', 'select',
    '[{"value":"hour","label":"Hour"},{"value":"day","label":"Day"},{"value":"month","label":"Month"},{"value":"fixed","label":"Fixed price"}]',
    false, false, 2),

  -- Community
  ('community', null, 'event_date', 'Date', 'date', null, false, false, 3),
  ('community', 'carpool', 'route_from', 'From', 'text', null, true, false, 1),
  ('community', 'carpool', 'route_to', 'To', 'text', null, true, false, 2),
  ('community', 'travel-companion', 'route_from', 'From', 'text', null, true, false, 1),
  ('community', 'travel-companion', 'route_to', 'To', 'text', null, true, false, 2)
) as f (parent_slug, sub_slug, key, label, type, options, required, filterable, sort_order)
join public.categories p on p.slug = f.parent_slug and p.parent_id is null
join public.categories c on c.id = coalesce(
  (select s.id from public.categories s where s.parent_id = p.id and s.slug = f.sub_slug),
  case when f.sub_slug is null then p.id end
);
