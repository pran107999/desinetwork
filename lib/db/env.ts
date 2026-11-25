import { z } from "zod";

const requiredString = (name: string) =>
  z.string({ error: `${name} is missing` }).min(1, `${name} is missing`);

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url({ error: "NEXT_PUBLIC_SUPABASE_URL must be a URL" }),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: requiredString("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
});

const serverSchema = publicSchema.extend({
  SUPABASE_SECRET_KEY: requiredString("SUPABASE_SECRET_KEY"),
});

export type PublicSupabaseEnv = z.infer<typeof publicSchema>;
export type ServerSupabaseEnv = z.infer<typeof serverSchema>;

type EnvSource = Record<string, string | undefined>;

function parse<T>(schema: z.ZodType<T>, source: EnvSource): T {
  const result = schema.safeParse(source);
  if (!result.success) {
    // Only variable names appear in the message, never values.
    const problems = result.error.issues.map((i) => i.message).join("; ");
    throw new Error(`Invalid Supabase environment: ${problems}. See .env.example.`);
  }
  return result.data;
}

export function parsePublicEnv(source: EnvSource): PublicSupabaseEnv {
  return parse(publicSchema, source);
}

export function parseServerEnv(source: EnvSource): ServerSupabaseEnv {
  return parse(serverSchema, source);
}

// NEXT_PUBLIC_* values must be read with literal property names so Next.js
// can inline them into the browser bundle.
export function publicEnv(): PublicSupabaseEnv {
  return parsePublicEnv({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
}
