// api/summary.js
import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  try {
    const { reviews } = req.body;

    // Reconstruye los prompts igual que en tu hook
    const systemPrompt = {
      role: "system",
      content:
        "You are a helpful assistant specialized in summarizing dancer feedback. You will receive several JSON objects, each representing a review from a dancer at a company. Each review may include some of these fields (but not necessarily all): - 'Salary & Compensation' - 'Repertoire, Operas, Touring & Roles' - 'Staff, Classes & Rehearsals' - 'Schedule & Holidays' - 'Facilities, Wellbeing & Injuries' - 'Colleagues & General Mood' - 'City, Transport & Living' Your task is to synthesize them into one concise summary, formatted as a single JSON object with exactly these keys (in lowercase without ampersands or commas): { 'salary': '', 'repertoire': '', 'staff': '', 'schedule': '', 'facilities': '', 'colleagues': '', 'city': '' } If a topic isn’t covered in any of the input reviews, set its value to an empty string.",
    };
    const userPrompt = {
      role: "user",
      content: `Here are some reviews:\n${reviews.join("\n")}\n\nWrite a concise summary as if it were a single review.`,
    };

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Llamada sin stream, para simplificar
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [systemPrompt, userPrompt],
      max_tokens: 300
    });

    // Extrae sólo el texto de la respuesta
    const text = completion.choices[0].message.content;
    return res.status(200).json({ summary: text });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
