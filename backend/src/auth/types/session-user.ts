import { UserRole, UserStatus } from "@prisma/client";

export interface SessionUser {
  id: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
}

