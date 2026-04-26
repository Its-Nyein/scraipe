import { prisma } from "#/db";
import { RATE_LIMIT_PREFIX } from "./rate-limit-shared";

export {
  RATE_LIMIT_PREFIX,
  isRateLimitMessage,
  stripRateLimitPrefix,
} from "./rate-limit-shared";

export const RATE_LIMITS = {
  scrape: 50,
  search: 30,
  ai: 30,
} as const;

export type RateLimitAction = keyof typeof RATE_LIMITS;

export class RateLimitError extends Error {
  constructor(
    public action: RateLimitAction,
    public limit: number,
  ) {
    super(
      `${RATE_LIMIT_PREFIX}Daily limit reached for ${action} (${limit}/day). Try again tomorrow.`,
    );
    this.name = "RateLimitError";
  }
}

function todayBucket(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function consumeRateLimit(
  userId: string,
  action: RateLimitAction,
  weight = 1,
): Promise<void> {
  const limit = RATE_LIMITS[action];
  const bucket = todayBucket();

  const rows = await prisma.$queryRaw<{ count: number }[]>`
    INSERT INTO "rate_limit" ("id", "userId", "action", "bucket", "count", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), ${userId}, ${action}, ${bucket}, ${weight}, NOW(), NOW())
    ON CONFLICT ("userId", "action", "bucket")
    DO UPDATE SET "count" = "rate_limit"."count" + ${weight}, "updatedAt" = NOW()
    RETURNING "count"
  `;

  const newCount = Number(rows[0]?.count ?? 0);
  if (newCount > limit) {
    throw new RateLimitError(action, limit);
  }
}
