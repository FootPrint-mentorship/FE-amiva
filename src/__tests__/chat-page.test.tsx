import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChatPage from "@/app/app/chat/page";

const FIND_TIMEOUT = { timeout: 3000 }; // mock assistant replies after ~900ms

describe("Chat page", () => {
  it("renders the seed conversation with an embedded resource card and confirmation", () => {
    render(<ChatPage />);
    expect(screen.getByText("Remind me to pay rent on Friday morning")).toBeInTheDocument();
    expect(screen.getByText("Pay rent")).toBeInTheDocument(); // resource card
    expect(screen.getByText("Needs your approval")).toBeInTheDocument(); // confirmation card
    expect(screen.getByRole("button", { name: "Approve" })).toBeInTheDocument();
  });

  it("sends a message and receives an honest mock reply", async () => {
    render(<ChatPage />);
    const composer = screen.getByLabelText("Message Amiva");
    await userEvent.type(composer, "What's my day like?{Enter}");
    expect(screen.getAllByText("What's my day like?").length).toBeGreaterThan(0);
    expect(composer).toHaveValue("");
    expect(
      await screen.findByText(/mock data/, undefined, FIND_TIMEOUT)
    ).toBeInTheDocument();
  });

  it("send button is disabled with an empty composer", () => {
    render(<ChatPage />);
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  });

  it("the thread is a live region so replies are announced to screen readers", () => {
    render(<ChatPage />);
    expect(screen.getByLabelText("Conversation with Amiva")).toHaveAttribute(
      "aria-live",
      "polite"
    );
  });
});
