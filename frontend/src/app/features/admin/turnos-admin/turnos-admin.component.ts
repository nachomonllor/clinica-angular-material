import { Component, OnInit, OnDestroy, signal, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Subject } from "rxjs";
import { debounceTime, distinctUntilChanged } from "rxjs/operators";
import { AppointmentsService } from "../../../services/appointments.service";
import { StatusLabelPipe } from "../../../pipes/status-label.pipe";
import { StatusBadgeDirective } from "../../../directives/status-badge.directive";
import { AutoFocusDirective } from "../../../directives/auto-focus.directive";
import type { Appointment, AppointmentStatus } from "../../../models/appointment.model";

@Component({
  selector: "app-turnos-admin",
  standalone: true,
  imports: [CommonModule, FormsModule, StatusLabelPipe, StatusBadgeDirective, AutoFocusDirective],
  template: `
    <main class="page">
      <section class="card">
        <header class="card-header">
          <h1>Turnos</h1>
          <p class="subtitle">Gestioná todos los turnos de la clínica</p>
        </header>

        <div class="toolbar">
          <input
            type="text"
            class="search-input"
            placeholder="Buscar por especialidad o especialista..."
            [(ngModel)]="filtroTexto"
            (ngModelChange)="onSearchChange()"
          />
        </div>

        <div *ngIf="appointments().length === 0 && !loading()" class="empty">
          No hay turnos registrados.
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
              <span [appStatusBadge]="app.status">
                {{ app.status | statusLabel }}
              </span>
            </div>

            <div class="appointment-details">
              <p><strong>Especialista:</strong> Dr/a. {{ app.specialist.user.nombre }} {{ app.specialist.user.apellido }}</p>
              <p><strong>Paciente:</strong> {{ app.paciente.nombre }} {{ app.paciente.apellido }}</p>
            </div>

            <div class="appointment-actions">
              <!-- Cancelar turno: Solo visible si no está Aceptado, Realizado o Rechazado -->
              <button
                *ngIf="app.status !== 'ACCEPTED' && app.status !== 'DONE' && app.status !== 'REJECTED'"
                class="btn small secondary"
                (click)="cancelarTurno(app)"
              >
                Cancelar
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
          [appAutoFocus]="0"
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
    .appointment-details p {
      margin: 0.25rem 0;
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
    }
    .dialog {
      background: white;
      border-radius: 1rem;
      padding: 2rem;
      max-width: 500px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }
    .dialog h3 {
      margin: 0 0 1rem;
      font-size: 1.4rem;
      color: #0f172a;
    }
    .dialog p {
      margin: 0 0 1rem;
      color: #475569;
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
    }
  `,
})
export class TurnosAdminComponent implements OnInit, OnDestroy {
  private appointmentsService = inject(AppointmentsService);

  appointments = signal<Appointment[]>([]);
  filtroTexto = "";
  loading = signal(false);
  selectedAppointment = signal<Appointment | null>(null);
  cancelNote = "";

  showCancelDialog = signal(false);

  private searchSubject = new Subject<string>();

  ngOnInit(): void {
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

  loadAppointments(search?: string) {
    this.loading.set(true);
    this.appointmentsService.getAdminAppointments({ search }).subscribe({
      next: (data) => {
        this.appointments.set(data);
        this.loading.set(false);
      },
      error: (error) => {
        console.error("[TurnosAdmin] Error al cargar turnos:", error);
        this.loading.set(false);
      },
    });
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-AR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  formatTime(dateTimeStr: string): string {
    const date = new Date(dateTimeStr);
    return date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  }


  cancelarTurno(app: Appointment) {
    this.selectedAppointment.set(app);
    this.showCancelDialog.set(true);
    this.cancelNote = "";
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
        console.error("[TurnosAdmin] Error al cancelar turno:", error);
        alert("Error al cancelar el turno. Intentá nuevamente.");
      },
    });
  }

}

