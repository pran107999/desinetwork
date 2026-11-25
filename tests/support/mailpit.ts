// Reads emails captured by local Supabase's test inbox (Mailpit).
// Nothing here is used outside tests.
const base = (process.env.MAILPIT_URL ?? "http://127.0.0.1:54324").replace(/\/$/, "");

type Summary = { ID: string; Subject: string; To: Array<{ Address: string }> };
export type Message = { ID: string; Subject: string; Text: string; HTML: string };

async function search(address: string): Promise<Summary[]> {
  const res = await fetch(`${base}/api/v1/search?query=${encodeURIComponent(`to:"${address}"`)}`);
  if (!res.ok) throw new Error(`Mailpit search failed: ${res.status}`);
  return ((await res.json()) as { messages: Summary[] }).messages ?? [];
}

// Waits for the newest email to an address (Supabase sends asynchronously).
export async function waitForEmail(address: string, timeoutMs = 10_000): Promise<Message> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const [latest] = await search(address);
    if (latest) {
      const res = await fetch(`${base}/api/v1/message/${latest.ID}`);
      return (await res.json()) as Message;
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`No email arrived for ${address} within ${timeoutMs} ms`);
}

export async function deleteEmailsTo(address: string): Promise<void> {
  const ids = (await search(address)).map((m) => m.ID);
  if (ids.length) {
    await fetch(`${base}/api/v1/messages`, {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ IDs: ids }),
    });
  }
}

export const sixDigitCode = (text: string): string | undefined => text.match(/\b(\d{6})\b/)?.[1];
