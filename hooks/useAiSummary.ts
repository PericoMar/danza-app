// src/hooks/useAiSummary.ts
import { useState } from 'react';

type UseAiSummaryReturn = {
  summary: string;
  isLoading: boolean;
  error: string | null;
  generate: (reviews: string[]) => Promise<void>;
};

export function useAiSummary(): UseAiSummaryReturn {
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async (reviews: string[]) => {
    setIsLoading(true);
    setSummary('');
    setError(null);
    try {
      const systemPrompt = {
        role: 'system',
        content: 'You are an assistant that summarizes user reviews.',
      };
      const userPrompt = {
        role: 'user',
        content: `Here are some reviews:\n${reviews.join(
          '\n'
        )}\n\nWrite a concise summary as if it were a single review.`,
      };

      const res = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [systemPrompt, userPrompt],
            max_tokens: 300,
            stream: true,
          }),
        }
      );
      if (!res.ok || !res.body) {
        throw new Error(`OpenAI error ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value);
          chunk.split('\n\n').forEach((part) => {
            if (part.startsWith('data: ')) {
              const json = part.replace(/^data: /, '');
              if (json === '[DONE]') return;
              try {
                const parsed = JSON.parse(json);
                const delta = parsed.choices[0].delta.content;
                if (delta) {
                  setSummary((prev) => prev + delta);
                }
              } catch {
                // ignore JSON errors
              }
            }
          });
        }
      }
    } catch (e: any) {
      setError(e.message || 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return { summary, isLoading, error, generate };
}
