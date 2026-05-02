import { Router } from "express";
import { db } from "@workspace/db";
import { caughtFlavorsTable, flavorsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { CatchFlavorBody, UncatchFlavorParams, UncatchFlavorQueryParams, ListCaughtQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/caught", async (req, res) => {
  const parsed = ListCaughtQueryParams.safeParse(req.query);
  if (!parsed.success) return void res.status(400).json({ error: "username query param is required" });

  try {
    const caught = await db
      .select()
      .from(caughtFlavorsTable)
      .where(eq(caughtFlavorsTable.username, parsed.data.username))
      .orderBy(caughtFlavorsTable.caughtAt);
    res.json(caught);
  } catch (err) {
    req.log.error({ err }, "Failed to list caught");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/caught", async (req, res) => {
  const parsed = CatchFlavorBody.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: "Invalid request body" });

  const { flavorId, username } = parsed.data;

  try {
    const [flavor] = await db.select().from(flavorsTable).where(eq(flavorsTable.id, flavorId));
    if (!flavor) return void res.status(400).json({ error: "Flavor not found" });

    const existing = await db
      .select()
      .from(caughtFlavorsTable)
      .where(and(eq(caughtFlavorsTable.username, username), eq(caughtFlavorsTable.flavorId, flavorId)));
    if (existing.length > 0) return void res.status(409).json({ error: "Flavor already caught" });

    const [caught] = await db.insert(caughtFlavorsTable).values({ username, flavorId }).returning();
    res.status(201).json(caught);
  } catch (err) {
    req.log.error({ err }, "Failed to catch flavor");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/caught/:flavorId", async (req, res) => {
  const paramsParsed = UncatchFlavorParams.safeParse(req.params);
  if (!paramsParsed.success) return void res.status(400).json({ error: "Invalid flavorId" });

  const queryParsed = UncatchFlavorQueryParams.safeParse(req.query);
  if (!queryParsed.success) return void res.status(400).json({ error: "username query param is required" });

  try {
    const [deleted] = await db
      .delete(caughtFlavorsTable)
      .where(
        and(
          eq(caughtFlavorsTable.username, queryParsed.data.username),
          eq(caughtFlavorsTable.flavorId, paramsParsed.data.flavorId)
        )
      )
      .returning();
    if (!deleted) return void res.status(404).json({ error: "Not found" });
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "Failed to uncatch flavor");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
