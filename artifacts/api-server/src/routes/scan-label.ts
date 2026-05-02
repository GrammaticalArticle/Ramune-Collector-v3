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

    const flavorList = flavors
      .map((f) => `ID ${f.id}: ${f.japaneseName} (${f.name})`)
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
              text: `You are helping identify a ramune (Japanese soda) flavor from a label photo.

Look specifically for the flavor name text on the label — typically katakana characters printed on a colored stripe or banner on the bottle (like ブルーベリー, ストロベリー, メロン, etc.).

Here is the list of known flavors (ID: Japanese name (English name)):
${flavorList}

Examine the image and identify which flavor it is. Reply ONLY with a JSON object like:
{"flavorId": 3, "extractedText": "ブルーベリー", "confidence": "high"}

If you cannot identify the flavor, reply with:
{"flavorId": null, "extractedText": "...", "confidence": "none"}

Only use the flavor IDs from the list above.`,
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
