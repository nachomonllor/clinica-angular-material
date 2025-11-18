import { Component, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule, Router } from "@angular/router";
import { AuthService } from "../../services/auth.service";
import { RoleLabelPipe } from "../../pipes/role-label.pipe";
import { firstValueFrom } from "rxjs";

@Component({
  selector: "app-navbar",
  standalone: true,
  imports: [CommonModule, RouterModule, RoleLabelPipe],
  templateUrl: "./navbar.component.html",
  styleUrl: "./navbar.component.scss",
})
export class NavbarComponent {
  constructor(
    protected authService: AuthService,
    private router: Router,
  ) {}

  protected readonly autenticado = computed(() => !!this.authService.currentUser());

  protected readonly nombreUsuario = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return "";
    return `${user.nombre} ${user.apellido}`.trim() || user.email;
  });

  protected readonly rolUsuario = computed(() => {
    return this.authService.currentUser()?.role ?? "";
  });

  protected readonly esEspecialista = computed(() => {
    return this.authService.currentUser()?.role === "SPECIALIST";
  });

  protected readonly esAdmin = computed(() => {
    return this.authService.currentUser()?.role === "ADMIN";
  });

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.authService.logout());
      // El currentUser signal ya se actualiza en AuthService.logout()
      this.router.navigate(["/bienvenida"]);
    } catch (error) {
      console.error("[Navbar] Error al cerrar sesión:", error);
    }
  }

  irAInicio(): void {
    const user = this.authService.currentUser();
    if (!user) {
      this.router.navigate(["/bienvenida"]);
      return;
    }

    const rol = user.role;
    if (rol === "PATIENT") {
      this.router.navigate(["/mis-turnos-paciente"]);
    } else if (rol === "SPECIALIST") {
      this.router.navigate(["/mis-turnos-especialista"]);
    } else if (rol === "ADMIN") {
      this.router.navigate(["/admin/users"]);
    } else {
      this.router.navigate(["/bienvenida"]);
    }
  }
}
