import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OnboardingPage from "@/app/(onboarding)/onboarding/page";
import { settingsStore } from "@/lib/stores";
import { nav } from "@/test/setup";

describe("Onboarding wizard", () => {
  it("walks all five steps; phone verify and Google Calendar connect are skippable", async () => {
    // A fresh signup arrives with an unverified phone
    settingsStore.set((c) => ({ ...c, phoneVerified: false }));
    render(<OnboardingPage />);

    // 1 · Welcome
    expect(screen.getByText(/Meet Amiva/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /set you up/ }));

    // 2 · Preferences
    expect(screen.getByText("Your preferences")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));

    // 3 · Verify phone (skippable; OTP goes only to the chosen medium)
    expect(screen.getByRole("heading", { name: "Verify your phone" })).toBeInTheDocument();
    expect(screen.getByText(/nothing is sent to\s+this number/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Skip for now" }));

    // 4 · Calendar (skippable)
    expect(screen.getByRole("heading", { name: "Connect Google Calendar" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Skip for now" }));

    // 5 · First action
    expect(screen.getByText("Try your first request")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(screen.getByText(/I'll remind you/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Go to my dashboard" }));
    expect(nav.push).toHaveBeenCalledWith("/app/today");
  });

  it("the whole onboarding can be skipped in one click", async () => {
    render(<OnboardingPage />);
    await userEvent.click(screen.getByRole("button", { name: /Skip onboarding/ }));
    expect(nav.push).toHaveBeenCalledWith("/app/today");
  });

  it("verifying the phone marks it verified and moves on", async () => {
    settingsStore.set((c) => ({ ...c, phoneVerified: false }));
    render(<OnboardingPage />);
    await userEvent.click(screen.getByRole("button", { name: /set you up/ }));
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    await userEvent.click(screen.getByRole("button", { name: "Send code to WhatsApp" }));
    const first = screen.getByLabelText("Phone code digit 1");
    await userEvent.click(first);
    await userEvent.paste("482913");
    expect(settingsStore.get().phoneVerified).toBe(true);
    // auto-advanced to the Calendar step
    expect(screen.getByRole("heading", { name: "Connect Google Calendar" })).toBeInTheDocument();
  });

  it("has a back button and clickable completed dots", async () => {
    render(<OnboardingPage />);
    await userEvent.click(screen.getByRole("button", { name: /set you up/ }));
    expect(screen.getByText("Your preferences")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "← Back" }));
    expect(screen.getByText(/Meet Amiva/)).toBeInTheDocument();
    // forward again, then jump back via the first dot
    await userEvent.click(screen.getByRole("button", { name: /set you up/ }));
    await userEvent.click(screen.getByRole("button", { name: /Go to step 1/ }));
    expect(screen.getByText(/Meet Amiva/)).toBeInTheDocument();
  });

  it("an already-verified phone shows the verified state instead of an OTP", async () => {
    render(<OnboardingPage />); // seed has phoneVerified: true
    await userEvent.click(screen.getByRole("button", { name: /set you up/ }));
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("Phone already verified")).toBeInTheDocument();
  });
});
