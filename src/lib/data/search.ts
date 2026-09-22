/**
 * Search repository (POST /search). Asks the backend and normalises the
 * response to the palette's display shape (singular source kinds, short
 * human dates).
 */

import { api } from "@/lib/api/client";
import { fmtDay } from "@/lib/format";

export type CitationKind = "memory" | "event" | "task";

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
  Calendar: "calendar",
  Tasks: "tasks",
};

/** API source_type (plural, mirrors the request enum) → display kind. */
const KIND: Record<string, CitationKind> = {
  memories: "memory",
  memory: "memory",
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

export async function runSearch(
  query: string,
  enabledSources: string[]
): Promise<SearchResult> {
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
