import rateLimit from "express-rate-limit";

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
};

const rateLimitWindowMs = parsePositiveInt(
  process.env.RATE_LIMIT_WINDOW_MS,
  1 * 60 * 1000,
);
const globalRateLimitMax = parsePositiveInt(process.env.RATE_LIMIT_MAX, 200);
const authRateLimitMax = parsePositiveInt(process.env.RATE_LIMIT_AUTH_MAX, 10);

const defaultMessage = "Túl sok kérés, kérlek próbáld újra később.";

const createJsonLimiter = (max) =>
  rateLimit({
    windowMs: rateLimitWindowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        error: "Too Many Requests",
        message: defaultMessage,
      });
    },
  });

export const globalRateLimiter = createJsonLimiter(globalRateLimitMax);
export const authRateLimiter = createJsonLimiter(authRateLimitMax);
