export function normalizeMaybeUrl(input: string): string {
  const trimmed = input.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/\s/.test(trimmed)) return trimmed;
  const domainLike = /^([a-z0-9-]+\.)+[a-z]{2,}(\/|$|\?|:)/i;
  if (domainLike.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}
