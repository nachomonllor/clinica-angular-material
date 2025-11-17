import { Component, OnInit, signal, computed, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterModule, Router } from "@angular/router";
import { SlotsService } from "../../../services/slots.service";
import { AppointmentsService } from "../../../services/appointments.service";
import { AuthService } from "../../../services/auth.service";
import { UsersService } from "../../../services/users.service";
import type { AppointmentSlot } from "../../../models/slot.model";
import type { User } from "../../../models/user.model";

interface EspecialidadOption {
  id: number;
  nombre: string;
}

interface EspecialistaOption {
  id: number;
  nombre: string;
  apellido: string;
  especialidadId: number;
  especialidadNombre: string;
  userId: string;
}

interface DiaOption {
  fecha: string; // ISO date YYYY-MM-DD
  display: string; // "Lunes 15 de Enero"
}

@Component({
  selector: "app-solicitar-turno",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <main class="page">
      <section class="card">
        <header class="card-header">
          <h1>Solicitar Turno</h1>
          <p class="subtitle">Reservá tu turno médico</p>
        </header>

        <form class="form" (ngSubmit)="onSubmit()" #form="ngForm">
          <!-- Especialidad (input texto, no combobox) -->
          <label>
            Especialidad
            <input
              type="text"
              [(ngModel)]="especialidadBusqueda"
              name="especialidad"
              placeholder="Escribí la especialidad..."
              (ngModelChange)="filtrarEspecialidades()"
              required
              list="especialidades-list"
            />
            <datalist id="especialidades-list" *ngIf="tieneEspecialidadesFiltradas">
              <option *ngFor="let esp of especialidadesFiltradas()" [value]="esp.nombre">
                {{ esp.nombre }}
              </option>
            </datalist>
            <small *ngIf="especialidadesDisponibles().length === 0" class="error-text">
              No hay especialidades disponibles. Asegurate de que haya especialistas con disponibilidad.
            </small>
          </label>

          <!-- Especialista (input texto, no combobox) -->
          <label>
            Especialista
            <input
              type="text"
              [(ngModel)]="especialistaBusqueda"
              name="especialista"
              placeholder="Escribí el nombre del especialista..."
              (ngModelChange)="filtrarEspecialistas()"
              [disabled]="!especialidadSeleccionada()"
              required
              list="especialistas-list"
            />
            <datalist id="especialistas-list" *ngIf="tieneEspecialistasFiltrados">
              <option *ngFor="let esp of especialistasFiltrados()" [value]="esp.nombre + ' ' + esp.apellido">
                Dr/a. {{ esp.nombre }} {{ esp.apellido }}
              </option>
            </datalist>
            <small *ngIf="especialidadSeleccionada() && especialistasDisponibles().length === 0" class="error-text">
              No hay especialistas disponibles para esta especialidad.
            </small>
          </label>

          <!-- Paciente (solo si es ADMIN) -->
          <label *ngIf="esAdmin()">
            Paciente
            <input
              type="text"
              [(ngModel)]="pacienteBusqueda"
              name="paciente"
              placeholder="Escribí el nombre del paciente..."
              required
              list="pacientes-list"
            />
            <datalist id="pacientes-list" *ngIf="tienePacientesFiltrados">
              <option *ngFor="let pac of pacientesFiltrados()" [value]="pac.nombre + ' ' + pac.apellido">
                {{ pac.nombre }} {{ pac.apellido }} ({{ pac.email }})
              </option>
            </datalist>
          </label>

          <!-- Día (sin datepicker, botones o lista) -->
          <label>
            Día
            <div class="dias-container" *ngIf="diasDisponibles().length > 0">
              <button
                type="button"
                *ngFor="let dia of diasDisponibles()"
                class="dia-button"
                [class.selected]="diaSeleccionado() === dia.fecha"
                (click)="seleccionarDia(dia.fecha)"
              >
                {{ dia.display }}
              </button>
            </div>
            <small *ngIf="especialistaSeleccionado() && diasDisponibles().length === 0" class="error-text">
              No hay días disponibles para este especialista en los próximos 15 días.
            </small>
            <small *ngIf="!especialistaSeleccionado()" class="hint-text">
              Seleccioná un especialista para ver los días disponibles
            </small>
          </label>

          <!-- Hora -->
          <label>
            Horario
            <div class="horarios-container" *ngIf="horariosDisponibles().length > 0">
              <button
                type="button"
                *ngFor="let horario of horariosDisponibles()"
                class="horario-button"
                [class.selected]="horarioSeleccionado() === horario.id"
                (click)="seleccionarHorario(horario.id)"
              >
                {{ formatTime(horario.startAt) }}
              </button>
            </div>
            <small *ngIf="diaSeleccionado() && horariosDisponibles().length === 0" class="error-text">
              No hay horarios disponibles para este día.
            </small>
            <small *ngIf="!diaSeleccionado()" class="hint-text">
              Seleccioná un día para ver los horarios disponibles
            </small>
          </label>

          <div class="form-actions">
            <button type="button" class="btn secondary" routerLink="/bienvenida">Cancelar</button>
            <button
              type="submit"
              class="btn primary"
              [disabled]="form.invalid || loading() || !slotSeleccionado()"
            >
              {{ loading() ? "Reservando..." : "Reservar Turno" }}
            </button>
          </div>

          <p *ngIf="error()" class="error">{{ error() }}</p>
        </form>
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
      max-width: 800px;
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
    .form {
      padding: 2rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    label {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      font-size: 0.9rem;
      color: #475569;
    }
    input {
      padding: 0.65rem 0.75rem;
      border-radius: 0.5rem;
      border: 1px solid #cbd5e1;
      font-size: 0.95rem;
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    input:focus {
      border-color: #2563eb;
      box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.2);
    }
    input:disabled {
      background: #f1f5f9;
      cursor: not-allowed;
    }
    small {
      font-size: 0.85rem;
      margin-top: 0.25rem;
    }
    .error-text {
      color: #b91c1c;
    }
    .hint-text {
      color: #64748b;
    }
    .dias-container, .horarios-container {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
    .dia-button, .horario-button {
      padding: 0.65rem 1rem;
      border-radius: 0.5rem;
      border: 1px solid #cbd5e1;
      background: white;
      color: #475569;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.15s;
    }
    .dia-button:hover:not(.selected), .horario-button:hover:not(.selected) {
      border-color: #2563eb;
      background: #f8fafc;
    }
    .dia-button.selected, .horario-button.selected {
      background: #2563eb;
      color: white;
      border-color: #2563eb;
    }
    .form-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
      margin-top: 0.5rem;
    }
    .btn {
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      border: none;
      font-weight: 600;
      font-size: 0.95rem;
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
    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .error {
      margin: 0;
      padding: 0.75rem;
      background: #fee2e2;
      border: 1px solid #fecaca;
      border-radius: 0.5rem;
      color: #b91c1c;
      font-size: 0.9rem;
    }
    @media (max-width: 768px) {
      .page {
        padding: 1rem;
      }
      .form {
        padding: 1.5rem;
      }
    }
  `,
})
export class SolicitarTurnoComponent implements OnInit {
  private slotsService = inject(SlotsService);
  private appointmentsService = inject(AppointmentsService);
  private authService = inject(AuthService);
  private usersService = inject(UsersService);
  private router = inject(Router);

  // Datos cargados
  allSlots = signal<AppointmentSlot[]>([]);
  pacientes = signal<User[]>([]);

  // Búsquedas del usuario
  especialidadBusqueda = "";
  especialistaBusqueda = "";
  pacienteBusqueda = "";

  // Selecciones
  especialidadSeleccionada = signal<EspecialidadOption | null>(null);
  especialistaSeleccionado = signal<EspecialistaOption | null>(null);
  diaSeleccionado = signal<string | null>(null);
  horarioSeleccionado = signal<string | null>(null); // slotId

  // Estados
  loading = signal(false);
  error = signal("");

  esAdmin = computed(() => this.authService.currentUser()?.role === "ADMIN");

  especialidadesDisponibles = computed(() => {
    // Solo mostrar especialidades que tienen slots libres disponibles
    const slots = this.allSlots();
    const especialidadesMap = new Map<number, EspecialidadOption>();
    slots.forEach((slot) => {
      if (slot.especialidad && !especialidadesMap.has(slot.especialidad.id)) {
        especialidadesMap.set(slot.especialidad.id, {
          id: slot.especialidad.id,
          nombre: slot.especialidad.nombre,
        });
      }
    });
    return Array.from(especialidadesMap.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
  });

  especialidadesFiltradas = computed(() => {
    const busqueda = this.especialidadBusqueda.trim().toLowerCase();
    if (!busqueda) return this.especialidadesDisponibles();
    return this.especialidadesDisponibles().filter((e) =>
      e.nombre.toLowerCase().includes(busqueda),
    );
  });

  especialistasDisponibles = computed(() => {
    const slots = this.allSlots();
    const especialidadId = this.especialidadSeleccionada()?.id;
    if (!especialidadId) return [];

    const especialistasMap = new Map<number, EspecialistaOption>();
    slots.forEach((slot) => {
      if (
        slot.especialidadId === especialidadId &&
        slot.specialist &&
        !especialistasMap.has(slot.especialistaId)
      ) {
        especialistasMap.set(slot.especialistaId, {
          id: slot.especialistaId,
          nombre: slot.specialist.user.nombre,
          apellido: slot.specialist.user.apellido,
          especialidadId: slot.especialidadId,
          especialidadNombre: slot.especialidad?.nombre || "",
          userId: slot.specialist.userId,
        });
      }
    });
    return Array.from(especialistasMap.values()).sort((a, b) =>
      a.apellido.localeCompare(b.apellido),
    );
  });

  especialistasFiltrados = computed(() => {
    const busqueda = this.especialistaBusqueda.trim().toLowerCase();
    if (!busqueda) return this.especialistasDisponibles();
    return this.especialistasDisponibles().filter((e) => {
      const nombreCompleto = `${e.nombre} ${e.apellido}`.toLowerCase();
      return nombreCompleto.includes(busqueda);
    });
  });

  pacientesFiltrados = computed(() => {
    const busqueda = this.pacienteBusqueda.trim().toLowerCase();
    if (!busqueda) return this.pacientes();
    return this.pacientes().filter((p) => {
      const nombreCompleto = `${p.nombre} ${p.apellido}`.toLowerCase();
      return nombreCompleto.includes(busqueda) || p.email.toLowerCase().includes(busqueda);
    });
  });

  diasDisponibles = computed(() => {
    const especialistaId = this.especialistaSeleccionado()?.id;
    if (!especialistaId) return [];

    const slots = this.allSlots().filter(
      (s) => s.especialistaId === especialistaId && s.status === "FREE",
    );

    const diasMap = new Map<string, DiaOption>();
    const hoy = new Date();
    const en15Dias = new Date(hoy);
    en15Dias.setDate(hoy.getDate() + 15);

    slots.forEach((slot) => {
      const fecha = new Date(slot.date);
      if (fecha >= hoy && fecha <= en15Dias) {
        const fechaStr = slot.date;
        if (!diasMap.has(fechaStr)) {
          diasMap.set(fechaStr, {
            fecha: fechaStr,
            display: fecha.toLocaleDateString("es-AR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            }),
          });
        }
      }
    });

    return Array.from(diasMap.values()).sort((a, b) => a.fecha.localeCompare(b.fecha));
  });

  horariosDisponibles = computed(() => {
    const dia = this.diaSeleccionado();
    const especialistaId = this.especialistaSeleccionado()?.id;
    if (!dia || !especialistaId) return [];

    return this.allSlots()
      .filter(
        (s) =>
          s.especialistaId === especialistaId &&
          s.date === dia &&
          s.status === "FREE",
      )
      .sort((a, b) => a.startAt.localeCompare(b.startAt));
  });

  slotSeleccionado = computed(() => {
    return this.horarioSeleccionado();
  });

  get tieneEspecialidadesFiltradas(): boolean {
    return this.especialidadesFiltradas().length > 0;
  }
  
  get tieneEspecialistasFiltrados(): boolean {
    return this.especialistasFiltrados().length > 0;
  }
  
  get tienePacientesFiltrados(): boolean {
    return this.pacientesFiltrados().length > 0;
  }

  ngOnInit(): void {
    this.loadSlots();
    if (this.esAdmin()) {
      this.loadPacientes();
    }
  }

  loadSlots() {
    const hoy = new Date();
    const en15Dias = new Date(hoy);
    en15Dias.setDate(hoy.getDate() + 15);

    this.slotsService
      .getAvailableSlots({
        status: "FREE",
        dateFrom: hoy.toISOString().split("T")[0],
        dateTo: en15Dias.toISOString().split("T")[0],
      })
      .subscribe({
        next: (slots) => {
          this.allSlots.set(slots);
        },
        error: (error) => {
          console.error("[SolicitarTurno] Error al cargar slots:", error);
          this.error.set("Error al cargar turnos disponibles. Intentá nuevamente.");
        },
      });
  }

  loadPacientes() {
    this.usersService.getPatients().subscribe({
      next: (data) => {
        this.pacientes.set(data);
      },
      error: (error) => {
        console.error("[SolicitarTurno] Error al cargar pacientes:", error);
        this.error.set("Error al cargar pacientes. Intentá nuevamente.");
      },
    });
  }

  filtrarEspecialidades() {
    const busqueda = this.especialidadBusqueda.trim().toLowerCase();
    const encontrada = this.especialidadesDisponibles().find(
      (e) => e.nombre.toLowerCase() === busqueda,
    );

    if (encontrada) {
      this.especialidadSeleccionada.set(encontrada);
      this.especialistaBusqueda = "";
      this.diaSeleccionado.set(null);
      this.horarioSeleccionado.set(null);
    } else {
      this.especialidadSeleccionada.set(null);
      this.especialistaSeleccionado.set(null);
      this.diaSeleccionado.set(null);
      this.horarioSeleccionado.set(null);
    }
  }

  filtrarEspecialistas() {
    const busqueda = this.especialistaBusqueda.trim().toLowerCase();
    const encontrado = this.especialistasDisponibles().find((e) => {
      const nombreCompleto = `${e.nombre} ${e.apellido}`.toLowerCase();
      return nombreCompleto === busqueda;
    });

    if (encontrado) {
      this.especialistaSeleccionado.set(encontrado);
      this.diaSeleccionado.set(null);
      this.horarioSeleccionado.set(null);
    } else {
      this.especialistaSeleccionado.set(null);
      this.diaSeleccionado.set(null);
      this.horarioSeleccionado.set(null);
    }
  }

  filtrarPacientes() {
    // La selección se hace automáticamente cuando el usuario selecciona del datalist
    // Por ahora no implementamos lógica adicional
  }

  seleccionarDia(fecha: string) {
    this.diaSeleccionado.set(fecha);
    this.horarioSeleccionado.set(null);
  }

  seleccionarHorario(slotId: string) {
    this.horarioSeleccionado.set(slotId);
  }

  formatTime(dateTimeStr: string): string {
    const date = new Date(dateTimeStr);
    return date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  }

  onSubmit() {
    if (!this.slotSeleccionado()) {
      this.error.set("Seleccioná un horario disponible");
      return;
    }

    this.loading.set(true);
    this.error.set("");

    const pacienteId = this.esAdmin() ? this.getPacienteSeleccionadoId() : undefined;

    this.appointmentsService
      .createAppointment({
        slotId: this.slotSeleccionado()!,
        pacienteId,
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          const rol = this.authService.currentUser()?.role;
          if (rol === "PATIENT") {
            this.router.navigate(["/mis-turnos-paciente"]);
          } else if (rol === "ADMIN") {
            this.router.navigate(["/admin/turnos"]);
          } else {
            this.router.navigate(["/bienvenida"]);
          }
        },
        error: (error) => {
          console.error("[SolicitarTurno] Error al crear turno:", error);
          this.error.set(error.error?.message || "Error al reservar el turno. Intentá nuevamente.");
          this.loading.set(false);
        },
      });
  }

  private getPacienteSeleccionadoId(): string | undefined {
    const busqueda = this.pacienteBusqueda.trim();
    const encontrado = this.pacientes().find(
      (p) => `${p.nombre} ${p.apellido}` === busqueda || p.email === busqueda,
    );
    return encontrado?.id;
  }
}

