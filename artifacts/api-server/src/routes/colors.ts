import { Router, type IRouter } from "express";
import { db, colorsTable, productsTable, productColorsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

// Seed default colors if empty
const DEFAULT_COLORS: { name: string; hex: string }[] = [
  { name: "red", hex: "#ef4444" },
  { name: "orange", hex: "#f97316" },
  { name: "green", hex: "#22c55e" },
  { name: "blue", hex: "#3b82f6" },
  { name: "purple", hex: "#a855f7" },
  { name: "pink", hex: "#ec4899" },
  { name: "black", hex: "#1f2937" },
];

export async function seedColorsIfEmpty() {
  const existing = await db.select().from(colorsTable);
  if (existing.length === 0) {
    await db.insert(colorsTable).values(DEFAULT_COLORS);
  }
}

// GET /colors — list all colors with hex
router.get("/colors", async (req, res): Promise<void> => {
  const colors = await db.select().from(colorsTable);
  res.json(colors);
});

// POST /colors — add a new color and assign it to all products
router.post("/colors", async (req, res): Promise<void> => {
  const { name, hex } = req.body ?? {};

  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof hex !== "string" ||
    !hex.trim()
  ) {
    res.status(400).json({ error: "name and hex are required" });
    return;
  }

  const colorName = name.trim().toLowerCase().replace(/\s+/g, "_");

  // Check for duplicate
  const [existing] = await db
    .select()
    .from(colorsTable)
    .where(eq(colorsTable.name, colorName));

  if (existing) {
    res.status(409).json({ error: "Color already exists" });
    return;
  }

  // Insert into colors table
  await db.insert(colorsTable).values({ name: colorName, hex: hex.trim() });

  // Assign to all existing products
  const products = await db.select().from(productsTable);
  if (products.length > 0) {
    await db.insert(productColorsTable).values(
      products.map((p) => ({
        productId: p.id,
        color: colorName,
        available: true,
      }))
    );
  }

  res.status(201).json({ name: colorName, hex: hex.trim() });
});

// DELETE /colors/:name — remove a color
router.delete("/colors/:name", async (req, res): Promise<void> => {
  const { name } = req.params;

  await db
    .delete(productColorsTable)
    .where(eq(productColorsTable.color, name));

  await db.delete(colorsTable).where(eq(colorsTable.name, name));

  res.json({ success: true });
});

export default router;
