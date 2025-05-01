import { Claims } from '@/jwt-token/types/claims.type';

declare global {
  declare namespace Express {
    interface Request {
      userToken?: Claims;
    }
  }
}
