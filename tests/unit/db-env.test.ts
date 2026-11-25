import { describe, expect, it } from "vitest";
import { parsePublicEnv, parseServerEnv } from "@/lib/db/env";

const valid = {
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
  SUPABASE_SECRET_KEY: "sb_secret_test",
};

describe("Supabase env validation (A0.2)", () => {
  it("accepts a complete environment", () => {
    expect(parseServerEnv(valid)).toEqual(valid);
    expect(parsePublicEnv(valid)).toEqual({
      NEXT_PUBLIC_SUPABASE_URL: valid.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: valid.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    });
  });

  it("rejects a missing secret key and names the variable", () => {
    expect(() => parseServerEnv({ ...valid, SUPABASE_SECRET_KEY: undefined })).toThrow(
      /SUPABASE_SECRET_KEY/,
    );
  });

  it("rejects a URL that is not a URL", () => {
    expect(() => parsePublicEnv({ ...valid, NEXT_PUBLIC_SUPABASE_URL: "not a url" })).toThrow(
      /NEXT_PUBLIC_SUPABASE_URL/,
    );
  });

  it("never puts secret values in the error message", () => {
    try {
      parseServerEnv({ ...valid, NEXT_PUBLIC_SUPABASE_URL: "bad" });
    } catch (e) {
      expect(String(e)).not.toContain(valid.SUPABASE_SECRET_KEY);
      expect(String(e)).not.toContain(valid.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
    }
  });
});
