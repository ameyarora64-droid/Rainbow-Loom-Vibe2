import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, ordersTable } from "@workspace/db";
import {
  CreateOrderBody,
  GetOrderParams,
} from "@workspace/api-zod";
import crypto from "crypto";

const router: IRouter = Router();

const ADMIN_PASSCODE = "chip and milo";

function generateOrderNumber(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `RL-${num}`;
}

function serializeOrder(order: typeof ordersTable.$inferSelect) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    items: order.items as Array<{
      productId: string;
      productName: string;
      color: string;
      price: number;
    }>,
    total: order.total,
    createdAt: order.createdAt.toISOString(),
  };
}

router.post("/admin/login", async (req, res): Promise<void> => {
  const { passcode } = req.body ?? {};
  if (passcode !== ADMIN_PASSCODE) {
    res.status(401).json({ error: "Wrong passcode" });
    return;
  }
  res.json({ success: true, token: "admin-authenticated" });
});

router.get("/orders", async (req, res): Promise<void> => {
  const orders = await db
    .select()
    .from(ordersTable)
    .orderBy(ordersTable.createdAt);
  res.json(orders.map(serializeOrder));
});

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { customerName, items } = parsed.data;
  if (!customerName || !items || items.length === 0) {
    res.status(400).json({ error: "Name and items are required" });
    return;
  }

  const total = items.reduce((sum: number, item: { price: number }) => sum + item.price, 0);
  const id = crypto.randomUUID();
  const orderNumber = generateOrderNumber();

  const [order] = await db
    .insert(ordersTable)
    .values({
      id,
      orderNumber,
      customerName,
      items,
      total,
    })
    .returning();

  res.status(201).json(serializeOrder(order));
});

router.get("/orders/:orderId", async (req, res): Promise<void> => {
  const params = GetOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  // Allow lookup by orderId or orderNumber
  const allOrders = await db.select().from(ordersTable);
  const order = allOrders.find(
    (o) =>
      o.id === params.data.orderId ||
      o.orderNumber === params.data.orderId
  );

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  res.json(serializeOrder(order));
});

export default router;
