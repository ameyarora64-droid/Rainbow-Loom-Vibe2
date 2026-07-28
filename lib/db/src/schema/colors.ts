import { pgTable, text } from "drizzle-orm/pg-core";

export const colorsTable = pgTable("colors", {
  name: text("name").primaryKey(),
  hex: text("hex").notNull(),
});

export type Color = typeof colorsTable.$inferSelect;
