import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ActivityPage from "@/app/app/activity/page";
import SettingsPage from "@/app/app/settings/page";

describe("Activity page (audit trail — PRD trust feature)", () => {
  it("lists actions with risk chips and results", () => {
    render(<ActivityPage />);
    expect(screen.getByText(/Sent reply to kemi@client.com/)).toBeInTheDocument();
    expect(screen.getAllByText("high").length).toBe(3); // 2 risk chips + the filter option
    expect(screen.getAllByLabelText("Succeeded").length).toBe(5);
    expect(screen.getByLabelText("Failed")).toBeInTheDocument();
  });

  it("filters by risk", async () => {
    render(<ActivityPage />);
    await userEvent.selectOptions(screen.getByLabelText(/Risk/), "high");
    expect(screen.getByText(/Sent reply to kemi@client.com/)).toBeInTheDocument();
    expect(screen.getByText(/Permanently deleted 1 memory/)).toBeInTheDocument();
    expect(screen.queryByText(/Pay NEPA bill/)).not.toBeInTheDocument();
  });

  it("filters by module and shows an empty state when nothing matches", async () => {
    render(<ActivityPage />);
    await userEvent.selectOptions(screen.getByLabelText(/Module/), "tasks");
    expect(screen.getByText(/No activity matches these filters/)).toBeInTheDocument();
  });

  it("expanding a high-risk entry reveals who approved it", async () => {
    render(<ActivityPage />);
    await userEvent.click(screen.getByText(/Sent reply to kemi@client.com/));
    expect(screen.getByText(/Approved by you via web/)).toBeInTheDocument();
  });

  it("failed actions state that no change was made (PRD: no claimed success)", async () => {
    render(<ActivityPage />);
    await userEvent.click(screen.getByText(/Client dinner with Kemi/));
    expect(screen.getByText(/no change was made/)).toBeInTheDocument();
  });
});

describe("Settings page", () => {
  it("switches between tabs", async () => {
    render(<SettingsPage />);
    expect(screen.getByLabelText("Full name")).toBeInTheDocument(); // Profile default
    await userEvent.click(screen.getByRole("button", { name: "Integrations" }));
    expect(screen.getByText("Google Calendar")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Privacy" }));
    expect(screen.getByText("Danger zone")).toBeInTheDocument();
  });

  it("notification matrix toggles cells; Push stays disabled until the mobile app ships", async () => {
    render(<SettingsPage />);
    await userEvent.click(screen.getByRole("button", { name: "Notifications" }));
    const cell = screen.getByLabelText("Tasks via Email: off");
    await userEvent.click(cell);
    expect(screen.getByLabelText("Tasks via Email: on")).toBeInTheDocument();
    expect(screen.getByLabelText(/Reminders via Push/)).toBeDisabled();
  });

  it("quiet hours switch flips its checked state", async () => {
    render(<SettingsPage />);
    await userEvent.click(screen.getByRole("button", { name: "Notifications" }));
    const toggle = screen.getByRole("switch");
    expect(toggle).toHaveAttribute("aria-checked", "true");
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "false");
  });

  it("integrations show connected status and the right call to action", async () => {
    render(<SettingsPage />);
    await userEvent.click(screen.getByRole("button", { name: "Integrations" }));
    expect(screen.getAllByText("Connected").length).toBe(2); // WhatsApp + Calendar
    expect(screen.getByRole("button", { name: "Connect" })).toBeInTheDocument(); // Gmail
    expect(screen.getByText(/revokes Amiva's access immediately/)).toBeInTheDocument();
  });
});
