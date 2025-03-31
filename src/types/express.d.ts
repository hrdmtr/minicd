import { Response } from 'express';

declare global {
  namespace Express {
    interface Response {
      __: (key: string) => string;
    }
  }
}