// api/newsletter/unsubscribe.mjs
import { createClient } from "@supabase/supabase-js";

const ALLOWED_ORIGIN =
  process.env.NODE_ENV === "production"
    ? "https://danza-ai.vercel.app"
    : "*";

export default async function handler(req, res) {
  // ---- CORS for all responses ----
  const setCORS = () => {
    res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Max-Age", "86400");
  };

  // Preflight
  if (req.method === "OPTIONS") {
    setCORS();
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    setCORS();
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).end();
  }

  setCORS();

  // Input validation
  const { email } = req.body || {};
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ error: "Invalid email" });
  }

  // Supabase client with service role for update
  const supabase = createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  // 1. Update status to unsubscribed in Supabase
  const { error: dbError } = await supabase
    .from("newsletter_subscriptions")
    .update({
      status: "unsubscribed",
      unsubscribed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("email", email.toLowerCase());

  if (dbError) {
    console.error("DB error:", dbError);
    return res.status(500).json({ error: "Failed to unsubscribe" });
  }

  // 2. Optionally remove from Brevo list (if BREVO_LIST_ID is set)
  if (process.env.BREVO_API_KEY && process.env.BREVO_LIST_ID) {
    try {
      await fetch(
        `https://api.brevo.com/v3/contacts/lists/${process.env.BREVO_LIST_ID}/contacts/remove`,
        {
          method: "POST",
          headers: {
            "api-key": process.env.BREVO_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            emails: [email.toLowerCase()],
          }),
        }
      );
    } catch (err) {
      console.error("Brevo unsubscribe error:", err);
      // Don't fail the request - DB update succeeded
    }
  }

  return res.status(200).json({ success: true });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
