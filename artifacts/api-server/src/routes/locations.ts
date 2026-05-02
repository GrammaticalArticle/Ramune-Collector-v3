import { Router } from "express";
import { db } from "@workspace/db";
import { locationsTable, locationFlavorsTable, flavorsTable, caughtFlavorsTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import {
  CreateLocationBody,
  GetLocationParams,
  UpdateLocationParams,
  UpdateLocationBody,
  DeleteLocationParams,
  AddLocationFlavorParams,
  AddLocationFlavorBody,
  RemoveLocationFlavorParams,
  RemoveLocationFlavorBody,
} from "@workspace/api-zod";

const router = Router();

router.get("/locations", async (req, res) => {
  try {
    const locations = await db.select().from(locationsTable).orderBy(locationsTable.name);
    const withCounts = await Promise.all(
      locations.map(async (loc) => {
        const [{ value }] = await db
          .select({ value: count() })
          .from(locationFlavorsTable)
          .where(eq(locationFlavorsTable.locationId, loc.id));
        return { ...loc, confirmedCount: Number(value) };
      })
    );
    res.json(withCounts);
  } catch (err) {
    req.log.error({ err }, "Failed to list locations");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/locations", async (req, res) => {
  const parsed = CreateLocationBody.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: "Invalid request body" });

  try {
    const [location] = await db.insert(locationsTable).values(parsed.data).returning();
    res.status(201).json({ ...location, confirmedCount: 0 });
  } catch (err) {
    req.log.error({ err }, "Failed to create location");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/locations/:id", async (req, res) => {
  const parsed = GetLocationParams.safeParse(req.params);
  if (!parsed.success) return void res.status(400).json({ error: "Invalid id" });

  try {
    const [location] = await db.select().from(locationsTable).where(eq(locationsTable.id, parsed.data.id));
    if (!location) return void res.status(404).json({ error: "Location not found" });

    const lf = await db
      .select({ flavor: flavorsTable })
      .from(locationFlavorsTable)
      .innerJoin(flavorsTable, eq(locationFlavorsTable.flavorId, flavorsTable.id))
      .where(eq(locationFlavorsTable.locationId, parsed.data.id));

    res.json({ ...location, confirmedCount: lf.length, flavors: lf.map((r) => r.flavor) });
  } catch (err) {
    req.log.error({ err }, "Failed to get location");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/locations/:id", async (req, res) => {
  const paramsParsed = UpdateLocationParams.safeParse(req.params);
  if (!paramsParsed.success) return void res.status(400).json({ error: "Invalid id" });
  const bodyParsed = UpdateLocationBody.safeParse(req.body);
  if (!bodyParsed.success) return void res.status(400).json({ error: "Invalid request body" });

  try {
    const [updated] = await db
      .update(locationsTable)
      .set(bodyParsed.data)
      .where(eq(locationsTable.id, paramsParsed.data.id))
      .returning();
    if (!updated) return void res.status(404).json({ error: "Location not found" });

    const [{ value }] = await db
      .select({ value: count() })
      .from(locationFlavorsTable)
      .where(eq(locationFlavorsTable.locationId, updated.id));
    res.json({ ...updated, confirmedCount: Number(value) });
  } catch (err) {
    req.log.error({ err }, "Failed to update location");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/locations/:id", async (req, res) => {
  const parsed = DeleteLocationParams.safeParse(req.params);
  if (!parsed.success) return void res.status(400).json({ error: "Invalid id" });

  try {
    const [deleted] = await db.delete(locationsTable).where(eq(locationsTable.id, parsed.data.id)).returning();
    if (!deleted) return void res.status(404).json({ error: "Location not found" });
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "Failed to delete location");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/locations/:id/flavors", async (req, res) => {
  const paramsParsed = AddLocationFlavorParams.safeParse(req.params);
  if (!paramsParsed.success) return void res.status(400).json({ error: "Invalid id" });
  const bodyParsed = AddLocationFlavorBody.safeParse(req.body);
  if (!bodyParsed.success) return void res.status(400).json({ error: "Invalid request body" });

  const locationId = paramsParsed.data.id;
  const { flavorId } = bodyParsed.data;

  try {
    const [location] = await db.select().from(locationsTable).where(eq(locationsTable.id, locationId));
    if (!location) return void res.status(404).json({ error: "Location not found" });

    const [flavor] = await db.select().from(flavorsTable).where(eq(flavorsTable.id, flavorId));
    if (!flavor) return void res.status(400).json({ error: "Flavor not found" });

    const existing = await db
      .select()
      .from(locationFlavorsTable)
      .where(eq(locationFlavorsTable.locationId, locationId));
    if (existing.some((e) => e.flavorId === flavorId)) {
      return void res.status(409).json({ error: "Flavor already confirmed at this location" });
    }

    const [lf] = await db.insert(locationFlavorsTable).values({ locationId, flavorId }).returning();
    res.status(201).json(lf);
  } catch (err) {
    req.log.error({ err }, "Failed to add location flavor");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/locations/:id/flavors", async (req, res) => {
  const paramsParsed = RemoveLocationFlavorParams.safeParse(req.params);
  if (!paramsParsed.success) return void res.status(400).json({ error: "Invalid id" });
  const bodyParsed = RemoveLocationFlavorBody.safeParse(req.body);
  if (!bodyParsed.success) return void res.status(400).json({ error: "Invalid request body" });

  const locationId = paramsParsed.data.id;
  const { flavorId } = bodyParsed.data;

  try {
    const [deleted] = await db
      .delete(locationFlavorsTable)
      .where(eq(locationFlavorsTable.locationId, locationId))
      .returning();
    if (!deleted || deleted.flavorId !== flavorId) return void res.status(404).json({ error: "Not found" });
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "Failed to remove location flavor");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
