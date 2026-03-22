// api/newsletter/status.mjs
import { createClient } from "@supabase/supabase-js";

const ALLOWED_ORIGIN =
  process.env.NODE_ENV === "production"
    ? "https://danza-app.com"
    : "*";

export default async function handler(req, res) {
  const setCORS = () => {
    res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Max-Age", "86400");
  };

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

  const { email } = req.body || {};
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ error: "Invalid email" });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // --- Brevo as source of truth ---
  if (process.env.BREVO_API_KEY) {
    try {
      const brevoRes = await fetch(
        `https://api.brevo.com/v3/contacts/${encodeURIComponent(normalizedEmail)}`,
        {
          method: "GET",
          headers: {
            "api-key": process.env.BREVO_API_KEY,
            "Content-Type": "application/json",
          },
        }
      );

      if (brevoRes.status === 404) {
        // Contact doesn't exist in Brevo → not subscribed
        console.log("[Newsletter Status] Contact not found in Brevo");
        return res.status(200).json({ status: "not_subscribed" });
      }

      if (!brevoRes.ok) {
        const err = await brevoRes.text();
        console.error("[Newsletter Status] Brevo error:", brevoRes.status, err);
        // Fall through to DB fallback
      } else {
        const contact = await brevoRes.json();
        console.log("[Newsletter Status] Brevo contact:", {
          emailBlacklisted: contact.emailBlacklisted,
          listIds: contact.listIds,
        });

        const listId = process.env.BREVO_LIST_ID
          ? Number(process.env.BREVO_LIST_ID)
          : null;

        const isInList = listId
          ? Array.isArray(contact.listIds) && contact.listIds.includes(listId)
          : true; // If no list configured, just check blacklist

        const isSubscribed = !contact.emailBlacklisted && isInList;

        return res.status(200).json({
          status: isSubscribed ? "subscribed" : "not_subscribed",
        });
      }
    } catch (err) {
      console.error("[Newsletter Status] Brevo fetch error:", err.message);
      // Fall through to DB fallback
    }
  }

  // --- Fallback: query Supabase DB (dev or Brevo not configured) ---
  console.log("[Newsletter Status] Falling back to DB check");
  try {
    const supabase = createClient(
      process.env.EXPO_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    const { data, error } = await supabase
      .from("newsletter_subscriptions")
      .select("status")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (error) {
      console.error("[Newsletter Status] DB error:", error);
      return res.status(500).json({ error: "Failed to check subscription" });
    }

    return res.status(200).json({
      status: data?.status === "subscribed" ? "subscribed" : "not_subscribed",
    });
  } catch (err) {
    console.error("[Newsletter Status] Unexpected error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
