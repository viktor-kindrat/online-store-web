export function formatMinor(minor: number): string {
  return `₴${(minor / 100).toFixed(2)}`;
}
