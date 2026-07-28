import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";

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

function SelectHarness({ searchable = false }: { searchable?: boolean }) {
  const [value, setValue] = useState<string | null>(null);
  return (
    <Select
      label="Timezone"
      value={value}
      onChange={setValue}
      searchable={searchable}
      options={[
        { value: "Africa/Lagos", label: "Africa/Lagos", hint: "UTC+01:00" },
        { value: "Africa/Nairobi", label: "Africa/Nairobi", hint: "UTC+03:00" },
        { value: "Europe/London", label: "Europe/London", hint: "UTC+01:00" },
      ]}
    />
  );
}

describe("Select (custom dropdown)", () => {
  it("opens a listbox and picks an option", async () => {
    render(<SelectHarness />);
    const trigger = screen.getByRole("combobox", { name: "Timezone" });
    expect(trigger).toHaveTextContent("Select…");
    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole("option", { name: /Africa\/Nairobi/ }));
    expect(trigger).toHaveTextContent("Africa/Nairobi");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument(); // closed after pick
  });

  it("supports keyboard: arrows + Enter select without a mouse", async () => {
    render(<SelectHarness />);
    const trigger = screen.getByRole("combobox", { name: "Timezone" });
    trigger.focus();
    await userEvent.keyboard("{ArrowDown}"); // opens
    await userEvent.keyboard("{ArrowDown}{Enter}");
    expect(trigger).toHaveTextContent("Africa/Nairobi");
  });

  it("search filters long lists", async () => {
    render(<SelectHarness searchable />);
    await userEvent.click(screen.getByRole("combobox", { name: "Timezone" }));
    await userEvent.type(screen.getByLabelText("Search Timezone"), "lond");
    expect(screen.getAllByRole("option").length).toBe(1);
    await userEvent.click(screen.getByRole("option", { name: /Europe\/London/ }));
    expect(screen.getByRole("combobox", { name: "Timezone" })).toHaveTextContent("Europe/London");
  });
});
