// hooks/useAiSummary.ts
import { useState } from "react";
import { Platform } from "react-native";
import { supabase } from "@/services/supabase";

export function useAiSummary() {
  const [summary, setSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async (reviews: string[]) => {
    setIsLoading(true);
    setSummary("");
    setError(null);

    try {
      // 1) Auth: Supabase JWT for the API
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setError("Not authenticated. Please log in.");
        return;
      }

      // 2) API base: localhost vs Android emulator vs prod
      const DEV_BASE =
        Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000";
      const API_BASE_URL =
        __DEV__ ? DEV_BASE : (process.env.EXPO_PUBLIC_API_BASE ?? ""); // "" = same-origin in prod

      // 3) Call your SSE endpoint with Authorization header
      const resp = await fetch(`${API_BASE_URL}/api/summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // <-- IMPORTANT
        },
        body: JSON.stringify({ reviews }),
      });

      // Handle non-OK (e.g., 401/429 JSON error)
      if (!resp.ok) {
        let msg = `HTTP ${resp.status}`;
        try {
          const ct = resp.headers.get("content-type") || "";
          if (ct.includes("application/json")) {
            const j = await resp.json();
            msg = j?.error || msg; // "Quota exceeded", etc.
          } else {
            msg = await resp.text();
          }
        } catch {
          /* ignore parse errors */
        }
        setError(msg);
        return;
      }

      if (!resp.body) {
        setError("No response body");
        return;
      }

      // 4) Read SSE stream
      const reader = resp.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let idx;
        while ((idx = buffer.indexOf("\n\n")) !== -1) {
          const raw = buffer.slice(0, idx).replace(/\r/g, "");
          buffer = buffer.slice(idx + 2);

          if (!raw.startsWith("data:")) continue;

          // remove "data:" + at most one space
          const payload = raw.replace(/^data:\s?/, "");
          const payloadTrim = payload.trim();

          if (payloadTrim === "[DONE]") {
            buffer = "";
            break;
          }

          // unescape newlines
          const text = payload.replace(/\\n/g, "\n");

          // append incrementally
          setSummary((prev) => prev + text);
        }
      }

      // final flush
      const tail = decoder.decode();
      if (tail) setSummary((prev) => prev + tail);
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  return { summary, isLoading, error, generate };
}
