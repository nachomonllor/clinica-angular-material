import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterModule, Router } from "@angular/router";
import { AuthService } from "../../../services/auth.service";
import { firstValueFrom } from "rxjs";

@Component({
  selector: "app-login",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <main class="auth-container">
      <section class="card">
        <h1>Iniciar sesión</h1>

        <form (ngSubmit)="onSubmit()" #form="ngForm">
          <label>
            Email
            <input
              type="email"
              name="email"
              [(ngModel)]="email"
              required
              autocomplete="email"
            />
          </label>

          <label>
            Contraseña
            <input
              type="password"
              name="password"
              [(ngModel)]="password"
              required
              autocomplete="current-password"
            />
          </label>

          <button type="submit" [disabled]="form.invalid || loading">
            {{ loading ? "Ingresando..." : "Ingresar" }}
          </button>
        </form>

        <section class="quick-access">
          <h2>Accesos rápidos</h2>
          <p>Ingresá con usuarios de prueba ya configurados:</p>
          <div class="quick-buttons">
            <button
              type="button"
              class="btn-quick admin"
              (click)="loginAs('admin@test.com', '123456')"
            >
              Admin
            </button>
            <button
              type="button"
              class="btn-quick specialist"
              (click)="loginAs('ocu-doc@mail.com', '123456')"
            >
              Especialista
            </button>
            <button
              type="button"
              class="btn-quick patient"
              (click)="loginAs('pac1@mail.com', '123456')"
            >
              Paciente
            </button>
          </div>
        </section>

        <p class="link">
          ¿No tenés cuenta?
          <a routerLink="/seleccionar-registro">Registrate</a>
        </p>

        <p class="error" *ngIf="error">
          {{ error }}
        </p>
      </section>
    </main>
  `,
  styles: `
    .auth-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f4f7fb;
      padding: 1.5rem;
    }
    .card {
      background: white;
      padding: 2rem 2.5rem;
      border-radius: 1rem;
      box-shadow: 0 18px 45px rgba(15, 23, 42, 0.18);
      width: 100%;
      max-width: 420px;
    }
    h1 {
      margin: 0 0 1.5rem;
      font-size: 1.8rem;
      text-align: center;
      color: #0f172a;
    }
    .quick-access {
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
    }
    .quick-access h2 {
      margin: 0 0 0.35rem;
      font-size: 0.95rem;
      color: #0f172a;
    }
    .quick-access p {
      margin: 0 0 0.75rem;
      font-size: 0.8rem;
      color: #64748b;
    }
    .quick-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .btn-quick {
      border: none;
      border-radius: 999px;
      padding: 0.35rem 0.8rem;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      background: #e5e7eb;
      color: #111827;
      transition: background 0.15s, transform 0.1s, box-shadow 0.1s;
    }
    .btn-quick.admin {
      background: #eef2ff;
      color: #3730a3;
    }
    .btn-quick.specialist {
      background: #ecfdf3;
      color: #166534;
    }
    .btn-quick.patient {
      background: #eff6ff;
      color: #1d4ed8;
    }
    .btn-quick:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 14px rgba(15, 23, 42, 0.25);
    }
    form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    label {
      display: flex;
      flex-direction: column;
      font-size: 0.9rem;
      color: #475569;
      gap: 0.25rem;
    }
    input {
      padding: 0.6rem 0.75rem;
      border-radius: 0.5rem;
      border: 1px solid #cbd5f5;
      font-size: 0.95rem;
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    input:focus {
      border-color: #2563eb;
      box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.2);
    }
    button {
      margin-top: 0.5rem;
      padding: 0.65rem 0.75rem;
      border-radius: 0.6rem;
      border: none;
      background: linear-gradient(90deg, #2563eb, #1d4ed8);
      color: white;
      font-weight: 600;
      cursor: pointer;
      font-size: 0.95rem;
      transition: transform 0.1s ease, box-shadow 0.1s ease, opacity 0.1s ease;
      box-shadow: 0 12px 24px rgba(37, 99, 235, 0.35);
    }
    button:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 16px 32px rgba(37, 99, 235, 0.45);
    }
    button:disabled {
      opacity: 0.6;
      cursor: default;
      box-shadow: none;
    }
    .link {
      margin-top: 1rem;
      text-align: center;
      font-size: 0.9rem;
      color: #64748b;
    }
    .link a {
      color: #2563eb;
      text-decoration: none;
      font-weight: 500;
    }
    .link a:hover {
      text-decoration: underline;
    }
    .error {
      margin-top: 0.75rem;
      color: #b91c1c;
      font-size: 0.85rem;
      text-align: center;
    }
  `,
})
export class LoginComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = "";
  password = "";
  loading = false;
  error = "";

  async ngOnInit(): Promise<void> {
    // Si ya hay una sesión activa, redirigir según el rol
    const user = this.auth.currentUser();
    if (user) {
      this.redirigirSegunRol(user.role);
      return;
    }

    // Verificar si hay una sesión válida en el backend
    try {
      const res = await firstValueFrom(this.auth.loadSession());
      if (res.user) {
        this.redirigirSegunRol(res.user.role);
      }
    } catch (error) {
      // No hay sesión, el usuario puede hacer login
      console.log("[Login] No hay sesión activa, mostrando formulario");
    }
  }

  private redirigirSegunRol(role: string): void {
    if (role === "PATIENT") {
      this.router.navigateByUrl("/mis-turnos-paciente");
    } else if (role === "SPECIALIST") {
      this.router.navigateByUrl("/mis-turnos-especialista");
    } else if (role === "ADMIN") {
      this.router.navigateByUrl("/admin/users");
    } else {
      this.router.navigateByUrl("/bienvenida");
    }
  }

  onSubmit() {
    if (this.loading) return;
    this.loading = true;
    this.error = "";

    this.auth.login(this.email, this.password).subscribe({
      next: (res) => {
        this.loading = false;
        const user = res.user;
        if (user) {
          this.redirigirSegunRol(user.role);
        } else {
          this.router.navigateByUrl("/bienvenida");
        }
      },
      error: () => {
        this.loading = false;
        this.error = "Credenciales inválidas o usuario no autorizado.";
      },
    });
  }

  loginAs(email: string, password: string) {
    if (this.loading) return;
    this.email = email;
    this.password = password;
    this.onSubmit();
  }
}
