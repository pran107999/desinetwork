import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it } from "vitest";
import { parseServerEnv } from "@/lib/db/env";

// A0.3 / T0.2 / T0.3: master data loaded by `supabase db reset`.
// Local only: the cloud project gets the schema, not the seed.
const isLocal = (process.env.SUPABASE_TARGET ?? "local") === "local";

const CITIES: Array<[slug: string, name: string, state: string]> = [
  ["edison-nj", "Edison", "NJ"],
  ["new-york-city-ny", "New York City", "NY"],
  ["sf-bay-area-ca", "San Francisco Bay Area", "CA"],
  ["dallas-tx", "Dallas", "TX"],
  ["houston-tx", "Houston", "TX"],
  ["chicago-il", "Chicago", "IL"],
  ["atlanta-ga", "Atlanta", "GA"],
  ["seattle-wa", "Seattle", "WA"],
  ["washington-dc", "Washington", "DC"],
  ["raleigh-nc", "Raleigh", "NC"],
  ["pittsburgh-pa", "Pittsburgh", "PA"],
];

const CATEGORIES: Record<string, { priceLabel: string | null; subs: string[] }> = {
  rentals: { priceLabel: "Rent / month", subs: ["room-for-rent", "roommate-wanted", "apartment", "sublet"] },
  "real-estate": { priceLabel: "Price", subs: ["house-for-sale", "condo", "commercial"] },
  jobs: { priceLabel: null, subs: ["full-time", "part-time", "contract", "internship"] },
  "buy-sell": {
    priceLabel: "Price",
    subs: ["furniture", "electronics", "appliances", "kids-items", "free-stuff"],
  },
  autos: { priceLabel: "Price", subs: ["cars", "bikes"] },
  services: {
    priceLabel: "Rate",
    subs: [
      "babysitting-nanny",
      "tutoring",
      "cooking-tiffin",
      "tax-accounting",
      "immigration",
      "cleaning",
      "beauty",
    ],
  },
  community: { priceLabel: null, subs: ["carpool", "travel-companion", "lost-found", "announcements"] },
};

type Category = { id: number; parent_id: number | null; slug: string; price_label: string | null };
type Field = {
  category_id: number;
  key: string;
  type: string;
  required: boolean;
  filterable: boolean;
  options: unknown;
};

