/*
 * Decides what the person typing into the command bar most likely wants.
 * It is a deliberately simple rule set that runs instantly in the browser; once the AI
 * agent ships, "ask" and "action" queries are handed to it and it can refine the call.
 */

export type CommandIntent = "navigate" | "search" | "ask" | "action";

// Longest first, so "search for acme" strips "search for " rather than just "search ".
const byLength = (items: string[]) => [...items].sort((a, b) => b.length - a.length);
const NAVIGATE_PREFIXES = byLength(["go to ", "goto ", "open ", "navigate to "]);
const SEARCH_PREFIXES = byLength(["find ", "search ", "search for ", "look up ", "lookup "]);
const ACTION_VERBS = new Set([
  "create",
  "add",
  "new",
  "invite",
  "send",
  "prepare",
  "draft",
  "schedule",
  "assign",
  "update",
  "change",
  "delete",
  "remove",
  "mark",
  "move",
  "remind",
  "email",
]);
const QUESTION_STARTERS = new Set([
  "what",
  "which",
  "who",
  "whom",
  "how",
  "why",
  "when",
  "where",
  "show",
  "summarize",
  "summarise",
  "explain",
  "compare",
  "list",
  "is",
  "are",
  "do",
  "does",
  "did",
  "can",
  "should",
]);

export interface DetectedIntent {
  intent: CommandIntent;
  /** The query with any navigation or search prefix removed. */
  query: string;
}

export function detectCommandIntent(raw: string): DetectedIntent {
  const query = raw.trim().replace(/\s+/g, " ");
  const lower = query.toLowerCase();

  if (!lower) return { intent: "navigate", query: "" };

  const navPrefix = NAVIGATE_PREFIXES.find((prefix) => lower.startsWith(prefix));
  if (navPrefix) return { intent: "navigate", query: query.slice(navPrefix.length).trim() };

  const searchPrefix = SEARCH_PREFIXES.find((prefix) => lower.startsWith(prefix));
  if (searchPrefix) {
    return {
      intent: "search",
      query: query
        .slice(searchPrefix.length)
        .replace(/[.?!]+$/, "")
        .trim(),
    };
  }

  const firstWord = lower.split(" ")[0]!.replace(/[^a-z]/g, "");
  if (ACTION_VERBS.has(firstWord)) return { intent: "action", query };
  if (lower.endsWith("?") || QUESTION_STARTERS.has(firstWord)) return { intent: "ask", query };

  // A longer sentence is almost certainly a question for the assistant, not a name.
  if (lower.split(" ").length >= 5) return { intent: "ask", query };

  return { intent: "search", query: query.replace(/[.?!]+$/, "") };
}
