import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchPalette } from "@/components/search-palette";

const FIND_TIMEOUT = { timeout: 2500 }; // mock search resolves after ~700ms

describe("SearchPalette", () => {
  it("returns a grounded answer with confidence badge and cited sources", async () => {
    render(<SearchPalette onClose={vi.fn()} />);
    await userEvent.click(
      screen.getByRole("button", { name: "What's my landlord's account?" })
    );
    const matches = await screen.findAllByText(/GTB 0123456789/, undefined, FIND_TIMEOUT);
    expect(matches.length).toBeGreaterThan(0);
    expect(screen.getByText(/high confidence/i)).toBeInTheDocument();
    expect(screen.getByText("Sources")).toBeInTheDocument();
    expect(screen.getByText("Landlord's account")).toBeInTheDocument();
  });

  it("says 'not found' honestly instead of fabricating (PRD KNW-05)", async () => {
    render(<SearchPalette onClose={vi.fn()} />);
    const input = screen.getByRole("textbox", { name: "Search or ask Amiva" });
    await userEvent.type(input, "quantum flux capacitor schematics");
    await userEvent.click(screen.getByRole("button", { name: /Search/ }));
    expect(
      await screen.findByText(/couldn't find that/i, undefined, FIND_TIMEOUT)
    ).toBeInTheDocument();
    // No fabricated citations, no confidence badge presented as knowledge
    expect(screen.queryByText("Sources")).not.toBeInTheDocument();
  });

  it("disables the Email source until Gmail is connected", () => {
    render(<SearchPalette onClose={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Email \(connect\)/ })).toBeDisabled();
  });

  it("the search button is disabled with an empty query", () => {
    render(<SearchPalette onClose={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Search/ })).toBeDisabled();
  });

  it("closes on Escape", async () => {
    const onClose = vi.fn();
    render(<SearchPalette onClose={onClose} />);
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });

  it("source toggles flip their pressed state immediately", async () => {
    render(<SearchPalette onClose={vi.fn()} />);
    const memories = screen.getByRole("button", { name: "Memories" });
    expect(memories).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(memories);
    expect(memories).toHaveAttribute("aria-pressed", "false");
  });
});
