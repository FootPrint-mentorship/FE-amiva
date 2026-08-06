/**
 * Search repository (POST /search). Mock mode keeps the canned answers so the
 * demo stays self-contained; real mode asks the backend and normalises the
 * response to the palette's display shape (singular source kinds, short
 * human dates).
 */

import { api, USE_MOCKS } from "@/lib/api/client";
import { fmtDay } from "@/lib/mock";

export type CitationKind = "memory" | "email" | "event" | "task";

export type SearchCitation = {
  source_type: CitationKind;
  title: string;
  snippet: string;
  date: string; // display-ready
};

export type SearchResult = {
  answer: string;
  confidence: "high" | "medium" | "low";
  citations: SearchCitation[];
  not_found: boolean;
};

/** Palette chip label → API source enum. */
const SOURCE_PARAM: Record<string, string> = {
  Memories: "memories",
  Email: "email",
  Calendar: "calendar",
  Tasks: "tasks",
};

/** API source_type (plural, mirrors the request enum) → display kind. */
const KIND: Record<string, CitationKind> = {
  memories: "memory",
  memory: "memory",
  email: "email",
  calendar: "event",
  event: "event",
  tasks: "task",
  task: "task",
};

type ApiSearchResponse = {
  answer: string;
  confidence: "high" | "medium" | "low";
  citations: {
    source_type: string;
    source_id: string;
    title: string;
    snippet: string;
    date: string;
  }[];
  not_found: boolean;
};

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function runSearch(
  query: string,
  enabledSources: string[]
): Promise<SearchResult> {
  if (USE_MOCKS) {
    await delay(700);
    return mockSearch(query);
  }
  const res = await api<ApiSearchResponse>("/search", {
    method: "POST",
    body: {
      query,
      sources: enabledSources.map((s) => SOURCE_PARAM[s]).filter(Boolean),
    },
  });
  return {
    answer: res.answer,
    confidence: res.confidence,
    not_found: res.not_found,
    citations: res.citations.map((c) => ({
      source_type: KIND[c.source_type] ?? "memory",
      title: c.title,
      snippet: c.snippet,
      date: fmtDay(c.date),
    })),
  };
}

/** Mock of POST /search — canned answers keyed on keywords. */
function mockSearch(q: string): SearchResult {
  const needle = q.toLowerCase();
  if (needle.includes("landlord") || needle.includes("rent")) {
    return {
      answer:
        "Your landlord's account is GTB 0123456789 (Musa Ibrahim). Rent is due on the last Friday of every month. Your next reminder is set for Fri 31 Jul, 9:00 AM.",
      confidence: "high",
      citations: [
        {
          source_type: "memory",
          title: "Landlord's account",
          snippet: "GTB 0123456789, Musa Ibrahim. Rent due last Friday…",
          date: "20 Jul",
        },
      ],
      not_found: false,
    };
  }
  if (needle.includes("flight") || needle.includes("nairobi")) {
    return {
      answer:
        "Your Lagos → Nairobi flight is KQ533 on the day after tomorrow, departing 9:15 AM from MMA Terminal 1. You're staying at Sarova Stanley (ref 6HJQZP); James is picking you up.",
      confidence: "high",
      citations: [
        {
          source_type: "event",
          title: "Flight to Nairobi (KQ533)",
          snippet: "9:15 AM · MMA Terminal 1",
          date: "This week",
        },
        {
          source_type: "memory",
          title: "Nairobi trip",
          snippet: "Sarova Stanley, booking ref 6HJQZP. Airport pickup…",
          date: "24 Jul",
        },
      ],
      not_found: false,
    };
  }
  if (needle.includes("kemi")) {
    return {
      answer:
        "The proposal for Kemi is due today (task, high priority, 1 of 2 subtasks done). Note: Kemi prefers WhatsApp voice notes for quick updates; formal documents by email.",
      confidence: "medium",
      citations: [
        {
          source_type: "task",
          title: "Send proposal to Kemi",
          snippet: "Due today · high priority",
          date: "Today",
        },
        {
          source_type: "memory",
          title: "Kemi's preferences",
          snippet: "Prefers WhatsApp voice notes over email…",
          date: "23 Jul",
        },
      ],
      not_found: false,
    };
  }
  return {
    answer:
      "I couldn't find that in your connected sources (memories, calendar and tasks were searched). Connecting Gmail would let me search your email too.",
    confidence: "low",
    citations: [],
    not_found: true,
  };
}
