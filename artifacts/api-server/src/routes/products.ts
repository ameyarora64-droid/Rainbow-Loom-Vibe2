import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, productsTable, productColorsTable } from "@workspace/db";
import {
  UpdateProductColorsBody,
  UpdateProductColorsParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

const COLORS = ["red", "orange", "green", "blue", "purple", "pink", "black"];

async function getProductsWithColors() {
  const products = await db.select().from(productsTable);
  const result = await Promise.all(
    products.map(async (product) => {
      const colorRows = await db
        .select()
        .from(productColorsTable)
        .where(eq(productColorsTable.productId, product.id));
      return {
        id: product.id,
        name: product.name,
        price: product.price,
        available: product.available,
        colors: colorRows.map((c) => ({
          color: c.color,
          available: c.available,
        })),
      };
    })
  );
  return result;
}

async function getProductWithColors(productId: string) {
  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, productId));
  if (!product) return null;
  const colorRows = await db
    .select()
    .from(productColorsTable)
    .where(eq(productColorsTable.productId, productId));
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    available: product.available,
    colors: colorRows.map((c) => ({ color: c.color, available: c.available })),
  };
}

router.get("/products", async (req, res): Promise<void> => {
  const products = await getProductsWithColors();
  res.json(products);
});

router.patch("/products/:productId/colors", async (req, res): Promise<void> => {
  const params = UpdateProductColorsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateProductColorsBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const product = await getProductWithColors(params.data.productId);
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  for (const colorUpdate of body.data.colors) {
    await db
      .update(productColorsTable)
      .set({ available: colorUpdate.available })
      .where(
        and(
          eq(productColorsTable.productId, params.data.productId),
          eq(productColorsTable.color, colorUpdate.color)
        )
      );
  }

  const updated = await getProductWithColors(params.data.productId);
  res.json(updated);
});

// Toggle a product available / unavailable
router.patch("/products/:productId/available", async (req, res): Promise<void> => {
  const { productId } = req.params;
  const { available } = req.body ?? {};

  if (typeof available !== "boolean") {
    res.status(400).json({ error: "available must be a boolean" });
    return;
  }

  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, productId));

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  await db
    .update(productsTable)
    .set({ available })
    .where(eq(productsTable.id, productId));

  const updated = await getProductWithColors(productId);
  res.json(updated);
});

// Disable / enable a color globally across ALL products
router.patch("/colors/global", async (req, res): Promise<void> => {
  const { color, available } = req.body ?? {};

  if (!COLORS.includes(color) || typeof available !== "boolean") {
    res.status(400).json({ error: "Invalid color or available value" });
    return;
  }

  await db
    .update(productColorsTable)
    .set({ available })
    .where(eq(productColorsTable.color, color));

  res.json({ success: true });
});

export { COLORS };
export default router;
