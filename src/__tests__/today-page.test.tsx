import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
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
    expect(screen.getByText(/1 action needs your approval/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Approve" }));
    expect(screen.queryByText(/1 action needs your approval/)).not.toBeInTheDocument();
  });

  it("shows the AI day summary and the three columns", () => {
    render(<TodayPage />);
    expect(screen.getByText(/You have 3 meetings today/)).toBeInTheDocument();
    expect(screen.getByText("Schedule")).toBeInTheDocument();
    expect(screen.getByText("Reminders")).toBeInTheDocument();
    expect(screen.getByText("Tasks due")).toBeInTheDocument();
    expect(screen.getByText("Team standup")).toBeInTheDocument();
  });

  it("completing a reminder removes it; empty state appears when all are done", async () => {
    render(<TodayPage />);
    // complete every scheduled reminder shown
    for (const btn of screen.getAllByRole("button", { name: /Done/ })) {
      await userEvent.click(btn);
    }
    expect(screen.getByText(/All caught up/)).toBeInTheDocument();
  });

  it("completing a task removes it from Tasks due", async () => {
    render(<TodayPage />);
    await userEvent.click(screen.getByLabelText("Complete Send proposal to Kemi"));
    expect(screen.queryByText("Send proposal to Kemi")).not.toBeInTheDocument();
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
