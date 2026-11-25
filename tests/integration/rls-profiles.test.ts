import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { parseServerEnv } from "@/lib/db/env";
import type { Database } from "@/lib/db/types";

// A0.4: baseline row-level security on profiles.
// Real users, real sign-ins, against local Supabase. Test users are deleted afterwards.
const isLocal = (process.env.SUPABASE_TARGET ?? "local") === "local";

type Client = SupabaseClient<Database>;
type TestUser = { id: string; client: Client };

describe.runIf(isLocal)("profiles access rules (A0.4)", () => {
  const env = parseServerEnv(process.env);
  const opts = { auth: { persistSession: false, autoRefreshToken: false } };
  const admin: Client = createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SECRET_KEY,
    opts,
  );
  const anon: Client = createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    opts,
  );
  const created: string[] = [];

  // Creates a confirmed user and returns a client signed in as that user.
  async function signUp(name: string): Promise<TestUser> {
    const email = `a04-${name}-${randomUUID()}@example.test`;
    const password = `Pw-${randomUUID()}`;
    const res = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    });
    if (res.error) throw res.error;
    created.push(res.data.user.id);

    const client = createClient<Database>(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      opts,
    );
    const signIn = await client.auth.signInWithPassword({ email, password });
    if (signIn.error) throw signIn.error;
    return { id: res.data.user.id, client };
  }

  let a: TestUser;
  let b: TestUser;
  let mod: TestUser;

  beforeAll(async () => {
    a = await signUp("Alice");
    b = await signUp("Bob");
    mod = await signUp("Mona");
    const promote = await admin.from("profiles").update({ role: "moderator" }).eq("id", mod.id);
    if (promote.error) throw promote.error;
  });

  afterAll(async () => {
    for (const id of created) await admin.auth.admin.deleteUser(id);
  });

  const profileOf = async (id: string) =>
    (await admin.from("profiles").select("*").eq("id", id).single()).data!;

  describe("a signed-in user", () => {
    it("can read their own profile", async () => {
      const { data, error } = await a.client.from("profiles").select("id, display_name").eq("id", a.id);
      expect(error).toBeNull();
      expect(data).toEqual([{ id: a.id, display_name: "Alice" }]);
    });

    it("cannot see anyone else's profile", async () => {
      const { data, error } = await a.client.from("profiles").select("id");
      expect(error).toBeNull();
      expect(data?.map((p) => p.id)).toEqual([a.id]);
    });

    it("can update their own name, photo and city", async () => {
      const city = (await admin.from("cities").select("id").eq("slug", "edison-nj").single()).data!;
      const { data, error } = await a.client
        .from("profiles")
        .update({ display_name: "Alice K", photo_url: "https://example.test/a.webp", city_id: city.id })
        .eq("id", a.id)
        .select("display_name, photo_url, city_id");
      expect(error).toBeNull();
      expect(data).toEqual([
        { display_name: "Alice K", photo_url: "https://example.test/a.webp", city_id: city.id },
      ]);
    });

    it("cannot edit another user's profile (AC: user A cannot edit user B's data)", async () => {
      const before = await profileOf(b.id);
      const { data, error } = await a.client
        .from("profiles")
        .update({ display_name: "Hacked by Alice" })
        .eq("id", b.id)
        .select("id");
      expect(error).toBeNull(); // RLS hides the row, so nothing matches
      expect(data).toEqual([]);
      expect(await profileOf(b.id)).toEqual(before);
    });

    it.each([
      ["role", { role: "admin" as const }],
      ["status", { status: "active" as const }],
      ["phone_verified", { phone_verified: true }],
      ["created_at", { created_at: "2000-01-01T00:00:00Z" }],
    ])("cannot change their own %s", async (_column, change) => {
      const before = await profileOf(a.id);
      const { error } = await a.client.from("profiles").update(change).eq("id", a.id);
      expect(error?.message).toMatch(/permission denied/);
      expect(await profileOf(a.id)).toEqual(before);
    });

    it("cannot create a profile", async () => {
      const { error } = await a.client.from("profiles").insert({ id: randomUUID() });
      expect(error?.message).toMatch(/permission denied/);
    });

    it("cannot delete their own or anyone's profile", async () => {
      const own = await a.client.from("profiles").delete().eq("id", a.id);
      expect(own.error?.message).toMatch(/permission denied/);
      const other = await a.client.from("profiles").delete().eq("id", b.id);
      expect(other.error?.message).toMatch(/permission denied/);
      expect(await profileOf(a.id)).toBeTruthy();
      expect(await profileOf(b.id)).toBeTruthy();
    });

    it("cannot change master data (cities)", async () => {
      const { error } = await a.client.from("cities").update({ name: "Hacked" }).eq("slug", "edison-nj");
      expect(error?.message).toMatch(/permission denied/);
    });
  });

  describe("a signed-out visitor", () => {
    it("cannot read profiles", async () => {
      const { data } = await anon.from("profiles").select("id");
      expect(data ?? []).toEqual([]);
    });

    it("cannot edit profiles", async () => {
      const before = await profileOf(b.id);
      const { error } = await anon.from("profiles").update({ display_name: "Anon" }).eq("id", b.id);
      expect(error).not.toBeNull();
      expect(await profileOf(b.id)).toEqual(before);
    });
  });

  describe("a moderator", () => {
    it("can read every profile", async () => {
      const { data, error } = await mod.client.from("profiles").select("id").in("id", [a.id, b.id, mod.id]);
      expect(error).toBeNull();
      expect(data?.map((p) => p.id).sort()).toEqual([a.id, b.id, mod.id].sort());
    });

    it("cannot edit another user's profile", async () => {
      const before = await profileOf(b.id);
      const { data } = await mod.client
        .from("profiles")
        .update({ display_name: "Edited by mod" })
        .eq("id", b.id)
        .select("id");
      expect(data).toEqual([]);
      expect(await profileOf(b.id)).toEqual(before);
    });

    it("loses staff access when suspended", async () => {
      await admin.from("profiles").update({ status: "suspended" }).eq("id", mod.id);
      try {
        const { data } = await mod.client.from("profiles").select("id").in("id", [a.id, b.id]);
        expect(data).toEqual([]);
      } finally {
        await admin.from("profiles").update({ status: "active" }).eq("id", mod.id);
      }
    });
  });
});
