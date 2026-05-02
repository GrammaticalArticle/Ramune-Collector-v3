import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const flavorsTable = pgTable("flavors", {
  id: serial("id").primaryKey(),
  japaneseName: text("japanese_name").notNull(),
  name: text("name").notNull(),
  barcode: text("barcode").unique(),
  color: text("color").notNull().default("#4FC3F7"),
  brand: text("brand").notNull().default("Hata"),
  category: text("category").notNull().default("standard"),
  sortOrder: integer("sort_order").notNull().default(0),
  description: text("description"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertFlavorSchema = createInsertSchema(flavorsTable).omit({ id: true, createdAt: true });
export type InsertFlavor = z.infer<typeof insertFlavorSchema>;
export type Flavor = typeof flavorsTable.$inferSelect;
