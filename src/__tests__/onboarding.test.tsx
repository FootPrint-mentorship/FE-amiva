import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OnboardingPage from "@/app/(onboarding)/onboarding/page";
import { nav } from "@/test/setup";

describe("Onboarding wizard (PRD §15.1)", () => {
  it("walks all five steps; Google connects are skippable", async () => {
    render(<OnboardingPage />);

    // 1 · Welcome
    expect(screen.getByText(/Meet Amiva/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /set you up/ }));

    // 2 · Preferences
    expect(screen.getByText("Your preferences")).toBeInTheDocument();
    expect(screen.getByLabelText("What should Amiva call you?")).toHaveValue("Ada");
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));

    // 3 · Calendar (skippable)
    expect(screen.getByRole("heading", { name: "Connect Google Calendar" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Skip for now" }));

    // 4 · Gmail (optional + skippable)
    expect(screen.getByRole("heading", { name: /Connect Gmail/ })).toBeInTheDocument();
    expect(screen.getByText(/never sends an email without your approval/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Skip for now" }));

    // 5 · First action
    expect(screen.getByText("Try your first request")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(screen.getByText(/I'll remind you/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Go to my dashboard" }));
    expect(nav.push).toHaveBeenCalledWith("/app/today");
  });

  it("connecting Google Calendar shows the connected state before continuing", async () => {
    render(<OnboardingPage />);
    await userEvent.click(screen.getByRole("button", { name: /set you up/ }));
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    await userEvent.click(screen.getByRole("button", { name: "Connect Google Calendar" }));
    expect(screen.getByText("Google Calendar connected")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Continue/ })).toBeInTheDocument();
  });

  it("the first-action reply uses the preferred name from step 2", async () => {
    render(<OnboardingPage />);
    await userEvent.click(screen.getByRole("button", { name: /set you up/ }));
    const name = screen.getByLabelText("What should Amiva call you?");
    await userEvent.clear(name);
    await userEvent.type(name, "Grace");
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    await userEvent.click(screen.getByRole("button", { name: "Skip for now" }));
    await userEvent.click(screen.getByRole("button", { name: "Skip for now" }));
    await userEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(screen.getByText(/Done, Grace/)).toBeInTheDocument();
  });
});
