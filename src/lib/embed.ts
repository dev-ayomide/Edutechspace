/**
 * PostgREST returns a related row as a single object (or null) when the foreign key is unique, and as an array
 * otherwise. `assignments.module_id` is unique (one assignment per module), so `modules.select('assignments(*)')`
 * yields an object or null. Normalise to an array so callers can treat every embed the same way.
 */
export function asList<T>(value: T | T[] | null | undefined): T[] {
  if (value == null) return []
  return Array.isArray(value) ? value : [value]
}
