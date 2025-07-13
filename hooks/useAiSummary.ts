// src/hooks/useAiSummary.ts
import { useState } from "react";

type UseAiSummaryReturn = {
  summary: string;
  isLoading: boolean;
  error: string | null;
  generate: (reviews: string[]) => Promise<void>;
};

export function useAiSummary(): UseAiSummaryReturn {
  const [summary, setSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async (reviews: string[]) => {
    setIsLoading(true);
    setSummary("");
    setError(null);

    try {
      const resp = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviews }),
      });

      if (!resp.ok) {
        const { error } = await resp.json();
        throw new Error(error || resp.statusText);
      }

      const { summary: text } = await resp.json();
      setSummary(text);
    } catch (e: any) {
      setError(e.message || "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  return { summary, isLoading, error, generate };
}
