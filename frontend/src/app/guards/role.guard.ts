import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../services/auth.service";
import type { UserRole } from "../models/user.model";

export const roleGuard = (allowedRoles: UserRole[]): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const user = authService.currentUser();
    if (!user) {
      router.navigate(["/login"]);
      return false;
    }

    if (!allowedRoles.includes(user.role)) {
      router.navigate(["/bienvenida"]);
      return false;
    }

    return true;
  };
};
