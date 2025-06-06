// import { Request } from 'express';
// import { rateLimit } from 'express-rate-limit';

// import { env } from '@/common/utils/envConfig';

// const rateLimiter = rateLimit({
//   legacyHeaders: true,
//   limit: env.COMMON_RATE_LIMIT_MAX_REQUESTS,
//   message: 'Too many requests, please try again later.',
//   standardHeaders: true,
//   windowMs: 15 * 60 * env.COMMON_RATE_LIMIT_WINDOW_MS,
//   keyGenerator: (req: Request) => req.ip as string,
// });

// export default rateLimiter;
import { Request } from 'express';
import { rateLimit } from 'express-rate-limit';


const rateLimiter = rateLimit({
  legacyHeaders: true,
  limit: process.env.COMMON_RATE_LIMIT_MAX_REQUESTS as any,
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  windowMs: process.env.COMMON_RATE_LIMIT_WINDOW_MS as any,
  keyGenerator: (req: Request) => req.ip as string,
});

export default rateLimiter;
