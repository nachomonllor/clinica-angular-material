import { Component, inject, OnInit, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { HttpClient } from "@angular/common/http";
import { MedicalRecordsService } from "../../../services/medical-records.service";
import { exportToExcel, generateFilename } from "../../../utils/excel.util";
import { generateMedicalHistoryPDF } from "../../../utils/pdf.util";
import { CustomCaptchaDirective } from "../../../directives/custom-captcha.directive";
import { ImageUploadComponent } from "../../../shared/image-upload/image-upload.component";
import type { User, UserStatus, UserRole } from "../../../models/user.model";
import type { MedicalRecord } from "../../../models/appointment.model";
import { API_BASE_URL } from "../../../utils/api-config";

@Component({
  selector: "app-admin-users",
  standalone: true,
  imports: [CommonModule, FormsModule, CustomCaptchaDirective, ImageUploadComponent],
  template: `
    <main class="page">
      <section class="card">
        <header class="card-header">
          <div>
            <h1>Usuarios</h1>
            <p class="subtitle">Gestioná los usuarios de la clínica</p>
          </div>
          <div class="header-actions">
            <button class="btn secondary" (click)="descargarExcel()" [disabled]="loading || users.length === 0">
              {{ loadingExcel ? "Generando..." : "Descargar Excel" }}
            </button>
            <button class="btn primary" (click)="toggleCreate()">
              {{ showCreate ? "Cerrar" : "Nuevo usuario" }}
            </button>
          </div>
        </header>

        <section *ngIf="showCreate" class="create-section">
          <h2>Crear nuevo usuario</h2>

          <form (ngSubmit)="onCreate()" #form="ngForm" class="create-form">
            <div class="row">
              <label>
                Rol
                <select
                  name="role"
                  [(ngModel)]="formRole"
                  required
                >
                  <option value="" disabled>Seleccioná un rol</option>
                  <option value="PATIENT">Paciente</option>
                  <option value="SPECIALIST">Especialista</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </label>

              <label>
                Nombre
                <input
                  type="text"
                  name="nombre"
                  [(ngModel)]="formNombre"
                  required
                />
              </label>

              <label>
                Apellido
                <input
                  type="text"
                  name="apellido"
                  [(ngModel)]="formApellido"
                  required
                />
              </label>
            </div>

            <div class="row">
              <label>
                DNI
                <input
                  type="text"
                  name="dni"
                  [(ngModel)]="formDni"
                  required
                />
              </label>

              <label>
                Edad
                <input
                  type="number"
                  name="edad"
                  [(ngModel)]="formEdad"
                  required
                  min="0"
                />
              </label>

              <label *ngIf="formRole === 'PATIENT'">
                Obra social
                <input
                  type="text"
                  name="obraSocial"
                  [(ngModel)]="formObraSocial"
                  required
                  placeholder="Ej: OSDE, Swiss Medical..."
                />
              </label>

              <label *ngIf="formRole === 'SPECIALIST'">
                Especialidades
                <input
                  type="text"
                  name="especialidades"
                  [(ngModel)]="formEspecialidades"
                  required
                  placeholder="Ej: Cardiología, Pediatría"
                />
                <small class="hint">
                  Separá por coma si son varias.
                </small>
              </label>
            </div>

            <div class="row">
              <label>
                Email
                <input
                  type="email"
                  name="email"
                  [(ngModel)]="formEmail"
                  required
                  autocomplete="email"
                />
              </label>

              <label>
                Contraseña
                <input
                  type="password"
                  name="password"
                  [(ngModel)]="formPassword"
                  required
                  minlength="6"
                  autocomplete="new-password"
                />
              </label>
            </div>

            <!-- Imágenes según el rol -->
            <div *ngIf="formRole === 'PATIENT'" class="images-row">
              <app-image-upload
                label="Imagen 1 (opcional)"
                [currentImageUrl]="formImagenUnoUrl"
                [disabled]="creating"
                (imageUploaded)="onFormImagenUnoUploaded($event)"
                (imageRemoved)="onFormImagenUnoRemoved()"
              />
              <app-image-upload
                label="Imagen 2 (opcional)"
                [currentImageUrl]="formImagenDosUrl"
                [disabled]="creating"
                (imageUploaded)="onFormImagenDosUploaded($event)"
                (imageRemoved)="onFormImagenDosRemoved()"
              />
            </div>

            <div *ngIf="formRole === 'SPECIALIST' || formRole === 'ADMIN'">
              <app-image-upload
                label="Imagen de perfil (opcional)"
                [currentImageUrl]="formImagenUrl"
                [disabled]="creating"
                (imageUploaded)="onFormImagenUploaded($event)"
                (imageRemoved)="onFormImagenRemoved()"
              />
            </div>

            <div 
              appCustomCaptcha
              [enabled]="customCaptchaEnabled()"
              [difficulty]="'easy'"
              (captchaValid)="onCustomCaptchaValid($event)"
              (captchaToken)="onCustomCaptchaToken($event)"
            ></div>

            <div class="actions">
              <button
                type="button"
                class="btn secondary"
                (click)="cancelCreate()"
              >
                Cancelar
              </button>
              <button
                type="submit"
                class="btn primary"
                [disabled]="form.invalid || creating || !customCaptchaValid()"
              >
                {{ creating ? "Guardando..." : "Guardar usuario" }}
              </button>
            </div>

            <p class="error" *ngIf="createError">
              {{ createError }}
            </p>
          </form>
        </section>

        <div *ngIf="loading" class="loading">
          Cargando usuarios...
        </div>

        <p *ngIf="error" class="error">
          {{ error }}
        </p>

        <table class="table" *ngIf="!loading && users.length > 0">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th style="width: 280px">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let u of users; trackBy: trackByUserId">
              <td>{{ u.nombre }} {{ u.apellido }}</td>
              <td>{{ u.email }}</td>
              <td>{{ u.role }}</td>
              <td>
                <span
                  class="badge"
                  [class.badge-pending]="u.status === 'PENDING'"
                  [class.badge-approved]="u.status === 'APPROVED'"
                  [class.badge-rejected]="u.status === 'REJECTED'"
                >
                  {{ u.status }}
                </span>
              </td>
              <td>
                <div class="actions-cell">
                  <button
                    class="btn small"
                    [disabled]="u.status === 'APPROVED'"
                    (click)="changeStatus(u, 'APPROVED')"
                  >
                    Aprobar
                  </button>
                  <button
                    class="btn small secondary"
                    [disabled]="u.status === 'REJECTED'"
                    (click)="changeStatus(u, 'REJECTED')"
                  >
                    Rechazar
                  </button>
                  <button
                    *ngIf="u.role === 'PATIENT'"
                    class="btn small"
                    (click)="verHistoriaClinica(u)"
                  >
                    Ver Historia
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <p *ngIf="!loading && !error && users.length === 0" class="empty">
          No hay usuarios para mostrar.
        </p>
      </section>
    </main>

    <!-- Modal Historia Clínica -->
    <div *ngIf="showMedicalHistoryDialog()" class="dialog-overlay" (click)="closeMedicalHistoryDialog()">
      <div class="dialog large" (click)="$event.stopPropagation()">
        <div class="dialog-header">
          <h2>Historia Clínica - {{ selectedPatient()?.nombre }} {{ selectedPatient()?.apellido }}</h2>
          <div class="dialog-header-actions">
            <button 
              class="btn small" 
              (click)="descargarPDF()" 
              [disabled]="loadingMedicalHistory() || patientMedicalRecords().length === 0"
            >
              {{ descargandoPDF() ? "Generando..." : "Descargar PDF" }}
            </button>
            <button class="btn-icon" (click)="closeMedicalHistoryDialog()">✕</button>
          </div>
        </div>

        <div *ngIf="loadingMedicalHistory()" class="loading">Cargando historia clínica...</div>

        <div *ngIf="!loadingMedicalHistory() && patientMedicalRecords().length === 0" class="empty">
          Este paciente no tiene registros médicos aún.
        </div>

        <div *ngIf="!loadingMedicalHistory() && patientMedicalRecords().length > 0" class="medical-records-list">
          <div *ngFor="let record of patientMedicalRecords()" class="record-card">
            <div class="record-header">
              <div>
                <h3>{{ record.appointment.especialidad.nombre }}</h3>
                <p class="record-date">
                  {{ formatDate(record.appointment.slot.date) }} - {{ formatTime(record.appointment.slot.startAt) }}
                </p>
              </div>
            </div>

            <div class="record-details">
              <div class="record-section">
                <h4>Especialista</h4>
                <p>Dr/a. {{ record.especialista.user.nombre }} {{ record.especialista.user.apellido }}</p>
              </div>

              <div class="record-section">
                <h4>Datos de la consulta</h4>
                <div class="data-grid">
                  <div class="data-item">
                    <strong>Altura:</strong> {{ record.altura }} cm
                  </div>
                  <div class="data-item">
                    <strong>Peso:</strong> {{ record.peso }} kg
                  </div>
                  <div class="data-item">
                    <strong>Temperatura:</strong> {{ record.temperatura }} °C
                  </div>
                  <div class="data-item">
                    <strong>Presión:</strong> {{ record.presion }}
                  </div>
                </div>
              </div>

              <div class="record-section" *ngIf="record.extraData && record.extraData.length > 0">
                <h4>Datos adicionales</h4>
                <div class="extra-data-list">
                  <div *ngFor="let extra of record.extraData" class="extra-data-item">
                    <strong>{{ extra.clave }}:</strong> {{ extra.valor }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: `
    .page {
      min-height: 100vh;
      background: #f4f7fb;
      padding: 2rem;
    }
    .card {
      max-width: 1100px;
      margin: 0 auto;
      background: #fff;
      border-radius: 1rem;
      box-shadow: 0 18px 45px rgba(15, 23, 42, 0.12);
      overflow: hidden;
    }
    .card-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }
    .header-actions {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }
    h1 {
      margin: 0;
      font-size: 1.4rem;
      color: #0f172a;
    }
    .subtitle {
      margin: 0.15rem 0 0;
      font-size: 0.85rem;
      color: #64748b;
    }
    .create-section {
      padding: 1.25rem 1.5rem 0.5rem;
      border-bottom: 1px solid #e2e8f0;
      background: #f8fafc;
    }
    .create-section h2 {
      margin: 0 0 0.75rem;
      font-size: 1rem;
      color: #0f172a;
    }
    .create-form {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    .images-row {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }
    label {
      flex: 1;
      min-width: 180px;
      display: flex;
      flex-direction: column;
      font-size: 0.85rem;
      color: #475569;
      gap: 0.25rem;
    }
    input,
    select {
      padding: 0.55rem 0.75rem;
      border-radius: 0.5rem;
      border: 1px solid #cbd5f5;
      font-size: 0.9rem;
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
      background: #fff;
    }
    input:focus,
    select:focus {
      border-color: #2563eb;
      box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.14);
    }
    .hint {
      font-size: 0.75rem;
      color: #94a3b8;
    }
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
    .table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
    }
    th,
    td {
      padding: 0.75rem 1rem;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
      color: #0f172a;
      font-size: 0.9rem;
    }
    td {
      min-width: 100px;
    }
    th {
      background: #f8fafc;
      font-weight: 600;
      color: #475569;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .badge {
      padding: 0.25rem 0.55rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      display: inline-block;
    }
    .badge-pending {
      background: #fef9c3;
      color: #854d0e;
    }
    .badge-approved {
      background: #dcfce7;
      color: #166534;
    }
    .badge-rejected {
      background: #fee2e2;
      color: #b91c1c;
    }
    .btn {
      border: none;
      border-radius: 999px;
      padding: 0.4rem 0.9rem;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      background: #2563eb;
      color: #fff;
      margin-right: 0.2rem;
      transition: background 0.15s, transform 0.1s, box-shadow 0.1s;
      box-shadow: 0 8px 18px rgba(37, 99, 235, 0.35);
      white-space: nowrap;
    }
    .btn.primary {
      background: linear-gradient(90deg, #2563eb, #1d4ed8);
    }
    .btn.secondary {
      background: #64748b;
      box-shadow: none;
    }
    .btn.small {
      padding: 0.3rem 0.7rem;
      box-shadow: none;
    }
    .btn:disabled {
      opacity: 0.55;
      cursor: default;
      box-shadow: none;
    }
    .btn:not(:disabled):hover {
      transform: translateY(-1px);
    }
    .empty {
      padding: 1.5rem;
      text-align: center;
      color: #64748b;
      font-size: 0.9rem;
    }
    .loading {
      padding: 1.5rem;
      text-align: center;
      color: #64748b;
      font-size: 0.9rem;
    }
    .error {
      margin: 1rem 1.5rem;
      padding: 0.75rem;
      background: #fee2e2;
      border: 1px solid #fecaca;
      border-radius: 0.5rem;
      color: #b91c1c;
      font-size: 0.85rem;
      text-align: center;
    }
    .actions-cell {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
    }
    /* Estilos para Modal Historia Clínica */
    .dialog-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }
    .dialog {
      background: white;
      border-radius: 1rem;
      max-width: 800px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }
    .dialog.large {
      max-width: 1000px;
    }
    .dialog-header {
      padding: 1.5rem 2rem;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      background: white;
      z-index: 10;
    }
    .dialog-header-actions {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }
    .dialog-header h2 {
      margin: 0;
      font-size: 1.5rem;
      color: #0f172a;
    }
    .btn-icon {
      border: none;
      background: transparent;
      font-size: 1.5rem;
      color: #64748b;
      cursor: pointer;
      padding: 0.25rem 0.5rem;
      border-radius: 0.5rem;
      transition: all 0.15s;
    }
    .btn-icon:hover {
      background: #f1f5f9;
      color: #0f172a;
    }
    .medical-records-list {
      padding: 1.5rem 2rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .record-card {
      padding: 1.5rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      background: #f8fafc;
      transition: all 0.15s;
    }
    .record-card:hover {
      border-color: #cbd5e1;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }
    .record-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }
    .record-header h3 {
      margin: 0 0 0.25rem;
      font-size: 1.2rem;
      color: #0f172a;
    }
    .record-date {
      margin: 0;
      color: #64748b;
      font-size: 0.9rem;
    }
    .record-details {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .record-section {
      padding: 1rem;
      background: white;
      border-radius: 0.5rem;
      border: 1px solid #e2e8f0;
    }
    .record-section h4 {
      margin: 0 0 0.75rem;
      font-size: 1rem;
      color: #0f172a;
      font-weight: 600;
    }
    .record-section p {
      margin: 0;
      color: #475569;
      font-size: 0.95rem;
    }
    .data-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
    }
    .data-item {
      padding: 0.5rem;
      background: #f8fafc;
      border-radius: 0.5rem;
      font-size: 0.9rem;
      color: #475569;
    }
    .data-item strong {
      color: #0f172a;
      margin-right: 0.5rem;
    }
    .extra-data-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .extra-data-item {
      padding: 0.5rem;
      background: #f8fafc;
      border-radius: 0.5rem;
      font-size: 0.9rem;
      color: #475569;
    }
    .extra-data-item strong {
      color: #0f172a;
      margin-right: 0.5rem;
    }
    @media (max-width: 768px) {
      .page {
        padding: 1rem;
      }
      .card {
        border-radius: 0.75rem;
      }
      .card-header {
        flex-direction: column;
        align-items: flex-start;
      }
      .actions {
        flex-direction: column;
        align-items: stretch;
      }
      .btn {
        width: 100%;
        justify-content: center;
        text-align: center;
      }
      th,
      td {
        padding: 0.5rem 0.75rem;
      }
      .data-grid {
        grid-template-columns: 1fr;
      }
      .dialog {
        max-width: 95vw;
        max-height: 95vh;
      }
      .dialog-header {
        padding: 1rem 1.5rem;
      }
      .medical-records-list {
        padding: 1rem 1.5rem;
      }
    }
  `,
})
export class AdminUsersComponent implements OnInit {
  private http = inject(HttpClient);
  private medicalRecordsService = inject(MedicalRecordsService);

  users: User[] = [];
  loading = false;
  error = "";
  loadingExcel = false;

  showCreate = false;
  creating = false;
  createError = "";

  // Captcha propio (Sprint 5)
  customCaptchaEnabled = signal(true); // Se puede deshabilitar
  customCaptchaValid = signal(false);
  customCaptchaToken = signal<string | null>(null);

  // Historia Clínica
  selectedPatient = signal<User | null>(null);
  patientMedicalRecords = signal<MedicalRecord[]>([]);
  loadingMedicalHistory = signal(false);
  showMedicalHistoryDialog = signal(false);
  descargandoPDF = signal(false);

  formRole: UserRole | "" = "";
  formNombre = "";
  formApellido = "";
  formDni = "";
  formEdad = 18;
  formObraSocial = "";
  formEspecialidades = "";
  formEmail = "";
  formPassword = "";
  
  // URLs de imágenes para el formulario
  formImagenUnoUrl: string | null = null;
  formImagenDosUrl: string | null = null;
  formImagenUrl: string | null = null;

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.error = "";
    this.http
      .get<User[]>(`${API_BASE_URL}/admin/users`)
      .subscribe({
        next: (data) => {
          this.users = data || [];
          this.loading = false;
        },
        error: (error) => {
          console.error("[AdminUsers] Error al cargar usuarios:", error);
          this.error = "Error al cargar usuarios. Verificá la conexión con el backend.";
          this.loading = false;
          this.users = [];
        },
      });
  }

  toggleCreate() {
    this.showCreate = !this.showCreate;
    if (!this.showCreate) {
      this.resetForm();
    }
  }

  cancelCreate() {
    this.showCreate = false;
    this.resetForm();
  }

  resetForm() {
    this.formRole = "";
    this.formNombre = "";
    this.formApellido = "";
    this.formDni = "";
    this.formEdad = 18;
    this.formObraSocial = "";
    this.formEspecialidades = "";
    this.formEmail = "";
    this.formPassword = "";
    this.formImagenUnoUrl = null;
    this.formImagenDosUrl = null;
    this.formImagenUrl = null;
    this.createError = "";
    // Reset captcha propio
    this.customCaptchaValid.set(false);
    this.customCaptchaToken.set(null);
  }

  onFormImagenUnoUploaded(event: { filename: string; url: string }) {
    this.formImagenUnoUrl = event.url;
  }

  onFormImagenUnoRemoved() {
    this.formImagenUnoUrl = null;
  }

  onFormImagenDosUploaded(event: { filename: string; url: string }) {
    this.formImagenDosUrl = event.url;
  }

  onFormImagenDosRemoved() {
    this.formImagenDosUrl = null;
  }

  onFormImagenUploaded(event: { filename: string; url: string }) {
    this.formImagenUrl = event.url;
  }

  onFormImagenRemoved() {
    this.formImagenUrl = null;
  }

  onCustomCaptchaValid(valid: boolean) {
    this.customCaptchaValid.set(valid);
  }

  onCustomCaptchaToken(token: string | null) {
    this.customCaptchaToken.set(token);
  }

  onCreate() {
    if (!this.formRole) return;

    this.creating = true;
    this.createError = "";

    const payload: any = {
      role: this.formRole,
      nombre: this.formNombre,
      apellido: this.formApellido,
      dni: this.formDni,
      edad: this.formEdad,
      email: this.formEmail,
      password: this.formPassword,
    };

    if (this.formRole === "PATIENT") {
      payload.paciente = {
        obraSocial: this.formObraSocial,
        imagenUno: this.formImagenUnoUrl || undefined,
        imagenDos: this.formImagenDosUrl || undefined,
      };
    }

    if (this.formRole === "SPECIALIST") {
      const especialidades = this.formEspecialidades
        .split(",")
        .map((e) => e.trim())
        .filter((e) => !!e);

      payload.especialista = {
        especialidades,
        imagen: this.formImagenUrl || undefined,
      };
    }

    if (this.formRole === "ADMIN") {
      payload.admin = {
        imagen: this.formImagenUrl || undefined,
      };
    }

    this.http
      .post<User>(`${API_BASE_URL}/admin/users`, payload, {
      })
      .subscribe({
        next: (newUser) => {
          this.creating = false;
          this.users = [...this.users, newUser];
          this.cancelCreate();
        },
        error: () => {
          this.creating = false;
          this.createError =
            "No se pudo crear el usuario. Verificá los datos o el email (puede estar repetido).";
        },
      });
  }

  trackByUserId(index: number, user: User): string {
    return user.id;
  }

  changeStatus(user: User, status: UserStatus) {
    this.http
      .patch(
        `${API_BASE_URL}/admin/users/${user.id}/status`,
        { status },
        { withCredentials: true },
      )
      .subscribe({
        next: () => {
          user.status = status;
        },
        error: (err) => {
          console.error("Error al cambiar estado:", err);
          alert("Error al cambiar estado del usuario.");
        },
      });
  }

  // Métodos para Historia Clínica
  verHistoriaClinica(user: User) {
    this.selectedPatient.set(user);
    this.showMedicalHistoryDialog.set(true);
    this.loadingMedicalHistory.set(true);
    this.patientMedicalRecords.set([]);

    this.medicalRecordsService.getPatientRecords(user.id).subscribe({
      next: (records) => {
        this.patientMedicalRecords.set(records);
        this.loadingMedicalHistory.set(false);
      },
      error: (error) => {
        console.error("[AdminUsers] Error al cargar historia clínica:", error);
        this.loadingMedicalHistory.set(false);
        alert("Error al cargar la historia clínica del paciente.");
      },
    });
  }

  closeMedicalHistoryDialog() {
    this.showMedicalHistoryDialog.set(false);
    this.selectedPatient.set(null);
    this.patientMedicalRecords.set([]);
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  formatTime(dateTimeStr: string): string {
    return new Date(dateTimeStr).toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  async descargarPDF() {
    const paciente = this.selectedPatient();
    const records = this.patientMedicalRecords();

    if (!paciente || !paciente.paciente || records.length === 0) {
      alert("No hay registros médicos para generar el PDF.");
      return;
    }

    this.descargandoPDF.set(true);

    try {
      await generateMedicalHistoryPDF({
        paciente: paciente as User & { paciente: { obraSocial: string } },
        records,
      });
    } catch (error) {
      console.error("[AdminUsers] Error al generar PDF:", error);
      alert("Error al generar el PDF. Intentá nuevamente.");
    } finally {
      this.descargandoPDF.set(false);
    }
  }

  descargarExcel() {
    if (this.users.length === 0) {
      alert("No hay usuarios para exportar.");
      return;
    }

    this.loadingExcel = true;

    try {
      // Preparar datos para Excel
      const datosExcel = this.users.map((user) => {
        const row: Record<string, any> = {
          Nombre: user.nombre,
          Apellido: user.apellido,
          Email: user.email,
          DNI: user.dni,
          Edad: user.edad,
          Rol: this.getRoleLabel(user.role),
          Estado: this.getStatusLabel(user.status),
        };

        // Agregar Obra Social si es paciente
        if (user.role === "PATIENT" && user.paciente?.obraSocial) {
          row["Obra Social"] = user.paciente.obraSocial;
        }

        // Agregar Especialidades si es especialista
        if (user.role === "SPECIALIST" && user.especialista?.especialidades) {
          row["Especialidades"] = user.especialista.especialidades.join(", ");
        }

        return row;
      });

      // Generar y descargar Excel
      const filename = generateFilename("usuarios");
      exportToExcel(datosExcel, {
        filename,
        sheetName: "Usuarios",
      });

      this.loadingExcel = false;
    } catch (error) {
      console.error("[AdminUsers] Error al generar Excel:", error);
      alert("Error al generar el archivo Excel. Intentá nuevamente.");
      this.loadingExcel = false;
    }
  }

  getRoleLabel(role: UserRole): string {
    const labels: Record<UserRole, string> = {
      PATIENT: "Paciente",
      SPECIALIST: "Especialista",
      ADMIN: "Administrador",
    };
    return labels[role] || role;
  }

  getStatusLabel(status: UserStatus): string {
    const labels: Record<UserStatus, string> = {
      PENDING: "Pendiente",
      APPROVED: "Aprobado",
      REJECTED: "Rechazado",
    };
    return labels[status] || status;
  }
}
