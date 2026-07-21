import { pgTable, text, real, timestamp, jsonb } from "drizzle-orm/pg-core";

export const ordersTable = pgTable("orders", {
  id: text("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  customerName: text("customer_name").notNull(),
  items: jsonb("items").notNull().$type<
    Array<{
      productId: string;
      productName: string;
      color: string;
      price: number;
    }>
  >(),
  total: real("total").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Order = typeof ordersTable.$inferSelect;
