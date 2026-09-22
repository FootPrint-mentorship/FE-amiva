import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { RichText } from "@/lib/rich-text";

describe("RichText — WhatsApp markup", () => {
  it("renders the prod case: *Tuesday 25 August* as bold, not literal asterisks", () => {
    // Seen live on prod 25 Aug 2026 rendered with the asterisks visible.
    const { container } = render(
      <RichText text="📋*Tuesday 25 August*: Your day is clear. 🎉" />,
    );
    const bold = container.querySelector("strong");
    expect(bold).not.toBeNull();
    expect(bold).toHaveTextContent("Tuesday 25 August");
    // the raw markers are gone, the surrounding text and emoji stay
    expect(container.textContent).toBe(
      "📋Tuesday 25 August: Your day is clear. 🎉",
    );
    expect(container.textContent).not.toContain("*");
  });

  it("maps _italic_ and ~strikethrough~", () => {
    const { container } = render(<RichText text="_soon_ and ~later~" />);
    expect(container.querySelector("em")).toHaveTextContent("soon");
    expect(container.querySelector("s")).toHaveTextContent("later");
    expect(container.textContent).toBe("soon and later");
  });

  it("nests different markers", () => {
    const { container } = render(<RichText text="*_bold italic_*" />);
    const bold = container.querySelector("strong");
    expect(bold).not.toBeNull();
    expect(bold!.querySelector("em")).toHaveTextContent("bold italic");
  });

  it("preserves line breaks", () => {
    const { container } = render(<RichText text={"line one\nline two"} />);
    expect(container.querySelectorAll("br")).toHaveLength(1);
    expect(container.textContent).toBe("line oneline two");
  });

  it("leaves stray punctuation alone (no false formatting)", () => {
    // whitespace-adjacent markers and mid-word underscores are not markup
    const { container } = render(<RichText text="2 * 3 and file_name_here" />);
    expect(container.querySelector("strong")).toBeNull();
    expect(container.querySelector("em")).toBeNull();
    expect(container.textContent).toBe("2 * 3 and file_name_here");
  });

  it("does not interpret HTML in server text", () => {
    const { container } = render(
      <RichText text="<script>alert(1)</script> *bold*" />,
    );
    // React escapes text nodes — no real <script> element is created
    expect(container.querySelector("script")).toBeNull();
    expect(container.textContent).toBe("<script>alert(1)</script> bold");
    expect(container.querySelector("strong")).toHaveTextContent("bold");
  });
});
