import { Fragment, type ReactNode } from "react";

/**
 * Renders WhatsApp-style markup as styled React nodes.
 *
 * The assistant composes replies for WhatsApp first, so its text uses the
 * WhatsApp convention — single-`*` bold, `_italic_`, `~strikethrough~` — which
 * the web chat was showing literally (e.g. "*Tuesday 25 August*" with the
 * asterisks visible). This maps that small subset to real elements.
 *
 * Deliberately NOT a markdown parser: only the three inline styles WhatsApp
 * supports, plus line breaks. React escapes text nodes for us, so server text
 * is rendered safely without dangerouslySetInnerHTML.
 */

const MARKERS = {
  "*": (children: ReactNode, key: number) => (
    <strong key={key} className="font-semibold">
      {children}
    </strong>
  ),
  _: (children: ReactNode, key: number) => <em key={key}>{children}</em>,
  "~": (children: ReactNode, key: number) => <s key={key}>{children}</s>,
} as const;

type Marker = keyof typeof MARKERS;

const isMarker = (ch: string): ch is Marker => ch === "*" || ch === "_" || ch === "~";

/**
 * Parse one line into nodes. A marker opens a span only when a matching marker
 * closes it later on the same line with non-blank content between them, neither
 * inner edge is whitespace, and both markers sit on a word boundary — roughly
 * WhatsApp's own rule. That keeps stray punctuation ("2 * 3"), math ("5*5"),
 * and mid-word underscores ("file_name_here") from being swallowed as
 * formatting. Different markers may nest (`*_bold italic_*`); same-marker
 * nesting can't occur because the nearest match always closes first.
 */
const isWord = (ch: string | undefined) => ch !== undefined && /\w/.test(ch);

function parseLine(line: string, keyBase: number): ReactNode[] {
  const nodes: ReactNode[] = [];
  let buffer = "";
  let key = keyBase;
  let i = 0;

  const flush = () => {
    if (buffer) {
      nodes.push(buffer);
      buffer = "";
    }
  };

  while (i < line.length) {
    const ch = line[i];
    // A marker can only open on a word boundary (start of line or after a
    // non-word char), so "5*5" and "a_b" stay literal.
    if (isMarker(ch) && !isWord(line[i - 1])) {
      const close = line.indexOf(ch, i + 1);
      if (close > i + 1 && !isWord(line[close + 1])) {
        const inner = line.slice(i + 1, close);
        if (!/^\s|\s$/.test(inner)) {
          flush();
          nodes.push(MARKERS[ch](parseLine(inner, key * 97 + 1), key));
          key += 1;
          i = close + 1;
          continue;
        }
      }
    }
    buffer += ch;
    i += 1;
  }

  flush();
  return nodes;
}

/**
 * Render assistant / WhatsApp-sourced text with its inline styling and line
 * breaks preserved. Use this anywhere server-composed message text is shown.
 */
export function RichText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const lines = text.split("\n");
  return (
    <span className={className}>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {parseLine(line, i * 1000)}
        </Fragment>
      ))}
    </span>
  );
}
