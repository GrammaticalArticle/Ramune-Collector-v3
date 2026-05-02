import { Router } from "express";
import { db } from "@workspace/db";
import { flavorsTable, caughtFlavorsTable, locationsTable } from "@workspace/db";
import { count, desc, eq } from "drizzle-orm";

const router = Router();

router.get("/stats", async (req, res) => {
  const username = typeof req.query.username === "string" ? req.query.username : undefined;

  try {
    const [[{ total }], [{ locations }]] = await Promise.all([
      db.select({ total: count() }).from(flavorsTable),
      db.select({ locations: count() }).from(locationsTable),
    ]);

    let caughtCount: number;
    let recentlyCaught: (typeof caughtFlavorsTable.$inferSelect)[];

    if (username) {
      const [[caughtRow], recent] = await Promise.all([
        db.select({ caught: count() }).from(caughtFlavorsTable).where(eq(caughtFlavorsTable.username, username)),
        db.select().from(caughtFlavorsTable).where(eq(caughtFlavorsTable.username, username)).orderBy(desc(caughtFlavorsTable.caughtAt)).limit(5),
      ]);
      caughtCount = Number(caughtRow.caught);
      recentlyCaught = recent;
    } else {
      const [[caughtRow], recent] = await Promise.all([
        db.select({ caught: count() }).from(caughtFlavorsTable),
        db.select().from(caughtFlavorsTable).orderBy(desc(caughtFlavorsTable.caughtAt)).limit(5),
      ]);
      caughtCount = Number(caughtRow.caught);
      recentlyCaught = recent;
    }

    res.json({
      totalFlavors: Number(total),
      caughtFlavors: caughtCount,
      totalLocations: Number(locations),
      recentlyCaught,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
