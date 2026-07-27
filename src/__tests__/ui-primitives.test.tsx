import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Field } from "@/components/ui/field";

describe("Button", () => {
  it("fires onClick", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("is disabled and non-interactive while loading", async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Save
      </Button>
    );
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
    expect(onClick).not.toHaveBeenCalled();
  });

  it("respects the disabled prop", () => {
    render(<Button disabled>Nope</Button>);
    expect(screen.getByRole("button", { name: "Nope" })).toBeDisabled();
  });
});

describe("Chip", () => {
  it("renders its content", () => {
    render(<Chip tone="danger">Important</Chip>);
    expect(screen.getByText("Important")).toBeInTheDocument();
  });
});

describe("Field", () => {
  it("associates label with input", () => {
    render(<Field label="Email" placeholder="you@example.com" />);
    expect(screen.getByLabelText("Email")).toHaveAttribute(
      "placeholder",
      "you@example.com"
    );
  });

  it("exposes errors via aria-invalid and a described message", () => {
    render(<Field label="Email" error="Enter a valid email address." />);
    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument();
    const describedBy = input.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
  });

  it("shows hint text when there is no error", () => {
    render(<Field label="Phone" hint="The number you use for WhatsApp" />);
    expect(screen.getByText("The number you use for WhatsApp")).toBeInTheDocument();
  });
});
