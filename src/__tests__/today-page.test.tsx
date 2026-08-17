import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TodayPage from "@/app/app/today/page";

describe("Today page", () => {
  it("greets the user and shows the date in their timezone", () => {
    render(<TodayPage />);
    expect(screen.getByText(/Good (morning|afternoon|evening), Ada/)).toBeInTheDocument();
    expect(screen.getByText(/Africa\/Lagos/)).toBeInTheDocument();
  });

  it("surfaces the pending confirmation banner and resolves it on approve", async () => {
    render(<TodayPage />);
    expect(await screen.findByText(/1 action needs your approval/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Approve" }));
    await waitFor(() =>
      expect(screen.queryByText(/1 action needs your approval/)).not.toBeInTheDocument()
    );
  });

  it("shows the day summary narrating real data, and the three columns", async () => {
    render(<TodayPage />);
    // The summary strip narrates the fetched collections (the old canned
    // "You have 3 meetings today" line went with the mock mode).
    expect(
      await screen.findByText(/3 meetings on your calendar .* 2 reminders due .* 2 tasks due/)
    ).toBeInTheDocument();
    expect(screen.getByText("Schedule")).toBeInTheDocument();
    expect(screen.getByText("Reminders")).toBeInTheDocument();
    expect(screen.getByText("Tasks due")).toBeInTheDocument();
    expect(screen.getByText("Team standup")).toBeInTheDocument();
  });

  it("completing a reminder removes it; empty state appears when all are done", async () => {
    render(<TodayPage />);
    // complete every scheduled reminder shown
    for (const btn of await screen.findAllByRole("button", { name: /Done/ })) {
      await userEvent.click(btn);
    }
    expect(await screen.findByText(/All caught up/)).toBeInTheDocument();
  });

  it("completing a task removes it from Tasks due", async () => {
    render(<TodayPage />);
    await userEvent.click(await screen.findByLabelText("Complete Send proposal to Kemi"));
    await waitFor(() =>
      expect(screen.queryByText("Send proposal to Kemi")).not.toBeInTheDocument()
    );
  });

  it("cross-links each column to its module", () => {
    render(<TodayPage />);
    expect(screen.getByRole("link", { name: "Open calendar" })).toHaveAttribute(
      "href",
      "/app/calendar"
    );
    expect(screen.getAllByRole("link", { name: "View all" })[0]).toHaveAttribute(
      "href",
      "/app/reminders"
    );
  });
});
