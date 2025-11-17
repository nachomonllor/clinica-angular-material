import "express-session";
import type { SessionUser } from "../auth/types/session-user";

declare module "express-session" {
  interface SessionData {
    user?: SessionUser;
  }
}

