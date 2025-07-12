// src/hooks/useAiSummary.ts
import { useState } from 'react';
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { openai } from '@/services/openai';

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

    const systemPrompt: ChatCompletionMessageParam = {
      role: 'system',
      content:
        "You are a helpful assistant specialized in summarizing dancer feedback. You will receive several JSON objects, each representing a review from a dancer at a company. Each review may include some of these fields (but not necessarily all): - 'Salary & Compensation' - 'Repertoire, Operas, Touring & Roles' - 'Staff, Classes & Rehearsals' - 'Schedule & Holidays' - 'Facilities, Wellbeing & Injuries' - 'Colleagues & General Mood' - 'City, Transport & Living' Your task is to synthesize them into one concise summary, formatted as a single JSON object with exactly these keys (in lowercase without ampersands or commas): { 'salary': '', 'repertoire': '', 'staff': '', 'schedule': '', 'facilities': '', 'colleagues': '', 'city': '' } If a topic isn’t covered in any of the input reviews, set its value to an empty string.",
    };

    const userPrompt: ChatCompletionMessageParam = {
      role: 'user',
      content: `Here are some reviews:\n${reviews.join('\n')}\n\nWrite a concise summary as if it were a single review.`,
    };

    try {
      // Call OpenAI's chat completion API with streaming enabled
      // From services/openai.ts
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [systemPrompt, userPrompt],
        stream: true,
        max_tokens: 300,
      });

      // Consume the streaming response
      for await (const part of response as any) {
        const delta = part.choices[0].delta.content;
        if (delta) {
          setSummary((prev) => prev + delta);
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

export { openai };
