type Plain = Record<string, unknown>;

export interface ChangeSet {
  before: Plain;
  after: Plain;
}

function normalize(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (value === undefined) return null;
  return value;
}

/**
 * Builds the before/after pair stored on audit entries, limited to the fields that
 * actually changed. Returns null when nothing changed so callers can skip the log.
 */
export function diffChanges<T extends Plain>(
  before: T,
  after: Partial<T>,
  fields: ReadonlyArray<keyof T & string>,
): ChangeSet | null {
  const changes: ChangeSet = { before: {}, after: {} };

  for (const field of fields) {
    if (!(field in after)) continue;
    const previous = normalize(before[field]);
    const next = normalize(after[field]);
    if (JSON.stringify(previous) !== JSON.stringify(next)) {
      changes.before[field] = previous;
      changes.after[field] = next;
    }
  }

  return Object.keys(changes.after).length > 0 ? changes : null;
}
