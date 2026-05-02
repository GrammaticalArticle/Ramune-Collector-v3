import { Router } from "express";
import { db } from "@workspace/db";
import { flavorsTable } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

router.post("/scan-label", async (req, res) => {
  const { imageBase64 } = req.body as { imageBase64?: string };
  if (!imageBase64 || typeof imageBase64 !== "string" || imageBase64.length === 0) {
    return void res.status(400).json({ error: "imageBase64 is required" });
  }

  try {
    const flavors = await db.select().from(flavorsTable);

    // Strip trailing ラムネ from Japanese names so the AI can match label text
    // (labels print just the flavor word e.g. "メロン" not "メロンラムネ")
    const stripRamune = (s: string) => s.replace(/ラムネ$/, "").trim();

    const flavorList = flavors
      .map((f) => `ID ${f.id}: ${f.japaneseName} | label text: "${stripRamune(f.japaneseName)}" (${f.name})`)
      .join("\n");

    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 256,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are an expert at reading Japanese ramune (Sangaria/Marble) bottle labels.

WHAT TO LOOK FOR:
- Ramune bottles have a colored label with the brand name "ラムネ" at the top
- The FLAVOR NAME is printed in large katakana on a colored stripe/banner on the label
- Common examples: ブルーベリー (blueberry), ストロベリー (strawberry), メロン (melon), もも (peach), マスカット (muscat), レモン (lemon), etc.
- The flavor text may be rotated, partially visible, or on the side of a curved bottle
- Even if the image is blurry or at an angle, try your best to read the katakana characters

KNOWN FLAVORS (ID: full Japanese name | label text you'll actually see on the bottle — English name):
${flavorList}

IMPORTANT: The "label text" column shows what actually appears on the bottle label. Match the text you see in the image to those label text values (e.g. the bottle says "メロン" which matches label text "メロン" for ID 3).

TASK:
1. Carefully examine the image for any Japanese text that looks like a flavor name
2. Match it to the closest "label text" value from the list above
3. If multiple text fragments are visible, focus on the largest/most prominent flavor word

Reply ONLY with a JSON object — no markdown, no extra text:
{"flavorId": 3, "extractedText": "ブルーベリー", "confidence": "high"}

Confidence levels: "high" (clearly readable), "medium" (somewhat readable), "low" (guessing)

If you truly cannot identify any flavor text at all:
{"flavorId": null, "extractedText": "could not read", "confidence": "none"}

Only use flavor IDs from the list above. Never invent new IDs.`,
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

    const content = response.choices[0]?.message?.content ?? "";
    req.log.info({ content }, "Label scan AI response");

    let parsed2: { flavorId: number | null; extractedText: string; confidence: string };
    try {
      parsed2 = JSON.parse(content.trim());
    } catch {
      return void res.status(422).json({ error: "Could not parse AI response", raw: content });
    }

    if (!parsed2.flavorId) {
      return void res.status(404).json({
        error: "Flavor not recognized",
        extractedText: parsed2.extractedText,
        confidence: parsed2.confidence,
      });
    }

    const flavor = flavors.find((f) => f.id === parsed2.flavorId);
    if (!flavor) {
      return void res.status(404).json({ error: "Flavor not found in database" });
    }

    res.json({
      flavor,
      extractedText: parsed2.extractedText,
      confidence: parsed2.confidence,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to scan label");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
