import { Router } from "express";
import { db } from "@workspace/db";
import { caughtFlavorsTable, flavorsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CatchFlavorBody, UncatchFlavorParams } from "@workspace/api-zod";

const router = Router();

router.get("/caught", async (req, res) => {
  try {
    const caught = await db.select().from(caughtFlavorsTable).orderBy(caughtFlavorsTable.caughtAt);
    res.json(caught);
  } catch (err) {
    req.log.error({ err }, "Failed to list caught");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/caught", async (req, res) => {
  const parsed = CatchFlavorBody.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: "Invalid request body" });

  const { flavorId } = parsed.data;

  try {
    const [flavor] = await db.select().from(flavorsTable).where(eq(flavorsTable.id, flavorId));
    if (!flavor) return void res.status(400).json({ error: "Flavor not found" });

    const existing = await db.select().from(caughtFlavorsTable).where(eq(caughtFlavorsTable.flavorId, flavorId));
    if (existing.length > 0) return void res.status(409).json({ error: "Flavor already caught" });

    const [caught] = await db.insert(caughtFlavorsTable).values({ flavorId }).returning();
    res.status(201).json(caught);
  } catch (err) {
    req.log.error({ err }, "Failed to catch flavor");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/caught/:flavorId", async (req, res) => {
  const parsed = UncatchFlavorParams.safeParse(req.params);
  if (!parsed.success) return void res.status(400).json({ error: "Invalid flavorId" });

  try {
    const [deleted] = await db.delete(caughtFlavorsTable)
      .where(eq(caughtFlavorsTable.flavorId, parsed.data.flavorId))
      .returning();
    if (!deleted) return void res.status(404).json({ error: "Not found" });
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "Failed to uncatch flavor");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
