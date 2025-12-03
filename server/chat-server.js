import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
const port = process.env.PORT || 3001;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(cors());
app.use(express.json());

app.post("/chat", async (req, res) => {
  try {
    const rawMessage = (req.body?.message ?? "").toString();
    const message = rawMessage.slice(0, 1000);

    if (!message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "OPENAI_API_KEY is not set on the server" });
    }

    const systemPrompt = `
You are a helpful medication information assistant for an IoT pillbox app.

CRITICAL SAFETY RULES:
- You are NOT a doctor and NOT a substitute for professional medical advice.
- Never give a diagnosis.
- Never tell the user to change, start, or stop any medication.
- Always encourage the user to consult a qualified doctor or pharmacist.
- If the question is an emergency (e.g. chest pain, difficulty breathing, stroke symptoms, severe allergic reaction), tell them to seek emergency medical services immediately.

HOW TO ANSWER:
- Provide general information only: typical uses, common side effects, general precautions, timing (before/after food) when well established.
- Use simple, clear language.
- Keep answers short and focused (2–6 short paragraphs or bullets).
- At the end of every answer, add: "This is general information, not medical advice. Please consult your doctor or pharmacist for personal guidance."
`.trim();

    const completion = await openai.chat.completions.create(
      {
        model: "gpt-4.1-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        // Keep answers short so they return faster
        max_tokens: 220,
        temperature: 0.4,
      },
      {
        // Hard timeout so we don't leave the user waiting too long
        timeout: 8000,
      }
    );

    const reply =
      completion.choices?.[0]?.message?.content?.trim() ||
      "Sorry, I could not generate an answer right now. Please try again.";

    res.json({ reply });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Failed to get reply from assistant" });
  }
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(port, () => {
  console.log(`Chat server listening on http://localhost:${port}`);
});


