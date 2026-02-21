import { z } from "zod";

const envSchema = z.object({
  // Required
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  NEXTAUTH_URL: z.string().min(1, "NEXTAUTH_URL is required"),
  NEXTAUTH_SECRET: z.string().min(1, "NEXTAUTH_SECRET is required"),

  // Optional
  DIRECT_URL: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  YOUTUBE_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  ALLOWED_ORIGIN: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let _env: Env | undefined;

export function getEnv(): Env {
  if (!_env) {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
      console.error(
        "❌ Invalid environment variables:",
        result.error.flatten().fieldErrors
      );
      throw new Error("Invalid environment variables");
    }
    _env = result.data;
  }
  return _env;
}
