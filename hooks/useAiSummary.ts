import { useState } from "react";

export function useAiSummary() {
  const [summary, setSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async (reviews: string[]) => {
    setIsLoading(true);
    setSummary("");
    setError(null);

    try {
      const API_BASE_URL = __DEV__ ? "http://localhost:3000" : "";
      const resp = await fetch(`${API_BASE_URL}/api/summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviews }),
      });
      if (!resp.ok) throw new Error(await resp.text());
      if (!resp.body) throw new Error("No response body");

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

          // quita "data:" + un único espacio si existe, pero NO más
          const payload = raw.replace(/^data:\s?/, "");
          const payloadTrim = payload.trim();

          if (payloadTrim === "[DONE]") {
            buffer = "";
            break;
          }

          // des-escapa saltos de línea
          const text = payload.replace(/\\n/g, "\n");

          // append incremental (se ve “poco a poco”)
          setSummary(prev => prev + text);
        }
      }

      // flush final
      const tail = decoder.decode();
      if (tail) setSummary(prev => prev + tail);
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  return { summary, isLoading, error, generate };
}
