let counter = 0;

/** Prefixed unique ids for optimistically created records (rem_, tsk_, …). */
export function newId(prefix: string) {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}${counter}`;
}
