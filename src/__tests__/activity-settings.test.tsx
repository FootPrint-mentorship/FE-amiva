import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SettingsPage from "@/app/app/settings/page";
import { settingsStore } from "@/lib/stores";

async function openTab(name: string) {
  render(<SettingsPage />);
  await userEvent.click(screen.getByRole("button", { name }));
}

describe("Settings page", () => {
  it("switches between tabs, including the relocated Activity tab", async () => {
    render(<SettingsPage />);
    expect(screen.getByLabelText("Full name")).toBeInTheDocument(); // Profile default
    await userEvent.click(screen.getByRole("button", { name: "Integrations" }));
    expect(screen.getByText("Google Calendar")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Privacy" }));
    expect(screen.getByText("Danger zone")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Activity" }));
    expect(screen.getByText(/Everything Amiva has done/)).toBeInTheDocument();
  });

  it("has no Amiva tone setting any more", () => {
    render(<SettingsPage />);
    expect(screen.queryByText(/Amiva's tone/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Warm" })).not.toBeInTheDocument();
  });

  it("feature toggles switch modules off and on", async () => {
    await openTab("Features");
    const memToggle = screen.getByRole("switch", { name: "Memories feature" });
    expect(memToggle).toHaveAttribute("aria-checked", "true");
    await userEvent.click(memToggle);
    expect(settingsStore.get().features.memories).toBe(false);
    await userEvent.click(memToggle);
    expect(settingsStore.get().features.memories).toBe(true);
  });

  it("notification matrix toggles cells; Push stays disabled", async () => {
    await openTab("Notifications");
    const cell = screen.getByLabelText("Tasks via Email: off");
    await userEvent.click(cell);
    expect(screen.getByLabelText("Tasks via Email: on")).toBeInTheDocument();
    expect(screen.getByLabelText(/Reminders via Push/)).toBeDisabled();
  });

  it("unverified channels are disabled in the matrix until verified (no sends to unverified media)", async () => {
    settingsStore.set((c) => ({ ...c, phoneVerified: false }));
    await openTab("Notifications");
    const cell = screen.getByLabelText(/Reminders via WhatsApp/);
    expect(cell).toBeDisabled();
    expect(cell).toHaveAttribute("title", expect.stringMatching(/Verify your phone/));
  });

  it("an unverified phone can be verified from Profile via OTP", async () => {
    settingsStore.set((c) => ({ ...c, phoneVerified: false }));
    render(<SettingsPage />);
    expect(screen.getByText(/WhatsApp delivery is paused/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Verify now" }));
    const first = screen.getByLabelText("Phone code digit 1");
    await userEvent.click(first);
    await userEvent.paste("123456");
    expect(settingsStore.get().phoneVerified).toBe(true);
  });

  it("integrations show connected status and confirm before disconnecting", async () => {
    await openTab("Integrations");
    expect(screen.getAllByText("Connected").length).toBe(2); // WhatsApp + Calendar
    await userEvent.click(screen.getAllByRole("button", { name: "Disconnect" })[0]);
    expect(screen.getByText(/Calendar features stop working/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Keep it connected" }));
    expect(settingsStore.get().integrations.calendar).toBe(true);
  });
});

describe("Activity log (inside Settings)", () => {
  it("lists actions with risk chips and expandable approval details", async () => {
    await openTab("Activity");
    expect(screen.getByText(/Permanently deleted 1 memory/)).toBeInTheDocument();
    await userEvent.click(screen.getByText(/Permanently deleted 1 memory/));
    expect(screen.getByText(/Confirmed by you via web/)).toBeInTheDocument();
  });

  it("filters by risk through the custom dropdown", async () => {
    await openTab("Activity");
    await userEvent.click(screen.getByRole("combobox", { name: "Risk filter" }));
    const listbox = screen.getByRole("listbox", { name: "Risk filter" });
    await userEvent.click(within(listbox).getByRole("option", { name: "High" }));
    expect(screen.getByText(/Permanently deleted 1 memory/)).toBeInTheDocument();
    expect(screen.queryByText(/Pay NEPA bill/)).not.toBeInTheDocument();
  });

  it("failed actions state that no change was made", async () => {
    await openTab("Activity");
    await userEvent.click(screen.getByText(/Client dinner with Kemi/));
    expect(screen.getByText(/no change was made/)).toBeInTheDocument();
  });
});
