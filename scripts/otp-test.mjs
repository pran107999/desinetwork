// A0.9e: prove email sign-in codes work on cloud staging with a real inbox.
// Usage: pnpm otp:test   (reads .env.staging.local; asks for your email and the code)
// If the script creates a new account for that email, it deletes it at the end.
// Pre-existing accounts are never deleted. Full addresses are never printed.
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { createClient } from "@supabase/supabase-js";

const { NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: pub, SUPABASE_SECRET_KEY: secret } =
  process.env;
if (!url || !pub || !secret) {
  console.error("Missing Supabase values in .env.staging.local (see README).");
  process.exit(1);
}
const mask = (e) => (e.includes("@") ? `${e[0]}***${e.slice(e.lastIndexOf("@"))}` : "***");
const opts = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(url, secret, opts);
const visitor = createClient(url, pub, opts);
const rl = createInterface({ input: stdin, output: stdout });

async function findUser(email) {
  for (let page = 1; page < 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (hit || data.users.length < 200) return hit;
  }
}

let createdId;
try {
  const email = (await rl.question("Your email address: ")).trim();
  const existed = Boolean(await findUser(email));

  const sent = await visitor.auth.signInWithOtp({ email });
  if (sent.error) throw new Error(`Could not send code: ${sent.error.message}`);
  console.log(`Code sent to ${mask(email)}. Check your inbox (and spam).`);
  if (!existed) createdId = (await findUser(email))?.id;

  const code = (await rl.question("6-digit code: ")).trim();
  const { data, error } = await visitor.auth.verifyOtp({ email, token: code, type: "email" });
  if (error || !data.session) throw new Error(`Code rejected: ${error?.message ?? "no session"}`);
  console.log(`✓ Signed in to staging as ${mask(email)} with the emailed code.`);
} catch (err) {
  console.error(`✗ ${err instanceof Error ? err.message : err}`);
  process.exitCode = 1;
} finally {
  rl.close();
  if (createdId) {
    await admin.auth.admin.deleteUser(createdId);
    console.log("Temporary staging account deleted.");
  }
}
