import "server-only";
import { parseServerEnv, type ServerSupabaseEnv } from "./env";

export function serverEnv(): ServerSupabaseEnv {
  return parseServerEnv(process.env);
}
