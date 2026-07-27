import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "@/app/(public)/login/page";
import RegisterPage from "@/app/(public)/register/page";
import ForgotPasswordPage from "@/app/(public)/forgot-password/page";
import LinkPage from "@/app/(public)/link/page";
import { nav } from "@/test/setup";

const WAIT = { timeout: 3000 }; // mock submits resolve in 600–800ms

describe("Login", () => {
  it("validates before submitting", async () => {
    render(<LoginPage />);
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/email and password/);
    expect(nav.push).not.toHaveBeenCalled();
  });

  it("routes to the dashboard on success", async () => {
    render(<LoginPage />);
    await userEvent.type(screen.getByLabelText("Email"), "ada@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "correct-horse");
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/app/today"), WAIT);
  });
});

describe("Register", () => {
  it("shows field-level errors and requires ToS consent", async () => {
    render(<RegisterPage />);
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(screen.getByText("Your name is required.")).toBeInTheDocument();
    expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument();
    expect(screen.getByText(/accept the terms/)).toBeInTheDocument();
    expect(nav.push).not.toHaveBeenCalled();
  });

  it("shows a password strength meter as the user types", async () => {
    render(<RegisterPage />);
    await userEvent.type(screen.getByLabelText("Password"), "abc");
    expect(screen.getByText("Too short")).toBeInTheDocument();
    await userEvent.clear(screen.getByLabelText("Password"));
    await userEvent.type(screen.getByLabelText("Password"), "Str0ng!Passw0rd");
    expect(screen.getByText("Strong")).toBeInTheDocument();
  });

  it("submits a valid form and routes to verification", async () => {
    render(<RegisterPage />);
    await userEvent.type(screen.getByLabelText("Full name"), "Ada Obi");
    await userEvent.type(screen.getByLabelText("Email"), "ada@example.com");
    await userEvent.type(screen.getByLabelText("Phone number"), "8012345678");
    await userEvent.type(screen.getByLabelText("Password"), "Str0ng!Passw0rd");
    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/verify"), WAIT);
  });
});

describe("Forgot password", () => {
  it("never reveals whether an account exists", async () => {
    render(<ForgotPasswordPage />);
    await userEvent.type(screen.getByLabelText("Email"), "whoever@example.com");
    await userEvent.click(screen.getByRole("button", { name: "Send reset link" }));
    expect(
      await screen.findByText(/If an account exists/, undefined, WAIT)
    ).toBeInTheDocument();
  });
});

describe("WhatsApp link landing", () => {
  it("shows the expired state without a token", () => {
    nav.search = "";
    render(<LinkPage />);
    expect(screen.getByText("Link expired")).toBeInTheDocument();
  });

  it("with a token, asks for explicit confirmation then routes to the app", async () => {
    nav.search = "token=abc123";
    render(<LinkPage />);
    expect(screen.getByText("Link your WhatsApp")).toBeInTheDocument();
    expect(screen.getByText(/Only link a number that belongs to you/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Link WhatsApp" }));
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/app/today"), WAIT);
  });
});
