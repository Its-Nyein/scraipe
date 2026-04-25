export const RATE_LIMIT_PREFIX = "RATE_LIMIT:";

export function isRateLimitMessage(message: string): boolean {
  return message.startsWith(RATE_LIMIT_PREFIX);
}

export function stripRateLimitPrefix(message: string): string {
  return message.startsWith(RATE_LIMIT_PREFIX)
    ? message.slice(RATE_LIMIT_PREFIX.length)
    : message;
}

export function extractErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) {
    return stripRateLimitPrefix(err.message) || fallback;
  }
  return fallback;
}
