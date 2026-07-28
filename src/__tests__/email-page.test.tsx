import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EmailPage from "@/app/app/email/page";

const FIND_TIMEOUT = { timeout: 3000 }; // draft generation mocks ~900ms latency

async function connectAndOpenKemiThread() {
  render(<EmailPage />);
  await userEvent.click(screen.getByRole("button", { name: "Connect Gmail" }));
  await userEvent.click(screen.getByText("Contract renewal: action needed"));
}

describe("Email page", () => {
  it("gates everything behind the Gmail connect state with scope promises", () => {
    render(<EmailPage />);
    expect(screen.getByRole("heading", { name: "Connect Gmail" })).toBeInTheDocument();
    expect(screen.getByText(/Nothing is ever sent without your approval/)).toBeInTheDocument();
    expect(screen.queryByText("Contract renewal: action needed")).not.toBeInTheDocument();
  });

  it("after connecting, shows the AI overview and thread summaries with importance reasons", async () => {
    render(<EmailPage />);
    await userEvent.click(screen.getByRole("button", { name: "Connect Gmail" }));
    expect(screen.getByText(/4 threads worth your attention/)).toBeInTheDocument();
    expect(screen.getByText("Contract renewal: action needed")).toBeInTheDocument();
    expect(screen.getAllByText("Important").length).toBe(2); // two high-importance threads
    expect(screen.getAllByLabelText("Open in Gmail").length).toBe(4); // originals always linked
  });

  it("thread view surfaces the summary, why-it-matters, and proposed (not auto-created) actions", async () => {
    await connectAndOpenKemiThread();
    expect(screen.getByText(/Kemi needs the signed renewal by Friday/)).toBeInTheDocument();
    expect(screen.getByText(/Why it matters:/)).toBeInTheDocument();
    expect(screen.getByText(/Amiva proposes, you decide/)).toBeInTheDocument();
  });

  it("drafts a reply that is clearly labelled and editable — and NEVER sends without the explicit confirm (PRD EML-04)", async () => {
    await connectAndOpenKemiThread();
    await userEvent.type(
      screen.getByLabelText("Draft instruction"),
      "Agree, but legal reviews clause 4 first"
    );
    await userEvent.click(screen.getByRole("button", { name: /Draft/ }));

    const body = await screen.findByLabelText("Draft body", undefined, FIND_TIMEOUT);
    expect(body).toHaveTextContent(/Agree, but legal reviews clause 4 first/);
    expect(screen.getByText("Not sent yet")).toBeInTheDocument();

    // Step 1: Approve & send does NOT send — it opens the confirmation
    await userEvent.click(screen.getByRole("button", { name: /Approve & send/ }));
    expect(screen.getByText(/Send this reply to/)).toBeInTheDocument();
    expect(screen.queryByText(/Reply sent/)).not.toBeInTheDocument();

    // Backing out keeps the draft unsent
    await userEvent.click(screen.getByRole("button", { name: "Not yet" }));
    expect(screen.queryByText(/Reply sent/)).not.toBeInTheDocument();
    expect(screen.getByText("Not sent yet")).toBeInTheDocument();

    // Step 2: only the explicit confirmation sends
    await userEvent.click(screen.getByRole("button", { name: /Approve & send/ }));
    await userEvent.click(screen.getByRole("button", { name: "Yes, send it" }));
    expect(screen.getByText(/Reply sent/)).toBeInTheDocument();
    expect(screen.getByText(/Logged in your/)).toBeInTheDocument(); // audit trail note
  });

  it("discarding a draft removes it without sending", async () => {
    await connectAndOpenKemiThread();
    await userEvent.type(screen.getByLabelText("Draft instruction"), "ok");
    await userEvent.click(screen.getByRole("button", { name: /Draft/ }));
    await screen.findByLabelText("Draft body", undefined, FIND_TIMEOUT);
    await userEvent.click(screen.getByRole("button", { name: "Discard" }));
    expect(screen.queryByLabelText("Draft body")).not.toBeInTheDocument();
    expect(screen.queryByText(/Reply sent/)).not.toBeInTheDocument();
  });
});
