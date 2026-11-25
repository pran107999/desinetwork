// Short id of the deployed commit, so we can see which version is live
// (A0.5). Vercel sets VERCEL_GIT_COMMIT_SHA on every deployment; locally
// and in CI it is absent. The repo is public, so this reveals nothing private.
export function deployedCommit(source: Record<string, string | undefined> = process.env): string {
  const sha = source.VERCEL_GIT_COMMIT_SHA?.trim();
  return sha && /^[0-9a-f]{7,40}$/i.test(sha) ? sha.slice(0, 7) : "local";
}
