// services/account.ts
import { supabase } from "@/services/supabase";
import { getApiBaseUrl } from "@/utils/apiBaseUrl";
import { ACCOUNT_DELETE_API_PATH } from "@/constants/profile";

/**
 * Permanently deletes the signed-in user's account (server-side, with the
 * service role) and then signs the client out. Throws with a user-facing
 * message on failure; the session is left intact in that case.
 */
export async function deleteMyAccount(): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) {
    throw new Error("Your session has expired. Please log in again and retry.");
  }

  let resp: Response;
  try {
    resp = await fetch(`${getApiBaseUrl()}${ACCOUNT_DELETE_API_PATH}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new Error("We couldn't reach the server. Check your connection and try again.");
  }

  if (!resp.ok) {
    const body = await resp.json().catch(() => null);
    throw new Error(body?.error || `Server error (${resp.status})`);
  }

  await supabase.auth.signOut();
}
