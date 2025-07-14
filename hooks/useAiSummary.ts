// src/hooks/useAiSummary.ts
import { useState } from "react";

export function useAiSummary() {
  const [summary, setSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);

  const generate = async (reviews: string[]) => {
    setIsLoading(true);
    setSummary("");
    setError(null);

    try {
      const resp = await fetch("http://localhost:3000/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviews }),
      });

      if (!resp.ok) throw new Error(await resp.text());

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder("utf-8");

      let done = false;
      while (!done) {
        const { value, done: streamDone } = await reader.read();
        done = streamDone;
        if (value) {
          // SSE-parsing muy básico: eliminamos prefijo "data: "
          const chunk = decoder.decode(value);
          const lines = chunk.split("\n\n");
          for (let line of lines) {
            if (!line.startsWith("data:")) continue;
            const payload = line.replace(/^data:\s*/, "");
            if (payload === "[DONE]") {
              done = true;
              break;
            }
            // decodifica \n si los has escapado
            setSummary((prev) => prev + payload.replace(/\\n/g, "\n"));
          }
        }
      }
    } catch (e: any) {
      setError(e.message || "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  return { summary, isLoading, error, generate };
}
