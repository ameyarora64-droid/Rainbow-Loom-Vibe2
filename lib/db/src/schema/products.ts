import { pgTable, text, real, boolean } from "drizzle-orm/pg-core";

export const productsTable = pgTable("products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  price: real("price").notNull(),
});

export const productColorsTable = pgTable("product_colors", {
  productId: text("product_id")
    .notNull()
    .references(() => productsTable.id, { onDelete: "cascade" }),
  color: text("color").notNull(),
  available: boolean("available").notNull().default(true),
});

export type Product = typeof productsTable.$inferSelect;
export type ProductColor = typeof productColorsTable.$inferSelect;
