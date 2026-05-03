import { Router } from "express";
import { db } from "@workspace/db";
import { flavorsTable } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

// Strip common suffixes that appear in the DB name but NOT on the bottle label
// e.g. "メロンラムネ" → "メロン", "メロン味ラムネ" → "メロン味", "ハッピーターン味ラムネ" → "ハッピーターン味"
const stripDbSuffix = (s: string) => s.replace(/ラムネ$/, "").trim();

// Extract a JSON object from an AI response that may be wrapped in markdown fences
function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  // Also try to extract the first {...} block
  const braced = raw.match(/\{[\s\S]*\}/);
  if (braced) return braced[0];
  return raw.trim();
}

router.post("/scan-label", async (req, res) => {
  const { imageBase64 } = req.body as { imageBase64?: string };
  if (!imageBase64 || typeof imageBase64 !== "string" || imageBase64.length === 0) {
    return void res.status(400).json({ error: "imageBase64 is required" });
  }

  try {
    const flavors = await db.select().from(flavorsTable);

    const flavorList = flavors
      .map((f) => `ID ${f.id}: label="${stripDbSuffix(f.japaneseName)}" (${f.name})`)
      .join("\n");

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 256,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are an expert at reading Japanese ramune bottle labels.

YOUR GOAL: Find the flavor name text visible in this image and match it to one of the known flavors below.

HOW RAMUNE LABELS WORK:
- The bottle brand name "ラムネ" appears large — ignore it, focus on the FLAVOR word
- The flavor name is printed in large katakana, often on a colored stripe or banner
- Common flavor words: メロン, いちご, ブルーベリー, ストロベリー, グレープ, レモン, オレンジ, もも, etc.
- The text may include 味 (meaning "flavor") after the word — e.g. "メロン味" means melon flavor
- Even partial or rotated text is useful — do your best to read it

KNOWN FLAVORS (label text shown on bottle — English name):
${flavorList}

MATCHING RULES:
- "メロン味" on the bottle → match to the flavor whose label contains "メロン"
- "いちご味" → match to いちご flavor
- Ignore 味 suffix when matching
- Pick the closest match even if not identical

YOUR RESPONSE — output ONLY a raw JSON object, no markdown, no backticks, no explanation:
{"flavorId": 3, "extractedText": "メロン", "confidence": "high"}

Confidence: "high" = clearly readable, "medium" = somewhat readable, "low" = guessing

If no flavor text is visible at all:
{"flavorId": null, "extractedText": "", "confidence": "none"}`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
                detail: "high",
              },
            },
          ],
        },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? "";
    req.log.info({ raw }, "Label scan AI response");

    const jsonStr = extractJson(raw);
    let parsed: { flavorId: number | null; extractedText: string; confidence: string };
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      req.log.error({ raw, jsonStr }, "Failed to parse AI response");
      return void res.status(422).json({
        error: `Could not read the label — the AI response was malformed. Try again.`,
        extractedText: raw.slice(0, 100),
      });
    }

    if (!parsed.flavorId) {
      return void res.status(404).json({
        error: "No flavor text found in the image",
        extractedText: parsed.extractedText,
        confidence: parsed.confidence,
      });
    }

    const flavor = flavors.find((f) => f.id === parsed.flavorId);
    if (!flavor) {
      return void res.status(404).json({ error: "Flavor ID from AI not found in database", extractedText: parsed.extractedText });
    }

    res.json({
      flavor,
      extractedText: parsed.extractedText,
      confidence: parsed.confidence,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to scan label");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
