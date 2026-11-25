import { describe, expect, it } from "vitest";
import { deployedCommit } from "@/lib/deploy-info";

describe("deployedCommit (A0.5)", () => {
  it("returns the short commit id on Vercel", () => {
    expect(deployedCommit({ VERCEL_GIT_COMMIT_SHA: "fece4331a2b3c4d5e6f708192a3b4c5d6e7f8091" })).toBe("fece433");
  });

  it("returns 'local' when not deployed", () => {
    expect(deployedCommit({})).toBe("local");
  });

  it("ignores anything that is not a commit id", () => {
    expect(deployedCommit({ VERCEL_GIT_COMMIT_SHA: "<script>" })).toBe("local");
  });
});
