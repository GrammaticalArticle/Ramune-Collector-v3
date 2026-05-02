import { Router } from "express";
import { db } from "@workspace/db";
import { flavorsTable } from "@workspace/db";
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

router.get("/flavors/barcode/:barcode", async (req, res) => {
  const parsed = GetFlavorByBarcodeParams.safeParse(req.params);
  if (!parsed.success) return void res.status(400).json({ error: "Invalid barcode" });

  try {
    const [flavor] = await db.select().from(flavorsTable).where(eq(flavorsTable.barcode, parsed.data.barcode));
    if (!flavor) return void res.status(404).json({ error: "Flavor not found for this barcode" });
    res.json(flavor);
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
