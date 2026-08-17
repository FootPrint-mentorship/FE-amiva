import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "@/app/(public)/login/page";
import RegisterPage from "@/app/(public)/register/page";
import ForgotPasswordPage from "@/app/(public)/forgot-password/page";
import LinkPage from "@/app/(public)/link/page";
import CompleteProfilePage from "@/app/(public)/complete-profile/page";
import { Toaster } from "@/components/ui/toast";
import { nav } from "@/test/setup";

const WAIT = { timeout: 3000 }; // mock submits resolve in 600–800ms

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
});

async function verifyEmailInline() {
  await userEvent.click(screen.getByRole("button", { name: "Send code" }));
  const first = await screen.findByLabelText("Email code digit 1", undefined, WAIT);
  await userEvent.click(first);
  await userEvent.paste("482913");
  expect(await screen.findByText("Email verified")).toBeInTheDocument();
}

describe("Login", () => {
  it("validates before submitting", async () => {
    render(<LoginPage />);
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/email or phone number/i);
    expect(nav.push).not.toHaveBeenCalled();
  });

  it("accepts an email identifier", async () => {
    render(<LoginPage />);
    await userEvent.type(screen.getByLabelText("Email or phone number"), "ada@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "correct-horse");
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/app/today"), WAIT);
  });

  it("accepts a phone identifier", async () => {
    render(<LoginPage />);
    await userEvent.type(screen.getByLabelText("Email or phone number"), "+234 801 234 5678");
    await userEvent.type(screen.getByLabelText("Password"), "correct-horse");
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/app/today"), WAIT);
  });

  it("Google sign-in surfaces an honest error when OAuth isn't configured (no fake sign-in)", async () => {
    // Real mode hands the browser to Google; without NEXT_PUBLIC_GOOGLE_CLIENT_ID
    // it must refuse honestly instead of pretending to sign in.
    render(
      <>
        <LoginPage />
        <Toaster />
      </>
    );
    await userEvent.click(screen.getByRole("button", { name: /Sign in with Google/ }));
    expect(
      await screen.findByText(/Google sign-in isn't configured/)
    ).toBeInTheDocument();
    expect(nav.push).not.toHaveBeenCalled();
  });

  it("password field has a working show/hide toggle", async () => {
    render(<LoginPage />);
    const pw = screen.getByLabelText("Password");
    expect(pw).toHaveAttribute("type", "password");
    await userEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(pw).toHaveAttribute("type", "text");
    await userEvent.click(screen.getByRole("button", { name: "Hide password" }));
    expect(pw).toHaveAttribute("type", "password");
  });
});

describe("Register", () => {
  it("shows field-level errors, requires consent and a verified email", async () => {
    render(<RegisterPage />);
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(screen.getByText("Your name is required.")).toBeInTheDocument();
    expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument();
    expect(screen.getByText(/accept the terms/)).toBeInTheDocument();
    expect(nav.push).not.toHaveBeenCalled();
  });

  it("email must be verified inline before the account is created", async () => {
    render(<RegisterPage />);
    await userEvent.type(screen.getByLabelText("Full name"), "Ada Obi");
    await userEvent.type(screen.getByLabelText("Email"), "ada@example.com");
    await userEvent.type(screen.getByLabelText("Phone number"), "8012345678");
    await userEvent.type(screen.getByLabelText("Password"), "Str0ng!Passw0rd");
    await userEvent.click(screen.getByRole("checkbox"));

    // Without inline verification the submit is refused
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(screen.getByText("Verify your email to continue.")).toBeInTheDocument();
    expect(nav.push).not.toHaveBeenCalled();

    await verifyEmailInline();
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));
    // Verify page is gone — straight to onboarding
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/onboarding"), WAIT);
  });

  it("phone input strips non-numeric characters", async () => {
    render(<RegisterPage />);
    const phone = screen.getByLabelText("Phone number");
    await userEvent.type(phone, "80a1-23 45x678");
    expect(phone).toHaveValue("8012345678");
  });

  it("Google sign-up surfaces an honest error when OAuth isn't configured (no fake sign-up)", async () => {
    render(
      <>
        <RegisterPage />
        <Toaster />
      </>
    );
    await userEvent.click(screen.getByRole("button", { name: /Sign up with Google/ }));
    expect(
      await screen.findByText(/Google sign-in isn't configured/)
    ).toBeInTheDocument();
    expect(nav.push).not.toHaveBeenCalled();
  });
});

describe("Complete profile (after Google)", () => {
  it("finishes without a phone number (phone is optional, §11.1 amended)", async () => {
    window.sessionStorage.setItem(
      "amiva_google_pending",
      JSON.stringify({ name: "Ada Obi", email: "ada.obi@gmail.com" })
    );
    render(<CompleteProfilePage />);
    expect(screen.getByText(/ada.obi@gmail.com/)).toBeInTheDocument();
    expect(screen.getByText(/email verified/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Finish setting up" }));
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/onboarding"), WAIT);
  });
});

describe("Forgot password", () => {
  it("never reveals whether an account exists (verified check happens server-side)", async () => {
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
    await userEvent.click(screen.getByRole("button", { name: "Link WhatsApp" }));
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/app/today"), WAIT);
  });

  it("never shows a number it cannot know — the token carries only a hash", () => {
    nav.search = "token=abc123";
    render(<LinkPage />);
    // The mock-era page hardcoded "+234 801 •••• 678"; the real token can't
    // reveal a number, so the copy must not pretend to.
    expect(screen.queryByText(/\+234 801/)).not.toBeInTheDocument();
    expect(screen.getByText(/number you just messaged Amiva from/)).toBeInTheDocument();
  });
});
