import { Component, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterModule, Router } from "@angular/router";
import { AuthService } from "../../../services/auth.service";
import { RecaptchaComponent } from "../../../shared/recaptcha/recaptcha.component";
import { CustomCaptchaDirective } from "../../../directives/custom-captcha.directive";
import { ImageUploadComponent } from "../../../shared/image-upload/image-upload.component";

@Component({
  selector: "app-register-especialista",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, RecaptchaComponent, CustomCaptchaDirective, ImageUploadComponent],
  template: `
    <main class="auth-container">
      <section class="card">
        <h1>Registro de especialista</h1>

        <form (ngSubmit)="onSubmit()" #form="ngForm">
          <div class="row">
            <label>
              Nombre
              <input
                type="text"
                name="nombre"
                [(ngModel)]="nombre"
                required
              />
            </label>
            <label>
              Apellido
              <input
                type="text"
                name="apellido"
                [(ngModel)]="apellido"
                required
              />
            </label>
          </div>

          <label>
            DNI
            <input
              type="text"
              name="dni"
              [(ngModel)]="dni"
              required
            />
          </label>

          <label>
            Edad
            <input
              type="number"
              name="edad"
              [(ngModel)]="edad"
              required
              min="1"
            />
          </label>

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
              minlength="6"
              autocomplete="new-password"
            />
          </label>

          <!-- Imagen de perfil (opcional) -->
          <app-image-upload
            label="Imagen de perfil (opcional)"
            [currentImageUrl]="imagenUrl"
            [disabled]="loading"
            (imageUploaded)="onImagenUploaded($event)"
            (imageRemoved)="onImagenRemoved()"
          />

          <div class="specialties-group">
            <span class="specialties-label">Especialidades</span>
            <div class="specialties-chips">
              <button
                type="button"
                class="chip"
                *ngFor="let esp of especialidadesDisponibles"
                [class.chip--active]="especialidadesSeleccionadas.includes(esp)"
                (click)="toggleEspecialidad(esp)">
                {{ esp }}
              </button>
            </div>
            <p class="specialties-hint">
              Podés elegir una o varias opciones. Si marcás "Otra", indicá la especialidad abajo.
            </p>
          </div>

          <label *ngIf="tieneOtraEspecialidad">
            Otra especialidad
            <input
              type="text"
              name="otraEspecialidad"
              [(ngModel)]="otraEspecialidad"
              [required]="tieneOtraEspecialidad"
              placeholder="Especificá otra especialidad"
            />
          </label>

          <app-recaptcha
            [siteKey]="recaptchaSiteKey"
            [enabled]="recaptchaEnabled()"
            (captchaValid)="onCaptchaValid($event)"
          />

          <div 
            appCustomCaptcha
            [enabled]="customCaptchaEnabled()"
            [difficulty]="'easy'"
            (captchaValid)="onCustomCaptchaValid($event)"
            (captchaToken)="onCustomCaptchaToken($event)"
          ></div>

          <button type="submit" [disabled]="form.invalid || loading || !especialidadesValidas || !captchaToken() || !customCaptchaValid()">
            {{ loading ? "Creando cuenta..." : "Crear cuenta" }}
          </button>
        </form>

        <p class="link">
          ¿Ya tenés cuenta?
          <a routerLink="/login">Iniciar sesión</a>
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
      max-width: 520px;
    }
    h1 {
      margin: 0 0 1.5rem;
      font-size: 1.8rem;
      text-align: center;
      color: #0f172a;
    }
    form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .row {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }
    label {
      flex: 1;
      min-width: 0;
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
      border-color: #7c3aed;
      box-shadow: 0 0 0 1px rgba(124, 58, 237, 0.2);
    }
    button {
      margin-top: 0.5rem;
      padding: 0.65rem 0.75rem;
      border-radius: 0.6rem;
      border: none;
      background: linear-gradient(90deg, #7c3aed, #6d28d9);
      color: white;
      font-weight: 600;
      cursor: pointer;
      font-size: 0.95rem;
      transition: transform 0.1s ease, box-shadow 0.1s ease, opacity 0.1s ease;
      box-shadow: 0 12px 24px rgba(124, 58, 237, 0.35);
    }
    button:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 16px 32px rgba(124, 58, 237, 0.45);
    }
    button:disabled {
      opacity: 0.6;
      cursor: default;
      box-shadow: none;
    }
    .specialties-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .specialties-label {
      font-size: 0.9rem;
      color: #475569;
      font-weight: 500;
    }
    .specialties-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .chip {
      padding: 0.4rem 0.75rem;
      border-radius: 999px;
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      font-size: 0.85rem;
      color: #475569;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .chip:hover {
      background: #eef2ff;
      border-color: #7c3aed;
      color: #4c1d95;
    }
    .chip--active {
      background: #7c3aed;
      border-color: #6d28d9;
      color: #ffffff;
      box-shadow: 0 6px 16px rgba(124, 58, 237, 0.35);
    }
    .specialties-hint {
      margin: 0;
      font-size: 0.8rem;
      color: #94a3b8;
    }
    .link {
      margin-top: 1rem;
      text-align: center;
      font-size: 0.9rem;
      color: #64748b;
    }
    .link a {
      color: #7c3aed;
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
    @media (max-width: 640px) {
      .row {
        flex-direction: column;
      }
    }
  `,
})
export class RegisterEspecialistaComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  // Google reCAPTCHA site key (configurar en producción)
  recaptchaSiteKey = "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"; // Site key de prueba
  recaptchaEnabled = signal(true);
  captchaToken = signal<string | null>(null);

  // Captcha propio (Sprint 5)
  customCaptchaEnabled = signal(true); // Se puede deshabilitar
  customCaptchaValid = signal(false);
  customCaptchaToken = signal<string | null>(null);

  nombre = "";
  apellido = "";
  dni = "";
  edad = 18;
  email = "";
  password = "";
  especialidadesSeleccionadas: string[] = [];
  otraEspecialidad = "";
  loading = false;
  error = "";
  
  // URL de imagen subida
  imagenUrl: string | null = null;

  especialidadesDisponibles = [
    "Cardiología",
    "Dermatología",
    "Ginecología",
    "Pediatría",
    "Neurología",
    "Otra",
  ];

  get tieneOtraEspecialidad(): boolean {
    return this.especialidadesSeleccionadas.includes("Otra");
  }

  get especialidadesValidas(): boolean {
    if (this.especialidadesSeleccionadas.length === 0) return false;
    if (this.tieneOtraEspecialidad && !this.otraEspecialidad.trim()) return false;
    return true;
  }
  toggleEspecialidad(esp: string): void {
    if (this.especialidadesSeleccionadas.includes(esp)) {
      this.especialidadesSeleccionadas = this.especialidadesSeleccionadas.filter(
        (e) => e !== esp,
      );
    } else {
      this.especialidadesSeleccionadas = [...this.especialidadesSeleccionadas, esp];
    }
  }

  onCaptchaValid(token: string | null) {
    this.captchaToken.set(token);
  }

  onCustomCaptchaValid(valid: boolean) {
    this.customCaptchaValid.set(valid);
  }

  onCustomCaptchaToken(token: string | null) {
    this.customCaptchaToken.set(token);
  }

  onImagenUploaded(event: { filename: string; url: string }) {
    this.imagenUrl = event.url;
  }

  onImagenRemoved() {
    this.imagenUrl = null;
  }

  onSubmit() {
    if (this.loading || !this.especialidadesValidas) return;
    this.loading = true;
    this.error = "";

    // Construir array de especialidades (excluir "Otra" y agregar la personalizada si existe)
    const especialidades = this.especialidadesSeleccionadas
      .filter((e) => e !== "Otra")
      .map((e) => e.trim());
    
    if (this.tieneOtraEspecialidad && this.otraEspecialidad.trim()) {
      especialidades.push(this.otraEspecialidad.trim());
    }

    // El backend espera role: "SPECIALIST" en el registro
    this.auth
      .register({
        nombre: this.nombre,
        apellido: this.apellido,
        dni: this.dni,
        edad: this.edad,
        email: this.email,
        password: this.password,
        role: "SPECIALIST", // Especificamos que es especialista
        especialista: {
          especialidades: especialidades,
          imagen: this.imagenUrl || undefined,
        },
      } as any)
      .subscribe({
        next: () => {
          this.loading = false;
          this.router.navigateByUrl("/login");
        },
        error: () => {
          this.loading = false;
          this.error = "No se pudo registrar el especialista. Verificá los datos.";
        },
      });
  }
}
