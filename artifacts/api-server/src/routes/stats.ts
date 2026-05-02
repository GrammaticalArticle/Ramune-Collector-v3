import { Router } from "express";
import { db } from "@workspace/db";
import { flavorsTable, caughtFlavorsTable, locationsTable } from "@workspace/db";
import { count, desc } from "drizzle-orm";

const router = Router();

router.get("/stats", async (req, res) => {
  try {
    const [[{ total }], [{ caught }], [{ locations }], recentlyCaught] = await Promise.all([
      db.select({ total: count() }).from(flavorsTable),
      db.select({ caught: count() }).from(caughtFlavorsTable),
      db.select({ locations: count() }).from(locationsTable),
      db.select().from(caughtFlavorsTable).orderBy(desc(caughtFlavorsTable.caughtAt)).limit(5),
    ]);

    res.json({
      totalFlavors: Number(total),
      caughtFlavors: Number(caught),
      totalLocations: Number(locations),
      recentlyCaught,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
