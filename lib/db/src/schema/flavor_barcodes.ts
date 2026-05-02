import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { flavorsTable } from "./flavors";

export const flavorBarcodesTable = pgTable("flavor_barcodes", {
  id: serial("id").primaryKey(),
  flavorId: integer("flavor_id").notNull().references(() => flavorsTable.id, { onDelete: "cascade" }),
  barcode: text("barcode").notNull().unique(),
  region: text("region").notNull().default("JP"),
  addedBy: text("added_by"),
  addedAt: timestamp("added_at").notNull().defaultNow(),
});

export const insertFlavorBarcodeSchema = createInsertSchema(flavorBarcodesTable).omit({ id: true, addedAt: true });
export type InsertFlavorBarcode = z.infer<typeof insertFlavorBarcodeSchema>;
export type FlavorBarcode = typeof flavorBarcodesTable.$inferSelect;
