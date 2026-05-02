import { pgTable, serial, integer, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { flavorsTable } from "./flavors";

export const caughtFlavorsTable = pgTable("caught_flavors", {
  id: serial("id").primaryKey(),
  flavorId: integer("flavor_id").notNull().references(() => flavorsTable.id, { onDelete: "cascade" }),
  caughtAt: timestamp("caught_at").notNull().defaultNow(),
}, (t) => [unique().on(t.flavorId)]);

export const insertCaughtFlavorSchema = createInsertSchema(caughtFlavorsTable).omit({ id: true, caughtAt: true });
export type InsertCaughtFlavor = z.infer<typeof insertCaughtFlavorSchema>;
export type CaughtFlavor = typeof caughtFlavorsTable.$inferSelect;
