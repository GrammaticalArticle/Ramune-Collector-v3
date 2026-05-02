import { Router } from "express";
import { db } from "@workspace/db";
import { flavorsTable, flavorBarcodesTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { GetFlavorByBarcodeParams, GetFlavorParams } from "@workspace/api-zod";

const router = Router();

router.get("/flavors", async (req, res) => {
  try {
    const flavors = await db.select().from(flavorsTable).orderBy(asc(flavorsTable.sortOrder), asc(flavorsTable.name));
    res.json(flavors);
  } catch (err) {
    req.log.error({ err }, "Failed to list flavors");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/flavors/:id/barcode", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id || id < 1) return void res.status(400).json({ error: "Invalid id" });

  const { barcode, addedBy } = req.body ?? {};
  if (!barcode || typeof barcode !== "string") return void res.status(400).json({ error: "barcode is required" });
  if (addedBy !== "tima") return void res.status(403).json({ error: "Only tima can set barcodes" });

  try {
    const [flavor] = await db.select().from(flavorsTable).where(eq(flavorsTable.id, id));
    if (!flavor) return void res.status(404).json({ error: "Flavor not found" });

    // Check for conflicts with other primary barcodes
    const [conflict] = await db.select().from(flavorsTable).where(eq(flavorsTable.barcode, barcode));
    if (conflict && conflict.id !== id) return void res.status(409).json({ error: "Barcode already in use" });

    // Check for conflicts with alternate barcodes
    const [altConflict] = await db.select().from(flavorBarcodesTable).where(eq(flavorBarcodesTable.barcode, barcode));
    if (altConflict) return void res.status(409).json({ error: "Barcode already registered as alternate" });

    const [updated] = await db.update(flavorsTable).set({ barcode }).where(eq(flavorsTable.id, id)).returning();
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to set flavor barcode");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/flavors/barcode/:barcode", async (req, res) => {
  const parsed = GetFlavorByBarcodeParams.safeParse(req.params);
  if (!parsed.success) return void res.status(400).json({ error: "Invalid barcode" });

  const { barcode } = parsed.data;

  try {
    // Check primary barcode first
    const [flavor] = await db.select().from(flavorsTable).where(eq(flavorsTable.barcode, barcode));
    if (flavor) return void res.json(flavor);

    // Check alternate barcodes table
    const [alt] = await db
      .select({ flavor: flavorsTable })
      .from(flavorBarcodesTable)
      .innerJoin(flavorsTable, eq(flavorBarcodesTable.flavorId, flavorsTable.id))
      .where(eq(flavorBarcodesTable.barcode, barcode));

    if (!alt) return void res.status(404).json({ error: "Flavor not found for this barcode" });
    res.json(alt.flavor);
  } catch (err) {
    req.log.error({ err }, "Failed to get flavor by barcode");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/flavors/:id", async (req, res) => {
  const parsed = GetFlavorParams.safeParse(req.params);
  if (!parsed.success) return void res.status(400).json({ error: "Invalid id" });

  try {
    const [flavor] = await db.select().from(flavorsTable).where(eq(flavorsTable.id, parsed.data.id));
    if (!flavor) return void res.status(404).json({ error: "Flavor not found" });
    res.json(flavor);
  } catch (err) {
    req.log.error({ err }, "Failed to get flavor");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
