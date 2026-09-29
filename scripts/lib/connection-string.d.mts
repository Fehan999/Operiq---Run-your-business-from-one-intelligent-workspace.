export interface ConnectionStringReport {
  /** The cleaned-up URL, or null when it couldn't be parsed. Contains the password. */
  url: string | null;
  /** Human-readable description with the password reduced to its length. */
  summary: string;
  problems: string[];
}

export function inspectConnectionString(value: string | undefined): ConnectionStringReport;

export function explainConnectionError(error: unknown): string | null;
