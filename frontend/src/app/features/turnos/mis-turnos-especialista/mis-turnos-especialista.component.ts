import { Component, OnInit, OnDestroy, signal, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from "@angular/forms";
import { RouterModule, Router } from "@angular/router";
import { Subject } from "rxjs";
import { debounceTime, distinctUntilChanged } from "rxjs/operators";
import { AppointmentsService } from "../../../services/appointments.service";
import { AuthService } from "../../../services/auth.service";
import type { Appointment, AppointmentStatus } from "../../../models/appointment.model";
import type { MedicalExtraField } from "../../../models/appointment.model";

@Component({
  selector: "app-mis-turnos-especialista",
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  template: `
    <main class="page">
      <section class="card">
        <header class="card-header">
          <h1>Mis Turnos</h1>
          <p class="subtitle">Gestioná los turnos asignados</p>
        </header>

        <div class="toolbar">
          <input
            type="text"
            class="search-input"
            placeholder="Buscar por especialidad o paciente..."
            [(ngModel)]="filtroTexto"
            (ngModelChange)="onSearchChange()"
          />
        </div>

        <div *ngIf="appointments().length === 0 && !loading()" class="empty">
          No tenés turnos asignados.
        </div>

        <div *ngIf="loading()" class="loading">Cargando turnos...</div>

        <div *ngIf="appointments().length > 0" class="appointments-list">
          <div *ngFor="let app of appointments()" class="appointment-card">
            <div class="appointment-header">
              <div>
                <h3>{{ app.especialidad.nombre }}</h3>
                <p class="appointment-date">
                  {{ formatDate(app.slot.date) }} - {{ formatTime(app.slot.startAt) }}
                </p>
              </div>
              <span class="badge" [class]="'badge-' + app.status.toLowerCase()">
                {{ getStatusLabel(app.status) }}
              </span>
            </div>

            <div class="appointment-details">
              <p><strong>Paciente:</strong> {{ app.paciente.nombre }} {{ app.paciente.apellido }}</p>
            </div>

            <div class="appointment-actions">
              <!-- Aceptar: Solo visible si no está Aceptado, Realizado, Cancelado o Rechazado -->
              <button
                *ngIf="puedeAceptar(app)"
                class="btn small primary"
                (click)="aceptarTurno(app)"
              >
                Aceptar
              </button>

              <!-- Rechazar: Solo visible si no está Aceptado, Realizado o Cancelado -->
              <button
                *ngIf="puedeRechazar(app)"
                class="btn small secondary"
                (click)="rechazarTurno(app)"
              >
                Rechazar
              </button>

              <!-- Cancelar: Solo visible si no está Aceptado, Realizado o Rechazado -->
              <button
                *ngIf="puedeCancelar(app)"
                class="btn small secondary"
                (click)="cancelarTurno(app)"
              >
                Cancelar
              </button>

              <!-- Finalizar: Solo visible si fue Aceptado -->
              <button
                *ngIf="app.status === 'ACCEPTED'"
                class="btn small primary"
                (click)="finalizarTurno(app)"
              >
                Finalizar
              </button>

              <!-- Ver Reseña: Solo visible si tiene reseña -->
              <button
                *ngIf="app.specialistReview || app.patientComment"
                class="btn small"
                (click)="verResena(app)"
              >
                Ver Reseña
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Dialog para cancelar turno -->
    <div *ngIf="showCancelDialog()" class="dialog-overlay" (click)="closeCancelDialog()">
      <div class="dialog" (click)="$event.stopPropagation()">
        <h3>Cancelar turno</h3>
        <p>¿Por qué cancelás el turno?</p>
        <textarea
          [(ngModel)]="cancelNote"
          placeholder="Ingresá el motivo de cancelación (mínimo 10 caracteres)"
          rows="4"
          class="textarea"
        ></textarea>
        <div class="dialog-actions">
          <button class="btn secondary" (click)="closeCancelDialog()">Cancelar</button>
          <button
            class="btn primary"
            (click)="confirmarCancelar()"
            [disabled]="!cancelNote || cancelNote.trim().length < 10"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>

    <!-- Dialog para rechazar turno -->
    <div *ngIf="showRejectDialog()" class="dialog-overlay" (click)="closeRejectDialog()">
      <div class="dialog" (click)="$event.stopPropagation()">
        <h3>Rechazar turno</h3>
        <p>¿Por qué rechazás el turno?</p>
        <textarea
          [(ngModel)]="rejectNote"
          placeholder="Ingresá el motivo de rechazo (mínimo 10 caracteres)"
          rows="4"
          class="textarea"
        ></textarea>
        <div class="dialog-actions">
          <button class="btn secondary" (click)="closeRejectDialog()">Cancelar</button>
          <button
            class="btn primary"
            (click)="confirmarRechazar()"
            [disabled]="!rejectNote || rejectNote.trim().length < 10"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>

    <!-- Dialog para ver reseña -->
    <div *ngIf="showReviewDialog()" class="dialog-overlay" (click)="closeReviewDialog()">
      <div class="dialog" (click)="$event.stopPropagation()">
        <h3>Reseñas</h3>
        <div *ngIf="selectedAppointment()?.specialistReview" class="review-section">
          <h4>Tu reseña:</h4>
          <p class="review-text">{{ selectedAppointment()!.specialistReview }}</p>
        </div>
        <div *ngIf="selectedAppointment()?.patientComment" class="review-section">
          <h4>Comentario del paciente:</h4>
          <p class="review-text">{{ selectedAppointment()!.patientComment }}</p>
        </div>
        <div class="dialog-actions">
          <button class="btn primary" (click)="closeReviewDialog()">Cerrar</button>
        </div>
      </div>
    </div>

    <!-- Dialog para finalizar turno (historia clínica) -->
    <div *ngIf="showFinalizeDialog()" class="dialog-overlay" (click)="closeFinalizeDialog()">
      <div class="dialog large" (click)="$event.stopPropagation()">
        <h3>Finalizar Turno - Historia Clínica</h3>
        <form [formGroup]="historyForm" (ngSubmit)="confirmarFinalizar()">
          <div class="form-grid">
            <label>
              Altura (cm)
              <input
                type="number"
                formControlName="altura"
                min="30"
                max="300"
                required
                [class.error]="historyForm.get('altura')?.invalid && historyForm.get('altura')?.touched"
              />
              <span *ngIf="historyForm.get('altura')?.invalid && historyForm.get('altura')?.touched" class="error-message">
                <span *ngIf="historyForm.get('altura')?.errors?.['required']">La altura es requerida</span>
                <span *ngIf="historyForm.get('altura')?.errors?.['min']">La altura mínima es 30 cm</span>
                <span *ngIf="historyForm.get('altura')?.errors?.['max']">La altura máxima es 300 cm</span>
              </span>
            </label>
            <label>
              Peso (kg)
              <input
                type="number"
                formControlName="peso"
                min="1"
                max="500"
                required
                [class.error]="historyForm.get('peso')?.invalid && historyForm.get('peso')?.touched"
              />
              <span *ngIf="historyForm.get('peso')?.invalid && historyForm.get('peso')?.touched" class="error-message">
                <span *ngIf="historyForm.get('peso')?.errors?.['required']">El peso es requerido</span>
                <span *ngIf="historyForm.get('peso')?.errors?.['min']">El peso mínimo es 1 kg</span>
                <span *ngIf="historyForm.get('peso')?.errors?.['max']">El peso máximo es 500 kg</span>
              </span>
            </label>
            <label>
              Temperatura (°C)
              <input
                type="number"
                formControlName="temperatura"
                min="30"
                max="45"
                step="0.1"
                required
                [class.error]="historyForm.get('temperatura')?.invalid && historyForm.get('temperatura')?.touched"
              />
              <span *ngIf="historyForm.get('temperatura')?.invalid && historyForm.get('temperatura')?.touched" class="error-message">
                <span *ngIf="historyForm.get('temperatura')?.errors?.['required']">La temperatura es requerida</span>
                <span *ngIf="historyForm.get('temperatura')?.errors?.['min']">La temperatura mínima es 30°C</span>
                <span *ngIf="historyForm.get('temperatura')?.errors?.['max']">La temperatura máxima es 45°C</span>
              </span>
            </label>
            <label>
              Presión
              <input
                type="text"
                formControlName="presion"
                placeholder="Ej: 120/80"
                required
                [class.error]="historyForm.get('presion')?.invalid && historyForm.get('presion')?.touched"
              />
              <span *ngIf="historyForm.get('presion')?.invalid && historyForm.get('presion')?.touched" class="error-message">
                La presión es requerida
              </span>
            </label>
          </div>

          <div class="extra-fields">
            <h4>Datos adicionales genéricos (opcional, máximo 3)</h4>
            <div *ngFor="let field of extraFields(); let i = index" class="extra-field-row">
              <input
                type="text"
                [(ngModel)]="field.clave"
                [ngModelOptions]="{ standalone: true }"
                placeholder="Clave"
                class="extra-input"
              />
              <input
                type="text"
                [(ngModel)]="field.valor"
                [ngModelOptions]="{ standalone: true }"
                placeholder="Valor"
                class="extra-input"
              />
              <button
                type="button"
                class="btn small secondary"
                (click)="removeExtraField(i)"
                *ngIf="extraFields().length > 0"
              >
                Eliminar
              </button>
            </div>
            <button
              type="button"
              class="btn small"
              (click)="addExtraField()"
              [disabled]="extraFields().length >= 3"
            >
              + Agregar campo genérico
            </button>
          </div>

          <div class="special-fields">
            <h4>Datos adicionales específicos (opcional)</h4>
            
            <!-- Control de rango (0-100) -->
            <div class="special-field">
              <label>
                <span>Control de rango (0-100)</span>
                <input
                  type="text"
                  [(ngModel)]="rangeFieldKey"
                  [ngModelOptions]="{ standalone: true }"
                  placeholder="Nombre del dato (ej: Nivel de dolor)"
                  class="special-input"
                />
                <div class="range-container">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    [(ngModel)]="rangeFieldValue"
                    [ngModelOptions]="{ standalone: true }"
                    class="range-input"
                  />
                  <span class="range-value">{{ rangeFieldValue() }}</span>
                </div>
              </label>
            </div>

            <!-- Cuadro de texto numérico -->
            <div class="special-field">
              <label>
                <span>Valor numérico</span>
                <input
                  type="text"
                  [(ngModel)]="numericFieldKey"
                  [ngModelOptions]="{ standalone: true }"
                  placeholder="Nombre del dato (ej: Glucosa en sangre)"
                  class="special-input"
                />
                <input
                  type="number"
                  [(ngModel)]="numericFieldValue"
                  [ngModelOptions]="{ standalone: true }"
                  placeholder="Ingresá el valor numérico"
                  class="special-input"
                />
              </label>
            </div>

            <!-- Switch Si/No -->
            <div class="special-field">
              <label>
                <span>Switch Si/No</span>
                <input
                  type="text"
                  [(ngModel)]="switchFieldKey"
                  [ngModelOptions]="{ standalone: true }"
                  placeholder="Nombre del dato (ej: Fiebre)"
                  class="special-input"
                />
                <div class="switch-container">
                  <label class="switch">
                    <input
                      type="checkbox"
                      [(ngModel)]="switchFieldValue"
                      [ngModelOptions]="{ standalone: true }"
                    />
                    <span class="slider"></span>
                  </label>
                  <span class="switch-label">{{ switchFieldValue() ? 'Sí' : 'No' }}</span>
                </div>
              </label>
            </div>
          </div>

          <label>
            Reseña/Comentario de la consulta (requerido)
            <textarea
              formControlName="specialistReview"
              rows="4"
              class="textarea"
              [class.error]="historyForm.get('specialistReview')?.invalid && historyForm.get('specialistReview')?.touched"
              placeholder="Ingresá la reseña o comentario de la consulta..."
              required
            ></textarea>
            <span *ngIf="historyForm.get('specialistReview')?.invalid && historyForm.get('specialistReview')?.touched" class="error-message">
              La reseña es requerida
            </span>
          </label>

          <div class="dialog-actions">
            <button type="button" class="btn secondary" (click)="closeFinalizeDialog()">
              Cancelar
            </button>
            <button
              type="submit"
              class="btn primary"
              [disabled]="historyForm.invalid"
            >
              Finalizar Turno
            </button>
          </div>
        </form>
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
      max-width: 1200px;
      margin: 0 auto;
      background: #fff;
      border-radius: 1rem;
      box-shadow: 0 18px 45px rgba(15, 23, 42, 0.12);
      overflow: hidden;
    }
    .card-header {
      padding: 1.5rem 2rem;
      border-bottom: 1px solid #e2e8f0;
    }
    h1 {
      margin: 0 0 0.25rem;
      font-size: 1.8rem;
      color: #0f172a;
    }
    .subtitle {
      margin: 0;
      color: #64748b;
      font-size: 0.95rem;
    }
    .toolbar {
      padding: 1.5rem 2rem;
      border-bottom: 1px solid #e2e8f0;
    }
    .search-input {
      width: 100%;
      padding: 0.65rem 0.75rem;
      border-radius: 0.5rem;
      border: 1px solid #cbd5e1;
      font-size: 0.95rem;
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .search-input:focus {
      border-color: #2563eb;
      box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.2);
    }
    .btn {
      padding: 0.65rem 1rem;
      border-radius: 0.5rem;
      border: none;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.15s;
    }
    .btn.primary {
      background: #2563eb;
      color: white;
      box-shadow: 0 8px 18px rgba(37, 99, 235, 0.35);
    }
    .btn.primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 12px 24px rgba(37, 99, 235, 0.45);
    }
    .btn.secondary {
      background: #64748b;
      color: white;
    }
    .btn.secondary:hover:not(:disabled) {
      background: #475569;
    }
    .btn.small {
      padding: 0.4rem 0.8rem;
      font-size: 0.85rem;
    }
    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .empty, .loading {
      padding: 3rem 2rem;
      text-align: center;
      color: #64748b;
      font-size: 1rem;
    }
    .appointments-list {
      padding: 1.5rem 2rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .appointment-card {
      padding: 1.25rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      background: #f8fafc;
      transition: all 0.15s;
    }
    .appointment-card:hover {
      border-color: #cbd5e1;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }
    .appointment-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.75rem;
    }
    .appointment-header h3 {
      margin: 0 0 0.25rem;
      font-size: 1.1rem;
      color: #0f172a;
    }
    .appointment-date {
      margin: 0;
      color: #64748b;
      font-size: 0.9rem;
    }
    .badge {
      padding: 0.35rem 0.75rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .badge-pending {
      background: #fef9c3;
      color: #854d0e;
    }
    .badge-accepted {
      background: #dbeafe;
      color: #1e40af;
    }
    .badge-done {
      background: #dcfce7;
      color: #166534;
    }
    .badge-cancelled {
      background: #fee2e2;
      color: #b91c1c;
    }
    .badge-rejected {
      background: #f3e8ff;
      color: #6b21a8;
    }
    .appointment-details {
      margin-bottom: 1rem;
      font-size: 0.9rem;
      color: #475569;
    }
    .appointment-actions {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .dialog-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
      overflow-y: auto;
    }
    .dialog {
      background: white;
      border-radius: 1rem;
      padding: 2rem;
      max-width: 500px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-height: 90vh;
      overflow-y: auto;
    }
    .dialog.large {
      max-width: 700px;
    }
    .dialog h3 {
      margin: 0 0 1rem;
      font-size: 1.4rem;
      color: #0f172a;
    }
    .dialog h4 {
      margin: 1.5rem 0 0.75rem;
      font-size: 1.1rem;
      color: #0f172a;
    }
    .dialog p {
      margin: 0 0 1rem;
      color: #475569;
    }
    .review-section {
      margin-bottom: 1.5rem;
    }
    .review-text {
      padding: 1rem;
      background: #f8fafc;
      border-radius: 0.5rem;
      border: 1px solid #e2e8f0;
      white-space: pre-wrap;
    }
    .textarea {
      width: 100%;
      padding: 0.65rem 0.75rem;
      border-radius: 0.5rem;
      border: 1px solid #cbd5e1;
      font-size: 0.95rem;
      font-family: inherit;
      resize: vertical;
      outline: none;
      transition: border-color 0.15s;
    }
    .textarea:focus {
      border-color: #2563eb;
    }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    label {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      font-size: 0.9rem;
      color: #475569;
    }
    input {
      padding: 0.6rem 0.75rem;
      border-radius: 0.5rem;
      border: 1px solid #cbd5e1;
      font-size: 0.95rem;
      outline: none;
      transition: border-color 0.15s;
    }
    input:focus {
      border-color: #2563eb;
      box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.2);
    }
    input.error, .textarea.error {
      border-color: #dc2626;
      box-shadow: 0 0 0 1px rgba(220, 38, 38, 0.2);
    }
    .error-message {
      display: block;
      margin-top: 0.25rem;
      font-size: 0.85rem;
      color: #dc2626;
    }
    .extra-fields, .special-fields {
      margin: 1.5rem 0;
      padding: 1rem;
      background: #f8fafc;
      border-radius: 0.5rem;
      border: 1px solid #e2e8f0;
    }
    .extra-field-row {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
      align-items: flex-end;
    }
    .extra-input {
      flex: 1;
    }
    .special-field {
      margin-bottom: 1.25rem;
    }
    .special-field:last-child {
      margin-bottom: 0;
    }
    .special-field label {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .special-field span {
      font-weight: 600;
      color: #475569;
      font-size: 0.9rem;
    }
    .special-input {
      width: 100%;
      padding: 0.6rem 0.75rem;
      border-radius: 0.5rem;
      border: 1px solid #cbd5e1;
      font-size: 0.95rem;
      outline: none;
      transition: border-color 0.15s;
    }
    .special-input:focus {
      border-color: #2563eb;
      box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.2);
    }
    .range-container {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .range-input {
      flex: 1;
      height: 8px;
      border-radius: 5px;
      background: #e2e8f0;
      outline: none;
      -webkit-appearance: none;
    }
    .range-input::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #2563eb;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(37, 99, 235, 0.4);
    }
    .range-input::-moz-range-thumb {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #2563eb;
      cursor: pointer;
      border: none;
      box-shadow: 0 2px 6px rgba(37, 99, 235, 0.4);
    }
    .range-value {
      font-weight: 600;
      color: #2563eb;
      min-width: 40px;
      text-align: center;
      font-size: 1rem;
    }
    .switch-container {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .switch {
      position: relative;
      display: inline-block;
      width: 50px;
      height: 24px;
    }
    .switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #cbd5e1;
      transition: 0.3s;
      border-radius: 24px;
    }
    .slider:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: 0.3s;
      border-radius: 50%;
    }
    input:checked + .slider {
      background-color: #2563eb;
    }
    input:checked + .slider:before {
      transform: translateX(26px);
    }
    .switch-label {
      font-weight: 600;
      color: #475569;
      min-width: 30px;
    }
    .dialog-actions {
      margin-top: 1.5rem;
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
    }
    @media (max-width: 768px) {
      .page {
        padding: 1rem;
      }
      .appointment-header {
        flex-direction: column;
        gap: 0.5rem;
      }
      .form-grid {
        grid-template-columns: 1fr;
      }
      .dialog {
        padding: 1.5rem;
      }
    }
  `,
})
export class MisTurnosEspecialistaComponent implements OnInit, OnDestroy {
  private appointmentsService = inject(AppointmentsService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  appointments = signal<Appointment[]>([]);
  filtroTexto = "";
  loading = signal(false);
  selectedAppointment = signal<Appointment | null>(null);
  cancelNote = "";
  rejectNote = "";
  extraFields = signal<MedicalExtraField[]>([]);

  // Nuevos campos dinámicos específicos (Sprint 5)
  rangeFieldKey = signal("");
  rangeFieldValue = signal(50);
  numericFieldKey = signal("");
  numericFieldValue: number | null = null;
  switchFieldKey = signal("");
  switchFieldValue = signal(false);

  historyForm!: FormGroup;

  showCancelDialog = signal(false);
  showRejectDialog = signal(false);
  showReviewDialog = signal(false);
  showFinalizeDialog = signal(false);

  private searchSubject = new Subject<string>();

  ngOnInit(): void {
    this.initHistoryForm();

    // Configurar debounce para la búsqueda
    this.searchSubject
      .pipe(
        debounceTime(400), // Esperar 400ms después de que el usuario deje de escribir
        distinctUntilChanged(), // Solo buscar si el valor cambió
      )
      .subscribe((searchTerm) => {
        this.loadAppointments(searchTerm);
      });

    // Cargar turnos iniciales
    this.loadAppointments();
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
  }

  onSearchChange(): void {
    this.searchSubject.next(this.filtroTexto);
  }

  initHistoryForm() {
    this.historyForm = this.fb.group({
      altura: [null, [Validators.required, Validators.min(30), Validators.max(300)]],
      peso: [null, [Validators.required, Validators.min(1), Validators.max(500)]],
      temperatura: [null, [Validators.required, Validators.min(30), Validators.max(45)]],
      presion: ["", Validators.required],
      specialistReview: ["", Validators.required],
    });
  }

  loadAppointments(search?: string) {
    this.loading.set(true);
    this.appointmentsService.getMyAppointments({ search }).subscribe({
      next: (data) => {
        this.appointments.set(data);
        this.loading.set(false);
      },
      error: (error) => {
        console.error("[MisTurnosEspecialista] Error al cargar turnos:", error);
        this.loading.set(false);
      },
    });
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-AR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  }

  formatTime(dateTimeStr: string): string {
    const date = new Date(dateTimeStr);
    return date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  }

  getStatusLabel(status: AppointmentStatus): string {
    const labels: Record<AppointmentStatus, string> = {
      PENDING: "Pendiente",
      ACCEPTED: "Aceptado",
      DONE: "Realizado",
      CANCELLED: "Cancelado",
      REJECTED: "Rechazado",
    };
    return labels[status] || status;
  }

  puedeAceptar(app: Appointment): boolean {
    return app.status !== "ACCEPTED" && app.status !== "DONE" && app.status !== "CANCELLED" && app.status !== "REJECTED";
  }

  puedeRechazar(app: Appointment): boolean {
    return app.status !== "ACCEPTED" && app.status !== "DONE" && app.status !== "CANCELLED";
  }

  puedeCancelar(app: Appointment): boolean {
    return app.status !== "ACCEPTED" && app.status !== "DONE" && app.status !== "REJECTED";
  }

  aceptarTurno(app: Appointment) {
    if (confirm("¿Estás seguro de que deseas aceptar este turno?")) {
      this.appointmentsService.acceptAppointment(app.id).subscribe({
        next: () => {
          this.loadAppointments(this.filtroTexto || undefined);
        },
        error: (error) => {
          console.error("[MisTurnosEspecialista] Error al aceptar turno:", error);
          alert("Error al aceptar el turno. Intentá nuevamente.");
        },
      });
    }
  }

  rechazarTurno(app: Appointment) {
    this.selectedAppointment.set(app);
    this.rejectNote = "";
    this.showRejectDialog.set(true);
  }

  closeRejectDialog() {
    this.showRejectDialog.set(false);
    this.selectedAppointment.set(null);
    this.rejectNote = "";
  }

  confirmarRechazar() {
    const app = this.selectedAppointment();
    if (!app || !this.rejectNote.trim() || this.rejectNote.trim().length < 10) return;

    this.appointmentsService.rejectAppointment(app.id, this.rejectNote.trim()).subscribe({
      next: () => {
        this.loadAppointments(this.filtroTexto || undefined);
        this.closeRejectDialog();
      },
      error: (error) => {
        console.error("[MisTurnosEspecialista] Error al rechazar turno:", error);
        alert("Error al rechazar el turno. Intentá nuevamente.");
      },
    });
  }

  cancelarTurno(app: Appointment) {
    this.selectedAppointment.set(app);
    this.cancelNote = "";
    this.showCancelDialog.set(true);
  }

  closeCancelDialog() {
    this.showCancelDialog.set(false);
    this.selectedAppointment.set(null);
    this.cancelNote = "";
  }

  confirmarCancelar() {
    const app = this.selectedAppointment();
    if (!app || !this.cancelNote.trim() || this.cancelNote.trim().length < 10) return;

    this.appointmentsService.cancelAppointment(app.id, this.cancelNote.trim()).subscribe({
      next: () => {
        this.loadAppointments(this.filtroTexto || undefined);
        this.closeCancelDialog();
      },
      error: (error) => {
        console.error("[MisTurnosEspecialista] Error al cancelar turno:", error);
        alert("Error al cancelar el turno. Intentá nuevamente.");
      },
    });
  }

  finalizarTurno(app: Appointment) {
    this.selectedAppointment.set(app);
    this.historyForm.reset();
    this.extraFields.set([]);
    // Reset nuevos campos específicos
    this.rangeFieldKey.set("");
    this.rangeFieldValue.set(50);
    this.numericFieldKey.set("");
    this.numericFieldValue = null;
    this.switchFieldKey.set("");
    this.switchFieldValue.set(false);
    this.showFinalizeDialog.set(true);
  }

  closeFinalizeDialog() {
    this.showFinalizeDialog.set(false);
    this.selectedAppointment.set(null);
    this.historyForm.reset();
    this.extraFields.set([]);
    // Reset nuevos campos específicos
    this.rangeFieldKey.set("");
    this.rangeFieldValue.set(50);
    this.numericFieldKey.set("");
    this.numericFieldValue = null;
    this.switchFieldKey.set("");
    this.switchFieldValue.set(false);
  }

  addExtraField() {
    if (this.extraFields().length < 3) {
      this.extraFields.set([...this.extraFields(), { clave: "", valor: "" }]);
    }
  }

  removeExtraField(index: number) {
    const fields = this.extraFields();
    fields.splice(index, 1);
    this.extraFields.set([...fields]);
  }

  confirmarFinalizar() {
    if (this.historyForm.invalid) {
      this.historyForm.markAllAsTouched();
      return;
    }

    const app = this.selectedAppointment();
    if (!app) return;

    const formValue = this.historyForm.value;
    const extraData: MedicalExtraField[] = [];

    // Agregar campos genéricos
    const genericFields = this.extraFields()
      .filter((f) => f.clave.trim() && f.valor.trim())
      .map((f) => ({ clave: f.clave.trim(), valor: f.valor.trim() }));
    extraData.push(...genericFields);

    // Agregar campo de rango (si tiene clave)
    if (this.rangeFieldKey().trim()) {
      extraData.push({
        clave: this.rangeFieldKey().trim(),
        valor: this.rangeFieldValue().toString(),
      });
    }

    // Agregar campo numérico (si tiene clave y valor)
    if (this.numericFieldKey().trim() && this.numericFieldValue !== null) {
      extraData.push({
        clave: this.numericFieldKey().trim(),
        valor: this.numericFieldValue.toString(),
      });
    }

    // Agregar campo switch (si tiene clave)
    if (this.switchFieldKey().trim()) {
      extraData.push({
        clave: this.switchFieldKey().trim(),
        valor: this.switchFieldValue() ? "Sí" : "No",
      });
    }

    this.appointmentsService
      .finalizeAppointment(app.id, {
        altura: formValue.altura,
        peso: formValue.peso,
        temperatura: formValue.temperatura,
        presion: formValue.presion,
        specialistReview: formValue.specialistReview,
        extraData: extraData.length > 0 ? extraData : undefined,
      })
      .subscribe({
        next: () => {
          this.loadAppointments(this.filtroTexto || undefined);
          this.closeFinalizeDialog();
        },
        error: (error) => {
          console.error("[MisTurnosEspecialista] Error al finalizar turno:", error);
          alert("Error al finalizar el turno. Intentá nuevamente.");
        },
      });
  }

  verResena(app: Appointment) {
    this.selectedAppointment.set(app);
    this.showReviewDialog.set(true);
  }

  closeReviewDialog() {
    this.showReviewDialog.set(false);
    this.selectedAppointment.set(null);
  }
}
