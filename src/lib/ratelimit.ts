const store = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const record = store.get(key);

  if (!record || now > record.resetTime) {
    store.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }

  if (record.count < limit) {
    record.count++;
    return { allowed: true, retryAfter: 0 };
  }

  return {
    allowed: false,
    retryAfter: Math.ceil((record.resetTime - now) / 1000),
  };
}
