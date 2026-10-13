-- A height requirement row with no bounds means "this gender, any height".
--
-- A row in `audition_height_requirements` is also what restricts an audition
-- to a gender (see `getAuditionGenderRestriction`), so an admin must be able to
-- pick a gender without giving heights. `ck_some_bound_present` rejected that;
-- the order and positivity checks still apply to whatever bounds are given.

alter table public.audition_height_requirements
  drop constraint ck_some_bound_present;

comment on column public.audition_height_requirements.min_height_cm is 'Minimum height in cm, inclusive. NULL = no minimum.';
comment on column public.audition_height_requirements.max_height_cm is 'Maximum height in cm, inclusive. NULL = no maximum.';
