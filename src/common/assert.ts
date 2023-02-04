/** Throws an error unless a condition is met. */
export function ensure(
  condition: boolean,
  message?: string
): asserts condition {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}

/** Throws an error if the argument is null. */
export function ensureNotNull<T>(a: T | null): T {
  if (a == null) {
    throw new Error("Unexpected null");
  }
  return a;
}
