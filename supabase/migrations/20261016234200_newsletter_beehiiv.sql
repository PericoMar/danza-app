-- The newsletter moves from Brevo to beehiiv (Brevo caps the free plan at 300
-- subscribers; beehiiv at 2500). Only the provider changes: the table keeps
-- doing what it did, which is holding the record of consent that the provider
-- doesn't store for us (when, from which page, from which IP).
--
-- Expand only, like every provider-shaped change in this repo: the new column
-- is added and the Brevo one is left in place so the deployment currently in
-- production keeps working while the new one rolls out. A later migration drops
-- `brevo_contact_id`, once no running build writes it and the subscriber export
-- out of Brevo is done.

alter table public.newsletter_subscriptions
  add column if not exists beehiiv_subscription_id text;

comment on column public.newsletter_subscriptions.beehiiv_subscription_id is
  'The subscription id in beehiiv, for support and debugging. NULL when the row predates beehiiv or was written without API credentials.';

comment on column public.newsletter_subscriptions.brevo_contact_id is
  'Legacy: the contact id in Brevo. Nothing writes it since the beehiiv migration; drop it once the Brevo account is closed.';

comment on column public.newsletter_subscriptions.status is
  'Our record of the subscription. beehiiv is the source of truth for whether a person actually receives the newsletter: unsubscribes from an email footer only ever reach beehiiv.';