describe.runIf(isLocal)("seed data after supabase db reset (A0.3)", () => {
  let admin: SupabaseClient;
  let anon: SupabaseClient;
  let categories: Category[];
  let fields: Field[];

  const bySlug = (slug: string, parentSlug?: string) => {
    const parent = parentSlug ? categories.find((c) => c.slug === parentSlug && c.parent_id === null) : null;
    const found = categories.find(
      (c) => c.slug === slug && c.parent_id === (parent ? parent.id : null),
    );
    if (!found) throw new Error(`category ${parentSlug ?? ""}/${slug} not found`);
    return found;
  };
  // Fields a form shows for a subcategory: parent's fields + its own.
  const formFields = (parentSlug: string, subSlug: string) => {
    const parent = bySlug(parentSlug);
    const sub = bySlug(subSlug, parentSlug);
    return fields.filter((f) => f.category_id === parent.id || f.category_id === sub.id);
  };

  beforeAll(async () => {
    const env = parseServerEnv(process.env);
    const opts = { auth: { persistSession: false, autoRefreshToken: false } };
    admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, opts);
    anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, opts);

    const cats = await admin.from("categories").select("id, parent_id, slug, price_label");
    expect(cats.error).toBeNull();
    categories = cats.data as Category[];
    const fs = await admin
      .from("category_fields")
      .select("category_id, key, type, required, filterable, options");
    expect(fs.error).toBeNull();
    fields = fs.data as Field[];
  });

  it("loads the 11 launch cities with slugs and state labels, sorted", async () => {
    const { data, error } = await admin
      .from("cities")
      .select("slug, name, state_label, is_active")
      .order("sort_order");
    expect(error).toBeNull();
    expect(data?.map((c) => [c.slug, c.name, c.state_label])).toEqual(CITIES);
    expect(data?.every((c) => c.is_active)).toBe(true);
  });

  it("loads 7 top-level categories with their price labels and subcategories", () => {
    const top = categories.filter((c) => c.parent_id === null);
    expect(top.map((c) => c.slug).sort()).toEqual(Object.keys(CATEGORIES).sort());
    for (const [slug, expected] of Object.entries(CATEGORIES)) {
      const parent = bySlug(slug);
      expect(parent.price_label, slug).toBe(expected.priceLabel);
      const subs = categories.filter((c) => c.parent_id === parent.id).map((c) => c.slug);
      expect(subs.sort(), slug).toEqual([...expected.subs].sort());
    }
  });

  it("gives rentals their typed fields, with filters and options", () => {
    const f = formFields("rentals", "room-for-rent");
    const keys = f.map((x) => x.key).sort();
    expect(keys).toEqual(
      ["available_date", "deposit", "food_preference", "furnished", "gender_preference", "utilities_included"].sort(),
    );
    const byKey = Object.fromEntries(f.map((x) => [x.key, x]));
    expect(byKey.available_date).toMatchObject({ type: "date", required: true, filterable: true });
    expect(byKey.deposit).toMatchObject({ type: "money" });
    expect(byKey.food_preference).toMatchObject({ type: "select", filterable: true });
    expect(byKey.food_preference.options).toEqual([
      { value: "any", label: "Any" },
      { value: "veg_only", label: "Veg only" },
      { value: "non_veg_ok", label: "Non-veg OK" },
    ]);
  });

  it("adds subcategory-only fields on top of the parent's (real estate)", () => {
    expect(formFields("real-estate", "house-for-sale").map((x) => x.key).sort()).toEqual(
      ["baths", "beds", "sq_ft"],
    );
    expect(formFields("real-estate", "commercial").map((x) => x.key)).toEqual(["sq_ft"]);
    expect(formFields("community", "carpool").map((x) => x.key).sort()).toEqual(
      ["event_date", "route_from", "route_to"],
    );
    expect(formFields("community", "lost-found").map((x) => x.key)).toEqual(["event_date"]);
  });

  it("defines required fields for every category that needs them", () => {
    const required = (p: string, s: string) =>
      formFields(p, s).filter((x) => x.required).map((x) => x.key).sort();
    expect(required("jobs", "full-time")).toEqual(["work_mode"]);
    expect(required("buy-sell", "furniture")).toEqual(["condition"]);
    expect(required("autos", "cars")).toEqual(["make", "mileage", "model", "year"]);
    expect(required("services", "tutoring")).toEqual(["service_area"]);
  });

  it("uses only supported field types, and select fields have options", () => {
    const types = new Set(["text", "number", "money", "select", "bool", "date"]);
    for (const f of fields) {
      expect(types.has(f.type), f.key).toBe(true);
      if (f.type === "select") expect(Array.isArray(f.options) && f.options.length > 0, f.key).toBe(true);
    }
  });

  it("lets signed-out visitors read cities and categories but not profiles", async () => {
    const cities = await anon.from("cities").select("slug");
    expect(cities.error).toBeNull();
    expect(cities.data).toHaveLength(11);

    const cats = await anon.from("categories").select("slug");
    expect(cats.error).toBeNull();
    expect(cats.data?.length).toBe(categories.length);

    const flds = await anon.from("category_fields").select("key");
    expect(flds.error).toBeNull();
    expect(flds.data?.length).toBe(fields.length);

    const profiles = await anon.from("profiles").select("id");
    expect(profiles.data ?? []).toHaveLength(0);
  });

  it("blocks signed-out visitors from changing master data", async () => {
    const { error } = await anon.from("cities").insert({ name: "X", state_label: "XX", slug: "x-xx" });
    expect(error).not.toBeNull();
  });

  it("creates a profile with role user when someone signs up", async () => {
    const email = `a03-${Date.now()}@example.test`;
    const created = await admin.auth.admin.createUser({ email, email_confirm: true });
    expect(created.error).toBeNull();
    const userId = created.data.user!.id;
    try {
      const { data, error } = await admin
        .from("profiles")
        .select("id, role, status, phone_verified")
        .eq("id", userId)
        .single();
      expect(error).toBeNull();
      expect(data).toEqual({ id: userId, role: "user", status: "active", phone_verified: false });
    } finally {
      await admin.auth.admin.deleteUser(userId);
    }
    const gone = await admin.from("profiles").select("id").eq("id", userId);
    expect(gone.data).toHaveLength(0);
  });
});
