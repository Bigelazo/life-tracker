import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

// Local dev: pull DATABASE_URL from .env.local (written by `neon env pull`).
// Vercel/prod injects env vars directly; dotenv is a no-op when the file is
// missing or the value already exists.
dotenv.config({ path: ".env.local" });

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});