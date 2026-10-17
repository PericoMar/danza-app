// The consent log's one piece of judgement: `source` comes from the request
// body, so it can be anything, and the database column is a closed enum.

import { NewsletterSource, normalizeSource, recordConsent } from "./consent.mjs";

describe("normalizeSource", () => {
  it("keeps the forms the app actually has", () => {
    expect(normalizeSource("newsletter_page")).toBe(NewsletterSource.PAGE);
    expect(normalizeSource("newsletter_modal")).toBe(NewsletterSource.MODAL);
  });

  it.each([undefined, null, "", "newsletter_footer", "'; drop table --", 42])(
    "files %s under unknown rather than rejecting the sign-up",
    (value) => {
      expect(normalizeSource(value)).toBe(NewsletterSource.UNKNOWN);
    }
  );
});

describe("recordConsent", () => {
  function fakeSupabase(error = null) {
    const calls = [];
    return {
      calls,
      from(table) {
        calls.push({ table });
        return this;
      },
      insert(row) {
        calls[calls.length - 1].row = row;
        return Promise.resolve({ error });
      },
    };
  }

  it("appends one row to the consent log", async () => {
    const supabase = fakeSupabase();

    await recordConsent(supabase, {
      email: "user@example.com",
      source: "newsletter_page",
      ip: "203.0.113.4",
      userAgent: "Mozilla/5.0",
      beehiivSubscriptionId: "sub_1",
    });

    expect(supabase.calls[0].table).toBe("newsletter_consents");
    expect(supabase.calls[0].row).toMatchObject({
      email: "user@example.com",
      source: "newsletter_page",
      consent_ip: "203.0.113.4",
      consent_user_agent: "Mozilla/5.0",
      beehiiv_subscription_id: "sub_1",
    });
  });

  it("returns the error instead of throwing, so a failed record can't look like a failed signup", async () => {
    const supabase = fakeSupabase({ message: "nope" });

    await expect(
      recordConsent(supabase, { email: "user@example.com", source: "newsletter_modal" })
    ).resolves.toEqual({ error: { message: "nope" } });
  });
});
