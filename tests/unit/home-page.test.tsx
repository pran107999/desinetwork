import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";
import { siteText } from "@/lib/site-text";

describe("starter home page (A0.1)", () => {
  it("shows the Desinetwork name as the main heading", () => {
    render(<Home />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Desinetwork" }),
    ).toBeInTheDocument();
  });

  it("shows the Post Free Ad button", () => {
    render(<Home />);
    expect(
      screen.getByRole("button", { name: siteText.postAd }),
    ).toBeInTheDocument();
  });
});
