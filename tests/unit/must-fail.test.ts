import { expect, it } from "vitest";

// Throwaway: proves a failing test blocks merge (A0.6). Never merged.
it("fails on purpose", () => {
  expect(1 + 1).toBe(3);
});
