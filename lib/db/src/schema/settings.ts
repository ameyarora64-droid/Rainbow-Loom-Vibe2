import { pgTable, boolean } from "drizzle-orm/pg-core";

export const settingsTable = pgTable("settings", {
  id: boolean("id").default(true).primaryKey(),
  storeOpen: boolean("store_open").default(true).notNull(),
});
