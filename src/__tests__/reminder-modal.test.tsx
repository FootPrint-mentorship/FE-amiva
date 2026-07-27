import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReminderModal } from "@/components/domain/reminder-modal";
import type { Reminder } from "@/lib/mock";

const isoDate = (offsetDays: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
};

function renderCreate() {
  const onCreate = vi.fn();
  const onClose = vi.fn();
  render(<ReminderModal onClose={onClose} onCreate={onCreate} />);
  return { onCreate, onClose };
}

const lastFridayReminder: Reminder = {
  id: "rem_test",
  title: "Pay NEPA bill",
  notes: null,
  due_at: new Date(Date.now() + 86400000).toISOString(),
  timezone: "Africa/Lagos",
  rrule: "FREQ=MONTHLY;BYDAY=-1FR",
  recurrence_human: "Every last Friday of the month",
  channels: ["whatsapp"],
  status: "scheduled",
  snoozed_until: null,
  next_fire_at: null,
  source: "whatsapp",
};

describe("ReminderModal — create", () => {
  it("requires a title", async () => {
    const { onCreate } = renderCreate();
    await userEvent.click(screen.getByRole("button", { name: "Create reminder" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Give the reminder a title.");
    expect(onCreate).not.toHaveBeenCalled();
  });

  it("rejects one-time reminders in the past (PRD: never schedule silently wrong times)", async () => {
    const { onCreate } = renderCreate();
    await userEvent.type(screen.getByLabelText("Remind me to…"), "Old thing");
    fireEvent.change(screen.getByLabelText("Date"), {
      target: { value: isoDate(-1) },
    });
    await userEvent.click(screen.getByRole("button", { name: "Create reminder" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/in the past/);
    expect(onCreate).not.toHaveBeenCalled();
  });

  it("requires at least one delivery channel", async () => {
    const { onCreate } = renderCreate();
    await userEvent.type(screen.getByLabelText("Remind me to…"), "Call Ada");
    await userEvent.click(screen.getByRole("button", { name: "WhatsApp" })); // deselect default
    await userEvent.click(screen.getByRole("button", { name: "Create reminder" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/delivery channel/);
    expect(onCreate).not.toHaveBeenCalled();
  });

  it("builds a weekly RRULE from the weekday chips", async () => {
    const { onCreate } = renderCreate();
    await userEvent.type(screen.getByLabelText("Remind me to…"), "Standup prep");
    await userEvent.click(screen.getByRole("button", { name: "Weekly" }));
    // default MO selected; add Friday (second "F" chip is index 4 — labels M T W T F S S)
    const dayChips = screen.getAllByRole("button", { name: /^[MTWFS]$/ });
    await userEvent.click(dayChips[4]); // F (Friday)
    await userEvent.click(screen.getByRole("button", { name: "Create reminder" }));
    expect(onCreate).toHaveBeenCalledOnce();
    const created: Reminder = onCreate.mock.calls[0][0];
    expect(created.rrule).toBe("FREQ=WEEKLY;BYDAY=MO,FR");
    expect(created.recurrence_human).toBe("Every Mon, Fri");
    expect(created.id).toMatch(/^rem_/);
    expect(created.source).toBe("web");
  });

  it("weekly recurrence requires at least one weekday", async () => {
    const { onCreate } = renderCreate();
    await userEvent.type(screen.getByLabelText("Remind me to…"), "Gym");
    await userEvent.click(screen.getByRole("button", { name: "Weekly" }));
    const dayChips = screen.getAllByRole("button", { name: /^[MTWFS]$/ });
    await userEvent.click(dayChips[0]); // deselect default MO
    await userEvent.click(screen.getByRole("button", { name: "Create reminder" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/at least one weekday/);
    expect(onCreate).not.toHaveBeenCalled();
  });
});

describe("ReminderModal — edit", () => {
  it("prefills every field from the initial reminder", () => {
    render(
      <ReminderModal onClose={vi.fn()} onCreate={vi.fn()} initial={lastFridayReminder} />
    );
    expect(screen.getByRole("dialog", { name: "Edit reminder" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Pay NEPA bill")).toBeInTheDocument();
    // "-1FR" monthly rule maps to the Monthly bucket in the builder UI
    expect(screen.getByRole("button", { name: "Monthly" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByRole("button", { name: "WhatsApp" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
  });

  it("preserves an untouched RRULE verbatim — the builder cannot express 'last Friday'", async () => {
    const onCreate = vi.fn();
    render(
      <ReminderModal onClose={vi.fn()} onCreate={onCreate} initial={lastFridayReminder} />
    );
    const title = screen.getByLabelText("Remind me to…");
    await userEvent.clear(title);
    await userEvent.type(title, "Pay NEPA bill (updated)");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    const saved: Reminder = onCreate.mock.calls[0][0];
    expect(saved.id).toBe("rem_test"); // same id → update, not create
    expect(saved.title).toBe("Pay NEPA bill (updated)");
    expect(saved.rrule).toBe("FREQ=MONTHLY;BYDAY=-1FR");
    expect(saved.recurrence_human).toBe("Every last Friday of the month");
  });

  it("rebuilds the RRULE when the user changes recurrence", async () => {
    const onCreate = vi.fn();
    render(
      <ReminderModal onClose={vi.fn()} onCreate={onCreate} initial={lastFridayReminder} />
    );
    await userEvent.click(screen.getByRole("button", { name: "Daily" }));
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    const saved: Reminder = onCreate.mock.calls[0][0];
    expect(saved.rrule).toBe("FREQ=DAILY");
    expect(saved.recurrence_human).toBe("Every day");
  });
});
