import { pgTable, serial, integer, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { locationsTable } from "./locations";
import { flavorsTable } from "./flavors";

export const locationFlavorsTable = pgTable("location_flavors", {
  id: serial("id").primaryKey(),
  locationId: integer("location_id").notNull().references(() => locationsTable.id, { onDelete: "cascade" }),
  flavorId: integer("flavor_id").notNull().references(() => flavorsTable.id, { onDelete: "cascade" }),
  addedAt: timestamp("added_at").notNull().defaultNow(),
}, (t) => [unique().on(t.locationId, t.flavorId)]);

export const insertLocationFlavorSchema = createInsertSchema(locationFlavorsTable).omit({ id: true, addedAt: true });
export type InsertLocationFlavor = z.infer<typeof insertLocationFlavorSchema>;
export type LocationFlavor = typeof locationFlavorsTable.$inferSelect;
