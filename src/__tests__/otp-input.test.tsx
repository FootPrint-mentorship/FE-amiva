import { describe, it, expect } from "vitest";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OtpInput } from "@/components/ui/otp-input";

function Harness() {
  const [value, setValue] = useState("");
  return (
    <>
      <OtpInput value={value} onChange={setValue} label="Email code" />
      <output data-testid="value">{value}</output>
    </>
  );
}

describe("OtpInput", () => {
  it("renders six labelled digit boxes", () => {
    render(<Harness />);
    for (let i = 1; i <= 6; i++) {
      expect(screen.getByLabelText(`Email code digit ${i}`)).toBeInTheDocument();
    }
  });

  it("advances focus as digits are typed", async () => {
    render(<Harness />);
    const first = screen.getByLabelText("Email code digit 1");
    await userEvent.type(first, "4");
    expect(screen.getByLabelText("Email code digit 2")).toHaveFocus();
    expect(screen.getByTestId("value")).toHaveTextContent("4");
  });

  it("ignores non-numeric input", async () => {
    render(<Harness />);
    await userEvent.type(screen.getByLabelText("Email code digit 1"), "x");
    expect(screen.getByTestId("value")).toHaveTextContent(/^$/);
  });

  it("distributes a pasted code across the boxes", async () => {
    render(<Harness />);
    const first = screen.getByLabelText("Email code digit 1");
    await userEvent.click(first);
    await userEvent.paste("482913");
    expect(screen.getByTestId("value")).toHaveTextContent("482913");
  });

  it("backspace on an empty box moves focus back", async () => {
    render(<Harness />);
    await userEvent.type(screen.getByLabelText("Email code digit 1"), "4");
    const second = screen.getByLabelText("Email code digit 2");
    expect(second).toHaveFocus();
    await userEvent.keyboard("{Backspace}");
    expect(screen.getByLabelText("Email code digit 1")).toHaveFocus();
  });
});
