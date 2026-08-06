import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RemindersPage from "@/app/app/reminders/page";

describe("Reminders page", () => {
  it("shows scheduled reminders under Upcoming, grouped by day, with timezone visible", () => {
    render(<RemindersPage />);
    expect(screen.getByText("Pay NEPA bill")).toBeInTheDocument();
    expect(screen.getByText("Call Mum")).toBeInTheDocument();
    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.getByText("Tomorrow")).toBeInTheDocument();
    expect(screen.getAllByText("WAT").length).toBeGreaterThan(0); // PRD: tz always shown
    // Completed seed item is not in Upcoming
    expect(screen.queryByText("Standup prep")).not.toBeInTheDocument();
  });

  it("tabs filter by status", async () => {
    render(<RemindersPage />);
    await userEvent.click(screen.getByRole("tab", { name: "Snoozed" }));
    expect(screen.getByText("Renew passport")).toBeInTheDocument();
    expect(screen.queryByText("Pay NEPA bill")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("tab", { name: "Completed" }));
    expect(screen.getByText("Standup prep")).toBeInTheDocument();
  });

  it("completing a reminder moves it to Completed", async () => {
    render(<RemindersPage />);
    const card = screen.getByText("Call Mum").closest("div.rounded-2xl")!;
    await userEvent.click(within(card as HTMLElement).getByRole("button", { name: /Done/ }));
    expect(screen.queryByText("Call Mum")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("tab", { name: "Completed" }));
    expect(screen.getByText("Call Mum")).toBeInTheDocument();
  });

  it("the overflow menu edits a reminder with fields prefilled", async () => {
    render(<RemindersPage />);
    await userEvent.click(screen.getAllByRole("button", { name: "More options" })[0]);
    await userEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
    expect(screen.getByRole("dialog", { name: "Edit reminder" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Pay NEPA bill")).toBeInTheDocument();
    // Save without touching recurrence → the "last Friday" label survives
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(screen.getByText("Every last Friday of the month")).toBeInTheDocument();
  });

  it("pause keeps the reminder visible with a Paused chip; delete removes it", async () => {
    render(<RemindersPage />);
    await userEvent.click(screen.getAllByRole("button", { name: "More options" })[0]);
    await userEvent.click(screen.getByRole("menuitem", { name: "Pause" }));
    expect(screen.getByText("Paused")).toBeInTheDocument();
    expect(screen.getByText("Pay NEPA bill")).toBeInTheDocument();

    await userEvent.click(screen.getAllByRole("button", { name: "More options" })[0]);
    await userEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    expect(screen.queryByText("Pay NEPA bill")).not.toBeInTheDocument();
  });

  it("creates a new reminder through the modal", async () => {
    render(<RemindersPage />);
    await userEvent.click(screen.getByRole("button", { name: /New reminder/ }));
    await userEvent.type(screen.getByLabelText("Remind me to…"), "Water the plants");
    // pick a safely-future time
    const timeInput = screen.getByLabelText(/Time/);
    await userEvent.clear(timeInput);
    await userEvent.type(timeInput, "23:59");
    await userEvent.click(screen.getByRole("button", { name: "Create reminder" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Water the plants")).toBeInTheDocument();
  });
});
