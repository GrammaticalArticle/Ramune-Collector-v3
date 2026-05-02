import { Router } from "express";
import { db } from "@workspace/db";
import { flavorsTable, flavorBarcodesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/flavors/:id/barcodes", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id || id < 1) return void res.status(400).json({ error: "Invalid id" });

  try {
    const [flavor] = await db.select().from(flavorsTable).where(eq(flavorsTable.id, id));
    if (!flavor) return void res.status(404).json({ error: "Flavor not found" });

    const barcodes = await db.select().from(flavorBarcodesTable).where(eq(flavorBarcodesTable.flavorId, id));
    res.json(barcodes);
  } catch (err) {
    req.log.error({ err }, "Failed to list flavor barcodes");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/flavors/:id/barcodes", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id || id < 1) return void res.status(400).json({ error: "Invalid id" });

  const { barcode, region, addedBy } = req.body ?? {};
  if (!barcode || typeof barcode !== "string") return void res.status(400).json({ error: "barcode is required" });
  if (!region || typeof region !== "string") return void res.status(400).json({ error: "region is required" });

  // Only tima can add custom barcodes
  if (addedBy !== "tima") {
    return void res.status(403).json({ error: "Only tima can add custom barcodes" });
  }

  try {
    const [flavor] = await db.select().from(flavorsTable).where(eq(flavorsTable.id, id));
    if (!flavor) return void res.status(404).json({ error: "Flavor not found" });

    // Check conflict with primary barcodes
    const [conflictPrimary] = await db.select().from(flavorsTable).where(eq(flavorsTable.barcode, barcode));
    if (conflictPrimary) return void res.status(409).json({ error: "Barcode already exists as primary barcode" });

    // Check conflict with alternate barcodes
    const [conflictAlt] = await db.select().from(flavorBarcodesTable).where(eq(flavorBarcodesTable.barcode, barcode));
    if (conflictAlt) return void res.status(409).json({ error: "Barcode already registered" });

    const [entry] = await db
      .insert(flavorBarcodesTable)
      .values({ flavorId: id, barcode, region, addedBy: addedBy ?? null })
      .returning();
    res.status(201).json(entry);
  } catch (err) {
    req.log.error({ err }, "Failed to add flavor barcode");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/flavors/:id/barcodes/:barcode", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id || id < 1) return void res.status(400).json({ error: "Invalid id" });
  const { barcode } = req.params;
  if (!barcode) return void res.status(400).json({ error: "barcode param required" });

  // Only tima can delete custom barcodes
  const addedBy = req.query.addedBy as string | undefined;
  if (addedBy !== "tima") {
    return void res.status(403).json({ error: "Only tima can remove barcodes" });
  }

  try {
    const [deleted] = await db
      .delete(flavorBarcodesTable)
      .where(eq(flavorBarcodesTable.barcode, barcode))
      .returning();
    if (!deleted) return void res.status(404).json({ error: "Barcode not found" });
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "Failed to delete flavor barcode");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
