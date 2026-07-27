import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, ordersTable } from "@workspace/db";
import {
  CreateOrderBody,
  GetOrderParams,
} from "@workspace/api-zod";
import crypto from "crypto";
import {
  sendEmail,
  orderConfirmationEmail,
  orderOnHoldEmail,
  orderUnholdEmail,
  orderStartedEmail,
} from "../email.js";

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
    customerEmail: order.customerEmail,
    items: order.items as Array<{
      productId: string;
      productName: string;
      colors: string[];
      pattern: string;
      price: number;
    }>,
    total: order.total,
    status: order.status,
    estimatedCompletion: order.estimatedCompletion ?? undefined,
    createdAt: order.createdAt.toISOString(),
  };
}

async function findOrder(orderId: string) {
  const all = await db.select().from(ordersTable);
  return all.find((o) => o.id === orderId || o.orderNumber === orderId) ?? null;
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

  const { customerName, customerEmail, items } = parsed.data as {
    customerName: string;
    customerEmail: string;
    items: Array<{ productId: string; productName: string; colors: string[]; pattern: string; price: number }>;
  };

  if (!customerName || !customerEmail || !items || items.length === 0) {
    res.status(400).json({ error: "Name, email, and items are required" });
    return;
  }

  const total = items.reduce((sum, item) => sum + item.price, 0);
  const id = crypto.randomUUID();
  const orderNumber = generateOrderNumber();

  const [order] = await db
    .insert(ordersTable)
    .values({
      id,
      orderNumber,
      customerName,
      customerEmail,
      items,
      total,
      status: "pending",
    })
    .returning();

  // Send confirmation email (non-blocking)
  const { subject, html } = orderConfirmationEmail({
    customerName,
    orderNumber,
    items,
    total,
  });
  sendEmail({ to: customerEmail, subject, html }).catch(console.error);

  res.status(201).json(serializeOrder(order));
});

router.get("/orders/:orderId", async (req, res): Promise<void> => {
  const params = GetOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const order = await findOrder(params.data.orderId);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json(serializeOrder(order));
});

// PUT ON HOLD
router.post("/orders/:orderId/hold", async (req, res): Promise<void> => {
  const order = await findOrder(req.params.orderId);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const [updated] = await db
    .update(ordersTable)
    .set({ status: "on_hold" })
    .where(eq(ordersTable.id, order.id))
    .returning();

  const { subject, html } = orderOnHoldEmail({
    customerName: order.customerName,
    orderNumber: order.orderNumber,
  });
  sendEmail({ to: order.customerEmail, subject, html }).catch(console.error);

  res.json(serializeOrder(updated));
});

// UNHOLD
router.post("/orders/:orderId/unhold", async (req, res): Promise<void> => {
  const order = await findOrder(req.params.orderId);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const [updated] = await db
    .update(ordersTable)
    .set({ status: "pending" })
    .where(eq(ordersTable.id, order.id))
    .returning();

  const { subject, html } = orderUnholdEmail({
    customerName: order.customerName,
    orderNumber: order.orderNumber,
  });
  sendEmail({ to: order.customerEmail, subject, html }).catch(console.error);

  res.json(serializeOrder(updated));
});
// START MAKING
router.post("/orders/:orderId/start", async (req, res): Promise<void> => {
  const order = await findOrder(req.params.orderId);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const { days = 0, hours = 0, minutes = 0 } = req.body ?? {};

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} day${days !== 1 ? "s" : ""}`);
  if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? "s" : ""}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? "s" : ""}`);
  const estimatedLabel = parts.length > 0 ? parts.join(", ") : "very soon";

  const [updated] = await db
    .update(ordersTable)
    .set({ status: "in_progress", estimatedCompletion: estimatedLabel })
    .where(eq(ordersTable.id, order.id))
    .returning();

  const { subject, html } = orderStartedEmail({
    customerName: order.customerName,
    orderNumber: order.orderNumber,
    estimatedLabel,
  });
  sendEmail({ to: order.customerEmail, subject, html }).catch(console.error);

  res.json(serializeOrder(updated));
});
// COMPLETE ORDER
router.post("/orders/:orderId/complete", async (req, res): Promise<void> => {
  const order = await findOrder(req.params.orderId);

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const [updated] = await db
    .update(ordersTable)
    .set({ status: "completed" })
    .where(eq(ordersTable.id, order.id))
    .returning();

  res.json(serializeOrder(updated));
});


export default router;