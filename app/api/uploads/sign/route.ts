import { createClient } from "@/lib/db/server";
import { createUploadUrl } from "@/lib/storage/r2";
import { parseUploadRequest } from "@/lib/storage/rules";
import { storageText } from "@/lib/storage/text";

const noStore = { "Cache-Control": "no-store" };
const fail = (status: number, error: string) => Response.json({ error }, { status, headers: noStore });

// POST /api/uploads/sign  { contentType, size }  →  { uploadUrl, key, expiresIn }
// Signed-in, active users only. The user id always comes from the session.
// TODO(T1.5): rate-limit uploads per user (CLAUDE.md §7) when the post-ad flow uses this.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail(401, storageText.signInRequired);

  const { data: profile } = await supabase.from("profiles").select("status").eq("id", user.id).single();
  if (profile?.status !== "active") return fail(403, storageText.notAllowed);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(400, storageText.badRequest);
  }
  const parsed = parseUploadRequest(body);
  if (!parsed.ok) return fail(400, parsed.error);

  try {
    const signed = await createUploadUrl({ userId: user.id, ...parsed.value });
    return Response.json(signed, { headers: noStore });
  } catch (err) {
    console.error(`[uploads] could not sign upload: ${err instanceof Error ? err.message : "unknown"}`);
    return fail(503, storageText.unavailable);
  }
}
