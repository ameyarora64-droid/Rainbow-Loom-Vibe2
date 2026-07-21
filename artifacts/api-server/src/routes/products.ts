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
        colors: colorRows.map((c) => ({
          color: c.color,
          available: c.available,
        })),
      };
    })
  );
  return result;
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

  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, params.data.productId));

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

  const updatedColors = await db
    .select()
    .from(productColorsTable)
    .where(eq(productColorsTable.productId, params.data.productId));

  res.json({
    id: product.id,
    name: product.name,
    price: product.price,
    colors: updatedColors.map((c) => ({ color: c.color, available: c.available })),
  });
});

export { COLORS };
export default router;
