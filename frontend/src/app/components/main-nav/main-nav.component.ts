import { Component, OnInit, OnDestroy, signal, effect } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule, Router } from "@angular/router";
import { AuthService } from "../../services/auth.service";
import type { User } from "../../models/user.model";
import { firstValueFrom } from "rxjs";

@Component({
  selector: "app-main-nav",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./main-nav.component.html",
  styleUrl: "./main-nav.component.scss",
})
export class MainNavComponent implements OnInit, OnDestroy {
  protected readonly currentUser = signal<User | null>(null);
  protected readonly showMenu = signal(false);

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {
    // Sincronizar el signal con el AuthService usando effect
    effect(() => {
      this.currentUser.set(this.authService.currentUser());
    });
  }

  ngOnInit(): void {
    // Cerrar menú al hacer clic fuera
    document.addEventListener("click", this.handleClickOutside);
  }

  ngOnDestroy(): void {
    document.removeEventListener("click", this.handleClickOutside);
  }

  private handleClickOutside = (event: MouseEvent): void => {
    const target = event.target as HTMLElement;
    if (!target.closest(".user-menu")) {
      this.showMenu.set(false);
    }
  };

  protected toggleMenu(): void {
    this.showMenu.set(!this.showMenu());
  }

  protected async logout(): Promise<void> {
    try {
      await firstValueFrom(this.authService.logout());
      this.showMenu.set(false);
      this.router.navigate(["/bienvenida"]);
    } catch (error) {
      console.error("[MainNav] Error al cerrar sesión:", error);
    }
  }

  protected getNombreCompleto(): string {
    const user = this.currentUser();
    if (!user) return "Usuario";
    return `${user.nombre} ${user.apellido}`.trim() || user.email || "Usuario";
  }

  protected getNavItems() {
    const user = this.currentUser();
    if (!user) return [];

    switch (user.role) {
      case "ADMIN":
        return [{ label: "Usuarios", route: "/admin/users", icon: "👥" }];
      case "PATIENT":
        return []; // Sprint 2
      case "SPECIALIST":
        return []; // Sprint 2
      default:
        return [];
    }
  }
}
