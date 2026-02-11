// api/newsletter/index.mjs
import { createClient } from "@supabase/supabase-js";

const ALLOWED_ORIGIN =
  process.env.NODE_ENV === "production"
    ? "https://danza-app.com"
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

  // Wrap everything in try/catch to ensure JSON error responses
  try {
    // Check required environment variables
    const missingEnvVars = [];
    if (!process.env.EXPO_PUBLIC_SUPABASE_URL) missingEnvVars.push("EXPO_PUBLIC_SUPABASE_URL");
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missingEnvVars.push("SUPABASE_SERVICE_ROLE_KEY");

    if (missingEnvVars.length > 0) {
      console.error("[Newsletter API] Missing environment variables:", missingEnvVars);
      return res.status(500).json({ error: "Server configuration error" });
    }

    // Input validation
    const { email, source = "newsletter_modal" } = req.body || {};
    console.log("[Newsletter API] Request received:", { email: email ? `${email.substring(0, 3)}***` : "missing", source });

    if (!email || !isValidEmail(email)) {
      console.log("[Newsletter API] Invalid email provided");
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

    // 1. Call Brevo API to create/update contact (optional - don't fail if not configured)
    if (process.env.BREVO_API_KEY) {
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
          console.log("[Newsletter API] Brevo contact created/updated:", brevoContactId);
        } else if (brevoRes.status === 409) {
          console.log("[Newsletter API] Brevo contact already exists");
        } else {
          const brevoError = await brevoRes.text();
          console.error("[Newsletter API] Brevo error:", brevoRes.status, brevoError);
        }
      } catch (err) {
        console.error("[Newsletter API] Brevo API error:", err.message);
        // Continue anyway - we still want to save to our DB
      }
    } else {
      console.log("[Newsletter API] Brevo not configured, skipping");
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
      console.error("[Newsletter API] DB error:", dbError);
      return res.status(500).json({ error: "Failed to save subscription" });
    }

    console.log("[Newsletter API] Subscription saved successfully");
    return res.status(200).json({
      success: true,
      brevo_contact_id: brevoContactId,
    });

  } catch (err) {
    console.error("[Newsletter API] Unexpected error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
