import { Component, inject, signal, ViewChild, ElementRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { AuthService } from "../../../services/auth.service";
import { RecaptchaComponent } from "../../../shared/recaptcha/recaptcha.component";
import { CustomCaptchaDirective } from "../../../directives/custom-captcha.directive";
import { ImageUploadComponent } from "../../../shared/image-upload/image-upload.component";

@Component({
  selector: "app-register",
  standalone: true,
  imports: [CommonModule, FormsModule, RecaptchaComponent, CustomCaptchaDirective, ImageUploadComponent],
  template: `
    <main class="auth-container">
      <section class="card">
        <h1>Registro de paciente</h1>

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
            Obra Social
            <input
              type="text"
              name="obraSocial"
              [(ngModel)]="obraSocial"
              required
              placeholder="Ej: OSDE, Swiss Medical, etc."
            />
          </label>

          <!-- Imágenes de perfil (opcional) -->
          <div class="images-row">
            <app-image-upload
              label="Imagen 1 (opcional)"
              [currentImageUrl]="imagenUnoUrl"
              [disabled]="loading"
              (imageUploaded)="onImagenUnoUploaded($event)"
              (imageRemoved)="onImagenUnoRemoved()"
            />
            <app-image-upload
              label="Imagen 2 (opcional)"
              [currentImageUrl]="imagenDosUrl"
              [disabled]="loading"
              (imageUploaded)="onImagenDosUploaded($event)"
              (imageRemoved)="onImagenDosRemoved()"
            />
          </div>

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

          <button type="submit" [disabled]="form.invalid || loading || !captchaToken() || !customCaptchaValid()">
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
      border-color: #2563eb;
      box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.2);
    }
    button {
      margin-top: 0.5rem;
      padding: 0.65rem 0.75rem;
      border-radius: 0.6rem;
      border: none;
      background: linear-gradient(90deg, #16a34a, #15803d);
      color: white;
      font-weight: 600;
      cursor: pointer;
      font-size: 0.95rem;
      transition: transform 0.1s ease, box-shadow 0.1s ease, opacity 0.1s ease;
      box-shadow: 0 12px 24px rgba(22, 163, 74, 0.35);
    }
    button:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 16px 32px rgba(22, 163, 74, 0.45);
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
    .images-row {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }
    @media (max-width: 640px) {
      .row {
        flex-direction: column;
      }
      .images-row {
        flex-direction: column;
      }
    }
  `,
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  // Google reCAPTCHA site key (configurar en producción)
  // Para desarrollo, usar: "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI" (sitio de prueba de Google)
  recaptchaSiteKey = "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"; // Site key de prueba
  recaptchaEnabled = signal(true); // Se puede deshabilitar si es necesario
  captchaToken = signal<string | null>(null);

  // Captcha propio (Sprint 5)
  customCaptchaEnabled = signal(true); // Se puede deshabilitar
  customCaptchaValid = signal(false);
  customCaptchaToken = signal<string | null>(null);

  nombre = "";
  apellido = "";
  dni = "";
  edad = 18;
  obraSocial = "";
  email = "";
  password = "";
  loading = false;
  error = "";
  
  // URLs de imágenes subidas
  imagenUnoUrl: string | null = null;
  imagenDosUrl: string | null = null;

  onCaptchaValid(token: string | null) {
    this.captchaToken.set(token);
  }

  onCustomCaptchaValid(valid: boolean) {
    this.customCaptchaValid.set(valid);
  }

  onCustomCaptchaToken(token: string | null) {
    this.customCaptchaToken.set(token);
  }

  onImagenUnoUploaded(event: { filename: string; url: string }) {
    this.imagenUnoUrl = event.url;
  }

  onImagenUnoRemoved() {
    this.imagenUnoUrl = null;
  }

  onImagenDosUploaded(event: { filename: string; url: string }) {
    this.imagenDosUrl = event.url;
  }

  onImagenDosRemoved() {
    this.imagenDosUrl = null;
  }

  onSubmit() {
    if (this.loading) return;
    this.loading = true;
    this.error = "";

    this.auth
      .register({
        nombre: this.nombre,
        apellido: this.apellido,
        dni: this.dni,
        edad: this.edad,
        email: this.email,
        password: this.password,
        role: "PATIENT", // Especificamos que es paciente
        paciente: {
          obraSocial: this.obraSocial,
          imagenUno: this.imagenUnoUrl || undefined,
          imagenDos: this.imagenDosUrl || undefined,
        },
      } as any)
      .subscribe({
        next: () => {
          this.loading = false;
          this.router.navigateByUrl("/login");
        },
        error: () => {
          this.loading = false;
          this.error = "No se pudo registrar el usuario. Verificá los datos.";
        },
      });
  }
}
