import { describe, it, expect } from "vitest";
import { Suspense, act } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ListsPage from "@/app/app/lists/page";
import ListDetailPage from "@/app/app/lists/[id]/page";

// The page unwraps its params promise with React 19's use(), which suspends the
// first render — the render must happen inside an awaited act() to settle.
async function renderDetail(id: string) {
  await act(async () => {
    render(
      <Suspense fallback={<p>loading…</p>}>
        <ListDetailPage params={Promise.resolve({ id })} />
      </Suspense>
    );
  });
}

describe("Lists index", () => {
  it("shows active lists with progress counts and a separate Templates section", () => {
    render(<ListsPage />);
    expect(screen.getByText("Weekly shopping")).toBeInTheDocument();
    expect(screen.getByText(/2\/5 done/)).toBeInTheDocument();
    expect(screen.getByText("Templates")).toBeInTheDocument();
    expect(screen.getByText("Travel checklist")).toBeInTheDocument();
  });

  it("list cards link to their detail route", () => {
    render(<ListsPage />);
    const link = screen.getByText("Weekly shopping").closest("a");
    expect(link).toHaveAttribute("href", "/app/lists/lst_01");
  });
});

describe("List detail", () => {
  it("renders open items and a collapsible Done section", async () => {
    await renderDetail("lst_01");
    expect(await screen.findByText("Titus fish")).toBeInTheDocument();
    expect(screen.getByText("Done (2)")).toBeInTheDocument();
    expect(screen.getByText("Rice 5kg")).toBeInTheDocument(); // completed, shown in Done
  });

  it("adds an item via the input", async () => {
    await renderDetail("lst_01");
    const input = await screen.findByLabelText("Add an item");
    await userEvent.type(input, "Maggi cubes{Enter}");
    expect(screen.getByText("Maggi cubes")).toBeInTheDocument();
    expect(input).toHaveValue("");
  });

  it("checking an item moves it into Done and updates the count", async () => {
    await renderDetail("lst_01");
    const item = await screen.findByText("Titus fish");
    const row = item.closest("label")!;
    await userEvent.click(row.querySelector("input[type=checkbox]")!);
    expect(screen.getByText("Done (3)")).toBeInTheDocument();
    expect(screen.getByText(/3\/5 done/)).toBeInTheDocument();
  });

  it("unknown list id shows a not-found state, not a crash", async () => {
    await renderDetail("lst_nope");
    expect(await screen.findByText("List not found")).toBeInTheDocument();
    expect(screen.getByText("← Back to lists")).toBeInTheDocument();
  });
});
