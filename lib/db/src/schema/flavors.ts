import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const flavorsTable = pgTable("flavors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  barcode: text("barcode").notNull().unique(),
  color: text("color").notNull().default("#4FC3F7"),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertFlavorSchema = createInsertSchema(flavorsTable).omit({ id: true, createdAt: true });
export type InsertFlavor = z.infer<typeof insertFlavorSchema>;
export type Flavor = typeof flavorsTable.$inferSelect;
