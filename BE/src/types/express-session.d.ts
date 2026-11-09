// src/types/express-session.d.ts
import 'express-session';

declare module 'express-session' {
  interface SessionData {
    client?: string;
  }
}

export {}; // 👈 This is required to make it a module