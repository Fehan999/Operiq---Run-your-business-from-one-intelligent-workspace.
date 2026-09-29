import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AuthorCard } from "@/components/shared/author-card";
import { siteConfig } from "@/config/site";

describe("AuthorCard", () => {
  it("credits the author and links to the code and website", () => {
    render(<AuthorCard />);

    expect(screen.getByRole("complementary", { name: "About the author" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ehan Siddique" })).toHaveAttribute(
      "href",
      "https://ehansiddique.com",
    );
    expect(screen.getByRole("link", { name: /Source on GitHub/ })).toHaveAttribute(
      "href",
      siteConfig.repository,
    );
    expect(screen.getByRole("link", { name: /ehansiddique\.com/ })).toHaveAttribute(
      "rel",
      "me noopener",
    );
  });

  it("opens external links in a new tab without leaking the opener", () => {
    render(<AuthorCard />);
    for (const link of screen.getAllByRole("link")) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link.getAttribute("rel")).toContain("noopener");
    }
  });
});
