let seq = 0;

export function nextId(prefix: string): string {
  seq += 1;
  return `${prefix}_${Date.now().toString(36)}_${seq.toString(36)}`;
}

export function resetIdSeq(value = 0): void {
  seq = value;
}
