import type { AuthPayload } from '../api/auth/auth.service';

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}
