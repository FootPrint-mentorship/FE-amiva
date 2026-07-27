import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CalendarPage from "@/app/app/calendar/page";

async function openAgenda() {
  render(<CalendarPage />);
  await userEvent.click(screen.getByRole("tab", { name: "Agenda" }));
}

describe("Calendar page", () => {
  it("always displays the timezone (PRD: zero silent tz conversions)", () => {
    render(<CalendarPage />);
    expect(screen.getByText(/all times in Africa\/Lagos \(WAT\)/)).toBeInTheDocument();
  });

  it("agenda view lists upcoming events grouped by day", async () => {
    await openAgenda();
    expect(screen.getByText("Investor sync — Tunde")).toBeInTheDocument();
    expect(screen.getByText("Flight to Nairobi — KQ533")).toBeInTheDocument();
    expect(screen.getByText("Tentative")).toBeInTheDocument(); // client dinner status
  });

  it("event modal shows details; cancelling warns about attendees before acting", async () => {
    await openAgenda();
    await userEvent.click(screen.getByText("Investor sync — Tunde"));
    const dialog = screen.getByRole("dialog", { name: "Investor sync — Tunde" });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText("Join Google Meet")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Cancel event" }));
    // Not cancelled yet — explicit warning first (high-risk action)
    expect(screen.getByText(/Attendees will be notified/)).toBeInTheDocument();
    expect(screen.getAllByText("Investor sync — Tunde").length).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole("button", { name: "Yes, cancel event" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("Investor sync — Tunde")).not.toBeInTheDocument();
  });

  it("backing out of a cancellation keeps the event", async () => {
    await openAgenda();
    await userEvent.click(screen.getByText("Investor sync — Tunde"));
    await userEvent.click(screen.getByRole("button", { name: "Cancel event" }));
    await userEvent.click(screen.getByRole("button", { name: "Keep it" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument(); // modal still open, event intact
  });

  it("new event requires a title and end after start", async () => {
    render(<CalendarPage />);
    await userEvent.click(screen.getByRole("button", { name: /New event/ }));
    await userEvent.click(screen.getByRole("button", { name: "Create event" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Give the event a title.");

    await userEvent.type(screen.getByLabelText("Title"), "Focus block");
    fireEvent.change(screen.getByLabelText("Start"), { target: { value: "11:00" } });
    fireEvent.change(screen.getByLabelText("End"), { target: { value: "10:00" } });
    await userEvent.click(screen.getByRole("button", { name: "Create event" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/End time must be after start/);
  });

  it("warns about conflicts once, then books on explicit re-confirm", async () => {
    render(<CalendarPage />);
    await userEvent.click(screen.getByRole("button", { name: /New event/ }));
    await userEvent.type(screen.getByLabelText("Title"), "Clash test");
    // 13:00–13:30 today overlaps "Investor sync — Tunde"
    fireEvent.change(screen.getByLabelText("Start"), { target: { value: "13:00" } });
    fireEvent.change(screen.getByLabelText("End"), { target: { value: "13:30" } });
    await userEvent.click(screen.getByRole("button", { name: "Create event" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/overlaps “Investor sync — Tunde”/);
    // Modal still open — nothing created yet
    expect(screen.getByRole("dialog", { name: /New event/ })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Create event" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("tab", { name: "Agenda" }));
    expect(screen.getByText("Clash test")).toBeInTheDocument();
  });

  it("editing an event prefills the form and updates in place", async () => {
    await openAgenda();
    await userEvent.click(screen.getByText("Investor sync — Tunde"));
    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByRole("dialog", { name: /Edit event/ })).toBeInTheDocument();
    const title = screen.getByLabelText("Title");
    expect(title).toHaveValue("Investor sync — Tunde");
    expect(screen.getByLabelText(/Attendees/)).toHaveValue("tunde@vc.com");

    await userEvent.clear(title);
    await userEvent.type(title, "Investor sync — rescheduled");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(screen.getByText("Investor sync — rescheduled")).toBeInTheDocument();
    // updated, not duplicated
    expect(screen.queryByText("Investor sync — Tunde")).not.toBeInTheDocument();
  });
});
