import { Router } from "express";
import { db } from "@workspace/db";
import { flavorsTable, flavorBarcodesTable } from "@workspace/db";
import { eq, asc, or } from "drizzle-orm";
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
