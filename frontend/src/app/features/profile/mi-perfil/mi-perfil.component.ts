import { Component, OnInit, signal, computed, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { AuthService } from "../../../services/auth.service";
import { AvailabilityService } from "../../../services/availability.service";
import { UsersService } from "../../../services/users.service";
import { MedicalRecordsService } from "../../../services/medical-records.service";
import { StorageService } from "../../../services/storage.service";
import { ImageUploadComponent } from "../../../shared/image-upload/image-upload.component";
import { generateMedicalHistoryPDF } from "../../../utils/pdf.util";
import { API_BASE_URL } from "../../../utils/api-config";
import type { User } from "../../../models/user.model";
import type { SpecialistAvailability, Weekday, SlotDuration } from "../../../models/availability.model";
import type { MedicalRecord } from "../../../models/appointment.model";

const WEEKDAYS: { value: Weekday; label: string }[] = [
  { value: "MONDAY", label: "Lunes" },
  { value: "TUESDAY", label: "Martes" },
  { value: "WEDNESDAY", label: "Miércoles" },
  { value: "THURSDAY", label: "Jueves" },
  { value: "FRIDAY", label: "Viernes" },
  { value: "SATURDAY", label: "Sábado" },
  { value: "SUNDAY", label: "Domingo" },
];

const SLOT_DURATIONS: { value: SlotDuration; label: string }[] = [
  { value: "MIN_15", label: "15 minutos" },
  { value: "MIN_30", label: "30 minutos" },
  { value: "MIN_60", label: "60 minutos" },
];

@Component({
  selector: "app-mi-perfil",
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, ImageUploadComponent],
  template: `
    <main class="page">
      <section class="card">
        <header class="card-header">
          <h1>Mi Perfil</h1>
        </header>

        <div class="profile-content">
          <!-- Datos del usuario -->
          <div class="profile-section">
            <h2>Datos Personales</h2>
            
            <!-- Imágenes de perfil arriba -->
            <div class="profile-images-section">
              <!-- Pacientes: 2 imágenes -->
              <div *ngIf="esPaciente()" class="images-container">
                <app-image-upload
                  label="Imagen 1"
                  [currentImageUrl]="getCurrentUserImageUnoUrl()"
                  [disabled]="updatingProfile()"
                  (imageUploaded)="onImageUnoUploaded($event)"
                  (imageRemoved)="onImageUnoRemoved()"
                />
                <app-image-upload
                  label="Imagen 2"
                  [currentImageUrl]="getCurrentUserImageDosUrl()"
                  [disabled]="updatingProfile()"
                  (imageUploaded)="onImageDosUploaded($event)"
                  (imageRemoved)="onImageDosRemoved()"
                />
              </div>
              
              <!-- Especialistas y Admin: 1 imagen -->
              <div *ngIf="!esPaciente()" class="single-image-container">
                <app-image-upload
                  label="Imagen de perfil"
                  [currentImageUrl]="getCurrentUserImageUrl()"
                  [disabled]="updatingProfile()"
                  (imageUploaded)="onImageUploaded($event)"
                  (imageRemoved)="onImageRemoved()"
                />
              </div>
            </div>
            
            <!-- Datos personales abajo -->
            <div class="profile-info">
              <div class="info-grid">
                <div class="info-item">
                  <strong>Nombre:</strong>
                  <span>{{ currentUser()?.nombre }} {{ currentUser()?.apellido }}</span>
                </div>
                <div class="info-item">
                  <strong>Email:</strong>
                  <span>{{ currentUser()?.email }}</span>
                </div>
                <div class="info-item">
                  <strong>DNI:</strong>
                  <span>{{ currentUser()?.dni }}</span>
                </div>
                <div class="info-item">
                  <strong>Edad:</strong>
                  <span>{{ currentUser()?.edad }} años</span>
                </div>
                <div class="info-item">
                  <strong>Rol:</strong>
                  <span>{{ getRoleLabel(currentUser()?.role) }}</span>
                </div>
                <div class="info-item" *ngIf="currentUser()?.especialista">
                  <strong>Especialidades:</strong>
                  <span>
                    <span *ngFor="let esp of currentUser()!.especialista!.especialidades; let last = last">
                      {{ esp }}<span *ngIf="!last">, </span>
                    </span>
                  </span>
                </div>
                <div class="info-item" *ngIf="currentUser()?.paciente">
                  <strong>Obra Social:</strong>
                  <span>{{ currentUser()!.paciente!.obraSocial }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Mis Horarios (solo para especialistas) -->
          <div class="profile-section" *ngIf="esEspecialista()">
            <h2>Mis Horarios</h2>
            <p class="section-description">
              Configurá tu disponibilidad horaria para cada especialidad y día de la semana.
              Seleccioná la hora de inicio y fin de tu disponibilidad.
            </p>

            <!-- Lista de disponibilidades existentes -->
            <div *ngIf="availabilities().length > 0" class="availabilities-list">
              <div *ngFor="let av of availabilities()" class="availability-card">
                <div class="availability-header">
                  <div>
                    <h3>{{ getWeekdayLabel(av.dayOfWeek) }}</h3>
                    <p>{{ av.especialidad?.nombre || 'Especialidad #' + av.especialidadId }}</p>
                  </div>
                  <div class="availability-actions">
                    <span class="badge" [class.badge-active]="av.active" [class.badge-inactive]="!av.active">
                      {{ av.active ? "Activo" : "Inactivo" }}
                    </span>
                    <button class="btn small" (click)="editarDisponibilidad(av)">Editar</button>
                    <button
                      class="btn small"
                      [class.primary]="!av.active"
                      [class.secondary]="av.active"
                      (click)="toggleDisponibilidad(av)"
                    >
                      {{ av.active ? "Desactivar" : "Activar" }}
                    </button>
                    <button class="btn small primary" (click)="generarSlots(av)">
                      Generar Slots
                    </button>
                  </div>
                </div>
                <div class="availability-details">
                  <p><strong>Horario:</strong> {{ formatMinutes(av.startMinute) }} - {{ formatMinutes(av.endMinute) }}</p>
                  <p><strong>Duración del turno:</strong> {{ getDurationLabel(av.duration) }}</p>
                </div>
              </div>
            </div>

            <div *ngIf="availabilities().length === 0 && !loadingAvailability()" class="empty">
              No tenés horarios configurados. Creá uno nuevo.
            </div>

            <!-- Formulario para crear/editar disponibilidad -->
            <div class="availability-form">
              <h3>{{ editingAvailability() ? "Editar" : "Crear" }} Disponibilidad</h3>
              <form [formGroup]="availabilityForm" (ngSubmit)="guardarDisponibilidad()">
                <div class="form-grid">
                  <label>
                    Especialidad
                    <select formControlName="especialidadId" required>
                      <option value="">Seleccionar especialidad</option>
                      <option *ngFor="let esp of especialidadesDisponibles()" [value]="esp.id">
                        {{ esp.nombre }}
                      </option>
                    </select>
                  </label>

                  <label>
                    Día de la semana
                    <select formControlName="dayOfWeek" required>
                      <option value="">Seleccionar día</option>
                      <option *ngFor="let day of WEEKDAYS" [value]="day.value">
                        {{ day.label }}
                      </option>
                    </select>
                  </label>

                  <label>
                    Hora de inicio
                    <input
                      type="time"
                      formControlName="startTime"
                      step="900"
                      required
                    />
                    <small>Seleccioná la hora de inicio (solo minutos: 00, 15, 30, 45)</small>
                  </label>

                  <label>
                    Hora de fin
                    <input
                      type="time"
                      formControlName="endTime"
                      step="900"
                      required
                    />
                    <small>Seleccioná la hora de fin (solo minutos: 00, 15, 30, 45)</small>
                  </label>

                  <label>
                    Duración del turno
                    <select formControlName="duration" required>
                      <option *ngFor="let dur of SLOT_DURATIONS" [value]="dur.value">
                        {{ dur.label }}
                      </option>
                    </select>
                  </label>
                </div>

                <div class="form-actions">
                  <button
                    type="button"
                    class="btn secondary"
                    (click)="cancelarEdicion()"
                    *ngIf="editingAvailability()"
                  >
                    Cancelar
                  </button>
                  <button type="submit" class="btn primary" [disabled]="availabilityForm.invalid || saving()">
                    {{ saving() ? "Guardando..." : editingAvailability() ? "Actualizar" : "Crear" }}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <!-- Historia Clínica (solo para pacientes) -->
          <div class="profile-section" *ngIf="esPaciente()">
            <h2>Historia Clínica</h2>
            <p class="section-description">
              Tu historial médico completo con todos los registros de tus consultas.
            </p>

            <div *ngIf="loadingRecords()" class="loading">Cargando historia clínica...</div>

            <div *ngIf="!loadingRecords() && medicalRecords().length === 0" class="empty">
              No tenés registros médicos aún. Los registros se crearán automáticamente cuando un especialista finalice un turno.
            </div>

            <div *ngIf="!loadingRecords() && medicalRecords().length > 0" class="medical-records-list">
              <div *ngFor="let record of medicalRecords()" class="record-card">
                <div class="record-header">
                  <div>
                    <h3>{{ record.appointment.especialidad.nombre }}</h3>
                    <p class="record-date">
                      {{ formatDate(record.appointment.slot.date) }} - {{ formatTime(record.appointment.slot.startAt) }}
                    </p>
                  </div>
                  <button class="btn small" (click)="descargarPDF(record)" [disabled]="descargandoPDF()">
                    {{ descargandoPDF() ? "Generando..." : "Descargar PDF" }}
                  </button>
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
      </section>
    </main>
  `,
  styles: `
    .page {
      min-height: 100vh;
      background: #f4f7fb;
      padding: 2rem;
    }
    .card {
      max-width: 1000px;
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
      margin: 0;
      font-size: 1.8rem;
      color: #0f172a;
    }
    .profile-content {
      padding: 2rem;
    }
    .profile-section {
      margin-bottom: 3rem;
    }
    .profile-images-section {
      margin-bottom: 2rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid #e2e8f0;
    }
    .images-container {
      display: flex;
      gap: 1.5rem;
      flex-wrap: wrap;
      justify-content: center;
    }
    .single-image-container {
      display: flex;
      justify-content: center;
    }
    h2 {
      margin: 0 0 1.5rem;
      font-size: 1.4rem;
      color: #0f172a;
    }
    h3 {
      margin: 0 0 0.5rem;
      font-size: 1.1rem;
      color: #0f172a;
    }
    .section-description {
      margin: 0 0 1.5rem;
      color: #64748b;
      font-size: 0.95rem;
      line-height: 1.6;
    }
    .profile-info {
      margin-top: 1.5rem;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1rem;
    }
    .info-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      padding: 0.75rem;
      background: #f8fafc;
      border-radius: 0.5rem;
      border: 1px solid #e2e8f0;
    }
    .info-item strong {
      font-size: 0.85rem;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
    }
    .info-item span {
      font-size: 0.95rem;
      color: #0f172a;
      font-weight: 500;
    }
    .availabilities-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .availability-card {
      padding: 1.25rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      background: #f8fafc;
    }
    .availability-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.75rem;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    .availability-actions {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      flex-wrap: wrap;
    }
    .badge {
      padding: 0.35rem 0.75rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .badge-active {
      background: #dcfce7;
      color: #166534;
    }
    .badge-inactive {
      background: #fee2e2;
      color: #b91c1c;
    }
    .availability-details {
      font-size: 0.9rem;
      color: #475569;
    }
    .availability-details p {
      margin: 0.25rem 0;
    }
    .availability-form {
      padding: 1.5rem;
      background: #f8fafc;
      border-radius: 0.75rem;
      border: 1px solid #e2e8f0;
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
    input, select {
      padding: 0.65rem 0.75rem;
      border-radius: 0.5rem;
      border: 1px solid #cbd5e1;
      font-size: 0.95rem;
      outline: none;
      transition: border-color 0.15s;
    }
    input:focus, select:focus {
      border-color: #2563eb;
      box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.2);
    }
    small {
      font-size: 0.8rem;
      color: #64748b;
      margin-top: 0.25rem;
    }
    .form-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
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
    .btn.secondary:hover {
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
    .empty {
      padding: 2rem;
      text-align: center;
      color: #64748b;
      font-size: 0.95rem;
    }
    /* Estilos para Historia Clínica */
    .medical-records-list {
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
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    .record-date {
      margin: 0.25rem 0 0;
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
    .loading, .empty {
      padding: 2rem;
      text-align: center;
      color: #64748b;
      font-size: 0.95rem;
    }

    @media (max-width: 768px) {
      .page {
        padding: 1rem;
      }
      .profile-content {
        padding: 1.5rem;
      }
      .images-container {
        flex-direction: column;
        align-items: center;
      }
      .single-image-container {
        width: 100%;
      }
      .info-grid {
        grid-template-columns: 1fr;
      }
      .form-grid {
        grid-template-columns: 1fr;
      }
      .data-grid {
        grid-template-columns: 1fr;
      }
      .availability-header {
        flex-direction: column;
      }
      .availability-actions {
        flex-direction: column;
        align-items: stretch;
      }
      .btn.small {
        width: 100%;
      }
      .record-header {
        flex-direction: column;
        align-items: stretch;
      }
    }
  `,
})
export class MiPerfilComponent implements OnInit {
  private authService = inject(AuthService);
  private availabilityService = inject(AvailabilityService);
  private usersService = inject(UsersService);
  private medicalRecordsService = inject(MedicalRecordsService);
  private storageService = inject(StorageService);
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);

  currentUser = computed(() => this.authService.currentUser());
  availabilities = signal<SpecialistAvailability[]>([]);
  especialidadesDisponibles = signal<{ id: number; nombre: string }[]>([]);
  editingAvailability = signal<SpecialistAvailability | null>(null);
  loadingAvailability = signal(false);
  saving = signal(false);

  // Historia Clínica (para pacientes)
  medicalRecords = signal<MedicalRecord[]>([]);
  loadingRecords = signal(false);
  descargandoPDF = signal(false);

  // Perfil
  updatingProfile = signal(false);

  readonly WEEKDAYS = WEEKDAYS;
  readonly SLOT_DURATIONS = SLOT_DURATIONS;

  availabilityForm!: FormGroup;

  esEspecialista = computed(() => this.currentUser()?.role === "SPECIALIST");
  esAdmin = computed(() => this.currentUser()?.role === "ADMIN");
  esPaciente = computed(() => this.currentUser()?.role === "PATIENT");
  puedeGestionarDisponibilidades = computed(() => 
    this.esEspecialista() || this.esAdmin()
  );

  async ngOnInit(): Promise<void> {
    this.initForm();
    
    // Asegurarse de que la sesión esté activa antes de hacer cualquier llamada
    try {
      await firstValueFrom(this.authService.loadSession());
    } catch (error) {
      console.warn("[MiPerfil] No se pudo cargar la sesión:", error);
    }
    
    if (this.puedeGestionarDisponibilidades()) {
      // Solo cargar especialidades y disponibilidades si el usuario es SPECIALIST
      // (Los admins no tienen especialidades, no necesitan gestionar disponibilidades)
      const user = this.currentUser();
      if (user && user.role === "SPECIALIST") {
        this.loadEspecialidades();
        this.loadAvailabilities();
      }
    }

    if (this.esPaciente()) {
      // Cargar historia clínica para pacientes
      this.loadMedicalRecords();
    }
  }

  initForm() {
    this.availabilityForm = this.fb.group({
      especialidadId: [null, Validators.required],
      dayOfWeek: ["", Validators.required],
      startTime: ["", Validators.required],
      endTime: ["", Validators.required],
      duration: ["MIN_30", Validators.required],
      active: [true],
    });
  }

  private buildPacienteUpdatePayload(partial: { imagenUno?: string | null; imagenDos?: string | null }) {
    const user = this.currentUser();
    const obraSocial = user?.paciente?.obraSocial;
    if (!user || !obraSocial) {
      console.error("[MiPerfil] No se pudo obtener la obra social del paciente para actualizar la imagen.");
      alert("No se pudo actualizar la imagen porque faltan datos de la obra social.");
      this.updatingProfile.set(false);
      return null;
    }

    return {
      obraSocial,
      ...partial,
    };
  }

  loadEspecialidades() {
    const user = this.currentUser();
    if (!user) {
      console.warn("[MiPerfil] No hay usuario autenticado, no se pueden cargar especialidades");
      return;
    }
    
    // Verificar que el usuario sea especialista antes de llamar al endpoint
    if (user.role !== "SPECIALIST") {
      console.warn("[MiPerfil] Solo los especialistas pueden cargar especialidades");
      return;
    }
    
    // Usar el endpoint "me/specialties" que solo funciona para SPECIALIST
    this.usersService.getMySpecialties().subscribe({
      next: (especialidades) => {
        this.especialidadesDisponibles.set(especialidades);
        // Combinar con especialidades de disponibilidades existentes si ya fueron cargadas
        if (this.availabilities().length > 0) {
          this.combinarEspecialidades();
        }
      },
      error: (error) => {
        console.error("[MiPerfil] Error al cargar especialidades:", error);
        
        // Si el error es 401, probablemente el usuario no está autenticado o no tiene el rol correcto
        if (error.status === 401) {
          console.warn("[MiPerfil] Error 401 - Usuario no autenticado o sin permisos. Intentando fallback...");
        }
        
        // Como fallback, intentar obtener desde disponibilidades existentes
        const availabilities = this.availabilities();
        const especialidadesMap = new Map<number, string>();

        availabilities.forEach((av) => {
          if (av.especialidadId && av.especialidad?.nombre) {
            especialidadesMap.set(av.especialidadId, av.especialidad.nombre);
          }
        });

        if (especialidadesMap.size > 0) {
          const especialidades = Array.from(especialidadesMap.entries()).map(([id, nombre]) => ({
            id,
            nombre,
          }));
          this.especialidadesDisponibles.set(especialidades);
        } else {
          this.especialidadesDisponibles.set([]);
        }
      },
    });
  }

  loadAvailabilities() {
    const user = this.currentUser();
    if (!user?.especialista?.id) return;

    this.loadingAvailability.set(true);
    this.availabilityService.getAvailability(user.especialista.id).subscribe({
      next: (data) => {
        this.availabilities.set(data);
        // Combinar especialidades del endpoint con las de las disponibilidades existentes
        this.combinarEspecialidades();
        this.loadingAvailability.set(false);
      },
      error: (error) => {
        console.error("[MiPerfil] Error al cargar disponibilidades:", error);
        this.loadingAvailability.set(false);
      },
    });
  }

  combinarEspecialidades() {
    // Obtener especialidades del endpoint (ya cargadas)
    const especialidadesDelEndpoint = this.especialidadesDisponibles();
    const especialidadesMap = new Map<number, { id: number; nombre: string }>();

    // Agregar especialidades del endpoint
    especialidadesDelEndpoint.forEach((esp) => {
      especialidadesMap.set(esp.id, esp);
    });

    // Agregar especialidades de las disponibilidades existentes
    const availabilities = this.availabilities();
    availabilities.forEach((av) => {
      if (av.especialidadId && av.especialidad) {
        especialidadesMap.set(av.especialidadId, {
          id: av.especialidadId,
          nombre: av.especialidad.nombre,
        });
      }
    });

    // Actualizar la lista combinada
    this.especialidadesDisponibles.set(Array.from(especialidadesMap.values()));
  }

  editarDisponibilidad(av: SpecialistAvailability) {
    this.editingAvailability.set(av);
    this.availabilityForm.patchValue({
      especialidadId: av.especialidadId,
      dayOfWeek: av.dayOfWeek,
      startTime: this.minutesToTime(av.startMinute),
      endTime: this.minutesToTime(av.endMinute),
      duration: av.duration,
      active: av.active,
    });
  }

  cancelarEdicion() {
    this.editingAvailability.set(null);
    this.availabilityForm.reset({
      duration: "MIN_30",
      active: true,
    });
  }

  guardarDisponibilidad() {
    if (this.availabilityForm.invalid) {
      this.availabilityForm.markAllAsTouched();
      return;
    }

    const user = this.currentUser();
    if (!user?.especialista?.id) return;

    // Validar que la hora de fin sea mayor que la de inicio
    const startTime = this.availabilityForm.value.startTime;
    const endTime = this.availabilityForm.value.endTime;
    if (startTime >= endTime) {
      alert("La hora de fin debe ser mayor que la hora de inicio");
      this.saving.set(false);
      return;
    }

    // Convertir a minutos y validar que sean múltiplos de 15
    const startMinute = this.timeToMinutes(startTime);
    const endMinute = this.timeToMinutes(endTime);
    
    if (startMinute % 15 !== 0 || endMinute % 15 !== 0) {
      alert("Las horas deben ser en intervalos de 15 minutos (00, 15, 30, 45). Ej: 08:00, 08:15, 08:30, 08:45");
      this.saving.set(false);
      return;
    }

    this.saving.set(true);
    const formValue = this.availabilityForm.value;
    const data = {
      especialistaId: user.especialista.id,
      especialidadId: Number(formValue.especialidadId),
      dayOfWeek: formValue.dayOfWeek,
      startMinute: startMinute,
      endMinute: endMinute,
      duration: formValue.duration,
      active: formValue.active ?? true,
    };

    if (this.editingAvailability()) {
      // Actualizar
      this.availabilityService.updateAvailability(this.editingAvailability()!.id, data).subscribe({
        next: () => {
          this.loadAvailabilities(); // Esto ya llama a combinarEspecialidades()
          this.cancelarEdicion();
          this.saving.set(false);
        },
        error: (error) => {
          console.error("[MiPerfil] Error al actualizar disponibilidad:", error);
          alert("Error al actualizar disponibilidad. Verificá los datos.");
          this.saving.set(false);
        },
      });
    } else {
      // Crear
      this.availabilityService.createAvailability(data).subscribe({
        next: () => {
          this.loadAvailabilities(); // Esto ya llama a combinarEspecialidades()
          this.cancelarEdicion();
          this.saving.set(false);
        },
        error: (error) => {
          console.error("[MiPerfil] Error al crear disponibilidad:", error);
          alert("Error al crear disponibilidad. Verificá los datos.");
          this.saving.set(false);
        },
      });
    }
  }

  toggleDisponibilidad(av: SpecialistAvailability) {
    this.availabilityService.updateAvailability(av.id, { active: !av.active }).subscribe({
      next: () => {
        this.loadAvailabilities();
      },
      error: (error) => {
        console.error("[MiPerfil] Error al actualizar disponibilidad:", error);
        alert("Error al actualizar disponibilidad.");
      },
    });
  }

  generarSlots(_av: SpecialistAvailability) {
    const user = this.currentUser();
    if (!user?.especialista?.id) {
      alert("Error: No se pudo identificar el especialista.");
      return;
    }

    if (!confirm(`¿Generar slots para todas tus disponibilidades activas? Se generarán slots para los próximos 15 días.`)) {
      return;
    }

    this.availabilityService.generateSlots(user.especialista.id, { days: 15 }).subscribe({
      next: (result) => {
        alert(`Se generaron ${result.created} slots exitosamente.`);
      },
      error: (error) => {
        console.error("[MiPerfil] Error al generar slots:", error);
        alert("Error al generar slots. Verificá que tengas disponibilidades activas configuradas.");
      },
    });
  }

  formatMinutes(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  }

  // Convertir formato HH:MM a minutos desde medianoche
  timeToMinutes(time: string): number {
    if (!time) return 0;
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  }

  // Convertir minutos desde medianoche a formato HH:MM
  minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  }

  getWeekdayLabel(day: Weekday): string {
    return WEEKDAYS.find((d) => d.value === day)?.label || day;
  }

  getDurationLabel(duration: SlotDuration): string {
    return SLOT_DURATIONS.find((d) => d.value === duration)?.label || duration;
  }

  getRoleLabel(role?: string): string {
    const labels: Record<string, string> = {
      PATIENT: "Paciente",
      SPECIALIST: "Especialista",
      ADMIN: "Administrador",
    };
    return role ? labels[role] || role : "";
  }

  // Métodos para Historia Clínica
  loadMedicalRecords() {
    this.loadingRecords.set(true);
    this.medicalRecordsService.getMyRecords().subscribe({
      next: (records) => {
        this.medicalRecords.set(records);
        this.loadingRecords.set(false);
      },
      error: (error) => {
        console.error("[MiPerfil] Error al cargar historia clínica:", error);
        this.loadingRecords.set(false);
      },
    });
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

  getCurrentUserImageUrl(): string | null {
    const user = this.currentUser();
    if (!user) return null;

    // Especialistas y Admin tienen imagen
    if (user.especialista?.imagen) {
      return user.especialista.imagen;
    }
    if (user.admin?.imagen) {
      return user.admin.imagen;
    }

    return null;
  }

  getCurrentUserImageUnoUrl(): string | null {
    const user = this.currentUser();
    return user?.paciente?.imagenUno || null;
  }

  getCurrentUserImageDosUrl(): string | null {
    const user = this.currentUser();
    return user?.paciente?.imagenDos || null;
  }

  onImageUploaded(event: { filename: string; url: string }) {
    const user = this.currentUser();
    if (!user) return;

    this.updatingProfile.set(true);

    // Construir el payload según el rol del usuario
    const payload: any = {};

    if (user.role === "PATIENT" && user.paciente) {
      // Para pacientes, actualizar imagenUno (podríamos permitir actualizar cualquiera de las dos)
      payload.paciente = {
        imagenUno: event.url,
      };
    } else if (user.role === "SPECIALIST" && user.especialista) {
      payload.especialista = {
        imagen: event.url,
      };
    } else if (user.role === "ADMIN" && user.admin) {
      payload.admin = {
        imagen: event.url,
      };
    }

    // Actualizar el perfil del usuario (usando endpoint propio, no admin)
    this.http
      .patch<User>(`${API_BASE_URL}/users/me`, payload, {
        withCredentials: true,
      })
      .subscribe({
        next: (updatedUser) => {
          // Actualizar el usuario en la sesión
          this.authService.setCurrentUser(updatedUser);
          this.updatingProfile.set(false);
        },
        error: (error) => {
          console.error("[MiPerfil] Error al actualizar imagen:", error);
          alert("Error al actualizar la imagen. Intentá nuevamente.");
          this.updatingProfile.set(false);
        },
      });
  }

  onImageUnoUploaded(event: { filename: string; url: string }) {
    const user = this.currentUser();
    if (!user || user.role !== "PATIENT") return;

    const pacientePayload = this.buildPacienteUpdatePayload({ imagenUno: event.url });
    if (!pacientePayload) {
      return;
    }

    this.updatingProfile.set(true);

    const payload: any = {
      paciente: pacientePayload,
    };

    this.http
      .patch<User>(`${API_BASE_URL}/users/me`, payload, {
        withCredentials: true,
      })
      .subscribe({
        next: (updatedUser) => {
          this.authService.setCurrentUser(updatedUser);
          this.updatingProfile.set(false);
        },
        error: (error) => {
          console.error("[MiPerfil] Error al actualizar imagen 1:", error);
          alert("Error al actualizar la imagen 1. Intentá nuevamente.");
          this.updatingProfile.set(false);
        },
      });
  }

  onImageUnoRemoved() {
    const user = this.currentUser();
    if (!user || user.role !== "PATIENT") return;

    const pacientePayload = this.buildPacienteUpdatePayload({ imagenUno: null });
    if (!pacientePayload) {
      return;
    }

    this.updatingProfile.set(true);

    const payload: any = {
      paciente: pacientePayload,
    };

    this.http
      .patch<User>(`${API_BASE_URL}/users/me`, payload, {
        withCredentials: true,
      })
      .subscribe({
        next: (updatedUser) => {
          this.authService.setCurrentUser(updatedUser);
          this.updatingProfile.set(false);
        },
        error: (error) => {
          console.error("[MiPerfil] Error al eliminar imagen 1:", error);
          alert("Error al eliminar la imagen 1. Intentá nuevamente.");
          this.updatingProfile.set(false);
        },
      });
  }

  onImageDosUploaded(event: { filename: string; url: string }) {
    const user = this.currentUser();
    if (!user || user.role !== "PATIENT") return;

    const pacientePayload = this.buildPacienteUpdatePayload({ imagenDos: event.url });
    if (!pacientePayload) {
      return;
    }

    this.updatingProfile.set(true);

    const payload: any = {
      paciente: pacientePayload,
    };

    this.http
      .patch<User>(`${API_BASE_URL}/users/me`, payload, {
        withCredentials: true,
      })
      .subscribe({
        next: (updatedUser) => {
          this.authService.setCurrentUser(updatedUser);
          this.updatingProfile.set(false);
        },
        error: (error) => {
          console.error("[MiPerfil] Error al actualizar imagen 2:", error);
          alert("Error al actualizar la imagen 2. Intentá nuevamente.");
          this.updatingProfile.set(false);
        },
      });
  }

  onImageDosRemoved() {
    const user = this.currentUser();
    if (!user || user.role !== "PATIENT") return;

    const pacientePayload = this.buildPacienteUpdatePayload({ imagenDos: null });
    if (!pacientePayload) {
      return;
    }

    this.updatingProfile.set(true);

    const payload: any = {
      paciente: pacientePayload,
    };

    this.http
      .patch<User>(`${API_BASE_URL}/users/me`, payload, {
        withCredentials: true,
      })
      .subscribe({
        next: (updatedUser) => {
          this.authService.setCurrentUser(updatedUser);
          this.updatingProfile.set(false);
        },
        error: (error) => {
          console.error("[MiPerfil] Error al eliminar imagen 2:", error);
          alert("Error al eliminar la imagen 2. Intentá nuevamente.");
          this.updatingProfile.set(false);
        },
      });
  }

  onImageRemoved() {
    const user = this.currentUser();
    if (!user) return;

    this.updatingProfile.set(true);

    // Construir el payload para eliminar la imagen según el rol
    const payload: any = {};

    if (user.role === "SPECIALIST" && user.especialista) {
      payload.especialista = {
        imagen: null,
      };
    } else if (user.role === "ADMIN" && user.admin) {
      payload.admin = {
        imagen: null,
      };
    }

    // Actualizar el perfil del usuario (usando endpoint propio, no admin)
    this.http
      .patch<User>(`${API_BASE_URL}/users/me`, payload, {
        withCredentials: true,
      })
      .subscribe({
        next: (updatedUser) => {
          // Actualizar el usuario en la sesión
          this.authService.setCurrentUser(updatedUser);
          this.updatingProfile.set(false);
        },
        error: (error) => {
          console.error("[MiPerfil] Error al eliminar imagen:", error);
          alert("Error al eliminar la imagen. Intentá nuevamente.");
          this.updatingProfile.set(false);
        },
      });
  }

  descargarPDF(record: MedicalRecord) {
    const user = this.currentUser();
    if (!user || !user.paciente) {
      alert("Error: No se pudo obtener la información del paciente.");
      return;
    }

    this.descargandoPDF.set(true);

    try {
      // Obtener todos los registros médicos del paciente
      this.medicalRecordsService.getMyRecords().subscribe({
        next: async (records) => {
          if (records.length === 0) {
            alert("No hay registros médicos para generar el PDF.");
            this.descargandoPDF.set(false);
            return;
          }

          try {
            // Generar PDF con todos los registros (ahora es async)
            await generateMedicalHistoryPDF({
              paciente: user as User & { paciente: { obraSocial: string } },
              records,
            });
          } catch (error) {
            console.error("[MiPerfil] Error al generar PDF:", error);
            alert("Error al generar el PDF. Intentá nuevamente.");
          } finally {
            this.descargandoPDF.set(false);
          }
        },
        error: (error) => {
          console.error("[MiPerfil] Error al cargar registros para PDF:", error);
          alert("Error al generar el PDF. Intentá nuevamente.");
          this.descargandoPDF.set(false);
        },
      });
    } catch (error) {
      console.error("[MiPerfil] Error al generar PDF:", error);
      alert("Error al generar el PDF. Intentá nuevamente.");
      this.descargandoPDF.set(false);
    }
  }
}

