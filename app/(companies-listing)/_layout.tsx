import { Slot } from 'expo-router';

import CompaniesListing from '@/components/companies/CompaniesListing';

/**
 * The listing, for both of its addresses: /companies and
 * /companies/in/[countrySlug]. Rendered here and not by the routes so that
 * changing the country is a change of filter, not of page — the listing stays
 * mounted with its scroll, the pages it has loaded and its filters. As two
 * screens, every change of country stacked a fresh copy, scrolled to the top,
 * over the old one.
 *
 * The routes render nothing. They exist for their URLs, their prerendered
 * pages and their history entries, and the <Slot/> makes them a navigator of
 * their own: a push from one to the other stays inside this layout instead of
 * stacking a new screen on the root.
 *
 * The group wraps companies/ instead of sitting inside it on purpose. Inside,
 * the listing would be an index route with an empty path of its own, and
 * expo-router writes that as /companies/?q=… — with a slash it only strips
 * when there is no query string.
 */
export default function CompaniesListingLayout() {
  return (
    <>
      {/* First, though it draws nothing: sibling effects run in order, and the
          Slot's are the ones that hook its navigator up. The listing writes to
          the URL from its own mount effects, and before that hookup a
          setParams lands on this layout's route instead of the page's. */}
      <Slot />
      <CompaniesListing />
    </>
  );
}
