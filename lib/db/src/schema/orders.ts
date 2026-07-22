import { pgTable, text, real, timestamp, jsonb } from "drizzle-orm/pg-core";

export const ordersTable = pgTable("orders", {
  id: text("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull().default(""),
  items: jsonb("items").notNull().$type<
    Array<{
      productId: string;
      productName: string;
      colors: string[];
      pattern: string;
      price: number;
    }>
  >(),
  total: real("total").notNull(),
  status: text("status").notNull().default("pending"),
  estimatedCompletion: text("estimated_completion"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Order = typeof ordersTable.$inferSelect;
