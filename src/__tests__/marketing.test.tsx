import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CtaPair } from "@/components/marketing/cta-pair";
import { FaqAccordion } from "@/components/marketing/faq";
import { LegalProse } from "@/components/marketing/legal-prose";
import HomePage from "@/app/(marketing)/page";

describe("CtaPair — the two conversion paths", () => {
  it("links to WhatsApp with a safe external target and to /register", () => {
    render(<CtaPair />);
    const wa = screen.getByRole("link", { name: /Start on WhatsApp/ });
    expect(wa).toHaveAttribute("href", expect.stringMatching(/^https:\/\/wa\.me\//));
    expect(wa).toHaveAttribute("rel", expect.stringContaining("noopener"));
    expect(screen.getByRole("link", { name: "Create free account" })).toHaveAttribute(
      "href",
      "/register"
    );
  });
});

describe("FaqAccordion", () => {
  it("expands and collapses answers", async () => {
    render(<FaqAccordion />);
    // first item open by default
    expect(screen.getByText(/Amiva works inside WhatsApp/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Is my data private/ }));
    expect(screen.getByText(/never used to train AI models/)).toBeInTheDocument();
    // previous answer collapsed
    expect(screen.queryByText(/Amiva works inside WhatsApp/)).not.toBeInTheDocument();
  });
});

describe("LegalProse template", () => {
  it("renders title, effective date, TOC and draft banner", () => {
    render(
      <LegalProse
        title="Privacy Policy"
        effectiveDate="1 August 2026"
        draft
        sections={[
          { id: "one", heading: "Who we are", body: ["Hello."] },
          { id: "two", heading: "Contact", body: ["Write to us."] },
        ]}
      />
    );
    expect(screen.getByRole("heading", { name: "Privacy Policy" })).toBeInTheDocument();
    expect(screen.getByText(/Effective date: 1 August 2026/)).toBeInTheDocument();
    expect(screen.getByText(/Draft v0.1/)).toBeInTheDocument();
    const toc = screen.getByRole("navigation", { name: "Table of contents" });
    expect(toc).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "1. Who we are" })).toBeInTheDocument();
  });
});

describe("Landing page", () => {
  it("renders the hero with both CTAs above everything else", () => {
    render(<HomePage />);
    expect(
      screen.getByRole("heading", { name: /Your personal chief of staff/ })
    ).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Start on WhatsApp/ }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Create free account" }).length).toBeGreaterThan(0);
  });

  it("markets only shipped MVP features (no vaporware copy)", () => {
    render(<HomePage />);
    for (const feature of [
      /Reminders that actually reach you/,
      /A calendar that manages itself/,
      /A memory that never forgets/,
      /Your inbox, summarised/,
    ]) {
      expect(screen.getByText(feature)).toBeInTheDocument();
    }
  });

  it("links the trust band to the privacy policy", () => {
    render(<HomePage />);
    expect(screen.getByRole("link", { name: /privacy policy/i })).toHaveAttribute(
      "href",
      "/privacy-policy"
    );
  });

  it("pricing shows Free and Pro in local currency", () => {
    render(<HomePage />);
    expect(screen.getByText("₦0")).toBeInTheDocument();
    expect(screen.getByText(/₦1,500/)).toBeInTheDocument();
    expect(screen.getByText("Most popular")).toBeInTheDocument();
  });
});
