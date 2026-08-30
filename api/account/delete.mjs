// api/account/delete.mjs
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

  // ---------- Auth: identify the caller from their own JWT ----------
  const authClient = createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL,
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } }
  );

  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
  if (!token) {
    return res.status(401).json({ error: "Missing Authorization Bearer token" });
  }

  const { data: userData, error: authErr } = await authClient.auth.getUser(token);
  if (authErr || !userData?.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const userId = userData.user.id;

  // ---------- Delete with the service role: this can't be done from the client ----------
  const adminClient = createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  // Best-effort cleanup of user-owned rows first. If any of these tables
  // already cascade on auth.users deletion this is a harmless no-op; if
  // they don't, skipping it would make admin.deleteUser fail on a foreign
  // key constraint instead of actually deleting the account.
  for (const table of ["reviews", "favorite_companies", "users"]) {
    const { error: cleanupError } = await adminClient
      .from(table)
      .delete()
      .eq("user_id", userId);
    if (cleanupError) {
      console.error(`[account/delete] cleanup failed for ${table}:`, cleanupError);
    }
  }

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
  if (deleteError) {
    console.error("[account/delete] deleteUser failed:", deleteError);
    return res.status(500).json({ error: deleteError.message || "Failed to delete account" });
  }

  return res.status(200).json({ success: true });
}
