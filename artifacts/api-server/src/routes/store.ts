import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { settingsTable } from "@workspace/db";

const router: IRouter = Router();

async function getOrInitSettings() {
  const rows = await db.select().from(settingsTable);
  if (rows.length > 0) return rows[0];
  const [created] = await db.insert(settingsTable).values({ id: true, storeOpen: true }).returning();
  return created;
}

// GET /store/status
router.get("/store/status", async (_req, res): Promise<void> => {
  const settings = await getOrInitSettings();
  res.json({ open: settings.storeOpen });
});

// PATCH /store/status
router.patch("/store/status", async (req, res): Promise<void> => {
  const { open } = req.body ?? {};
  if (typeof open !== "boolean") {
    res.status(400).json({ error: "open must be a boolean" });
    return;
  }
  await db.update(settingsTable).set({ storeOpen: open });
  res.json({ open });
});

export default router;
