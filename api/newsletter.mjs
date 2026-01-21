// api/newsletter.mjs
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
  const { email, source = "newsletter_modal" } = req.body || {};
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ error: "Invalid email" });
  }

  // Consent metadata from server headers
  const consentIp =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    null;
  const consentUserAgent = req.headers["user-agent"] || null;

  // Supabase client with service role for insert
  const supabase = createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  let brevoContactId = null;

  // 1. Call Brevo API to create/update contact
  try {
    const brevoRes = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.toLowerCase(),
        listIds: process.env.BREVO_LIST_ID
          ? [Number(process.env.BREVO_LIST_ID)]
          : [],
        updateEnabled: true,
      }),
    });

    if (brevoRes.ok) {
      const data = await brevoRes.json();
      brevoContactId = data.id?.toString() || null;
    } else if (brevoRes.status === 409) {
      // Contact already exists in Brevo - that's OK
    } else {
      console.error("Brevo error:", await brevoRes.text());
    }
  } catch (err) {
    console.error("Brevo API error:", err);
    // Continue anyway - we still want to save to our DB
  }

  // 2. Save to Supabase newsletter_subscriptions
  const { error: dbError } = await supabase
    .from("newsletter_subscriptions")
    .upsert(
      {
        email: email.toLowerCase(),
        status: "subscribed",
        source,
        brevo_contact_id: brevoContactId,
        consent_ip: consentIp,
        consent_user_agent: consentUserAgent,
        consent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" }
    );

  if (dbError) {
    console.error("DB error:", dbError);
    return res.status(500).json({ error: "Failed to save subscription" });
  }

  return res.status(200).json({
    success: true,
    brevo_contact_id: brevoContactId,
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
