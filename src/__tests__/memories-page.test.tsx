import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MemoriesPage from "@/app/app/memories/page";

describe("Memories page", () => {
  it("renders memory cards with category chips and source metadata", () => {
    render(<MemoriesPage />);
    expect(screen.getByText(/Landlord's account/)).toBeInTheDocument();
    expect(screen.getByText(/Wifi password/)).toBeInTheDocument();
  });

  it("search filters by content and tags", async () => {
    render(<MemoriesPage />);
    await userEvent.type(screen.getByLabelText("Search your memories"), "landlord");
    expect(screen.getByText(/GTB 0123456789/)).toBeInTheDocument();
    expect(screen.queryByText(/Wifi password/)).not.toBeInTheDocument();
  });

  it("shows an honest empty state for a query with no matches", async () => {
    render(<MemoriesPage />);
    await userEvent.type(screen.getByLabelText("Search your memories"), "zzzz");
    expect(screen.getByText("I couldn't find that")).toBeInTheDocument();
  });

  it("category pills filter the grid", async () => {
    render(<MemoriesPage />);
    await userEvent.click(screen.getByRole("button", { name: /finance/i }));
    expect(screen.getByText(/Landlord's account/)).toBeInTheDocument();
    expect(screen.queryByText(/Wifi password/)).not.toBeInTheDocument();
  });

  it("permanent deletion requires an explicit confirm step (PRD MEM-06)", async () => {
    render(<MemoriesPage />);
    await userEvent.click(screen.getByText(/Wifi password/));
    const dialog = screen.getByRole("dialog", { name: "Memory detail" });
    expect(dialog).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    // Not deleted yet — confirmation panel is showing
    expect(screen.getByText("Delete this memory permanently?")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Keep it" }));
    // Still present after backing out
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.getByText(/Wifi password/)).toBeInTheDocument();
  });

  it("confirmed deletion removes the memory for good", async () => {
    render(<MemoriesPage />);
    await userEvent.click(screen.getByText(/Wifi password/));
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete permanently" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText(/Wifi password/)).not.toBeInTheDocument();
  });

  it("edit updates the memory content in place", async () => {
    render(<MemoriesPage />);
    await userEvent.click(screen.getByText(/Wifi password/));
    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    const box = screen.getByLabelText("Edit memory content");
    await userEvent.clear(box);
    await userEvent.type(box, "Office wifi: NewPass2026!");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(screen.getAllByText("Office wifi: NewPass2026!").length).toBeGreaterThan(0);
  });

  it("creates a new memory via the modal", async () => {
    render(<MemoriesPage />);
    await userEvent.click(screen.getByRole("button", { name: /New memory/ }));
    await userEvent.type(
      screen.getByLabelText("Memory content"),
      "Tailor: Chinedu, Yaba, 0812 000 1122"
    );
    await userEvent.click(screen.getByRole("button", { name: "Save memory" }));
    expect(screen.getByText(/Tailor: Chinedu/)).toBeInTheDocument();
  });
});
