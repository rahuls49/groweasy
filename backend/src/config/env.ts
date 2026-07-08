import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z
    .string()
    .optional()
    .default("4000")
    .transform((v) => parseInt(v, 10)),

  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),

  AI_BATCH_SIZE: z
    .string()
    .optional()
    .default("20")
    .transform((v) => parseInt(v, 10)),

  AI_MAX_RETRIES: z
    .string()
    .optional()
    .default("3")
    .transform((v) => parseInt(v, 10)),

  CORS_ORIGIN: z.string().optional().default("http://localhost:3000"),

  NODE_ENV: z
    .enum(["development", "production", "test"])
    .optional()
    .default("development"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  for (const [key, messages] of Object.entries(
    parsed.error.flatten().fieldErrors
  )) {
    console.error(`  ${key}: ${messages?.join(", ")}`);
  }
  process.exit(1);
}

export const env = parsed.data;
