import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

const one = await sql`SELECT 1 AS ok`;
console.log("SELECT 1:", one);

const settings = await sql`SELECT id, timezone, currency FROM settings`;
console.log("settings:", settings);