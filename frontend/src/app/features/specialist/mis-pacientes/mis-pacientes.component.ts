import { Component, OnInit, signal, computed, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MedicalRecordsService } from "../../../services/medical-records.service";
import { generateMedicalHistoryPDF } from "../../../utils/pdf.util";
import type { User } from "../../../models/user.model";
import type { MedicalRecord } from "../../../models/appointment.model";

@Component({
  selector: "app-mis-pacientes",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <main class="page">
      <section class="card">
        <header class="card-header">
          <h1>Mis Pacientes</h1>
          <p class="subtitle">Pacientes que has atendido</p>
        </header>

        <div class="toolbar">
          <input
            type="text"
            class="search-input"
            placeholder="Buscar por nombre o email..."
            [(ngModel)]="filtroTexto"
          />
        </div>

        <div *ngIf="loading()" class="loading">Cargando pacientes...</div>

        <div *ngIf="!loading() && pacientes().length === 0" class="empty">
          No tenés pacientes registrados aún.
        </div>

        <div *ngIf="!loading() && pacientesFiltrados().length > 0" class="patients-list">
          <div *ngFor="let paciente of pacientesFiltrados()" class="patient-card">
            <div class="patient-header">
              <div>
                <h3>{{ paciente.nombre }} {{ paciente.apellido }}</h3>
                <p class="patient-email">{{ paciente.email }}</p>
                <p *ngIf="paciente.paciente?.obraSocial" class="patient-obra">
                  Obra Social: {{ paciente.paciente?.obraSocial }}
                </p>
              </div>
              <button
                class="btn primary"
                (click)="verHistoriaClinica(paciente)"
              >
                Ver Historia
              </button>
            </div>
          </div>
        </div>
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
          No tenés registros médicos de este paciente aún.
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
      border-color: #7c3aed;
      box-shadow: 0 0 0 1px rgba(124, 58, 237, 0.2);
    }
    .loading, .empty {
      padding: 3rem 2rem;
      text-align: center;
      color: #64748b;
      font-size: 1rem;
    }
    .patients-list {
      padding: 1.5rem 2rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .patient-card {
      padding: 1.25rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      background: #f8fafc;
      transition: all 0.15s;
    }
    .patient-card:hover {
      border-color: #cbd5e1;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }
    .patient-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .patient-header h3 {
      margin: 0 0 0.5rem;
      font-size: 1.2rem;
      color: #0f172a;
    }
    .patient-email {
      margin: 0.25rem 0;
      color: #64748b;
      font-size: 0.9rem;
    }
    .patient-obra {
      margin: 0.25rem 0 0;
      color: #475569;
      font-size: 0.9rem;
      font-weight: 500;
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
      background: #7c3aed;
      color: white;
      box-shadow: 0 8px 18px rgba(124, 58, 237, 0.35);
    }
    .btn.primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 12px 24px rgba(124, 58, 237, 0.45);
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
      .patient-header {
        flex-direction: column;
        align-items: stretch;
      }
      .btn {
        width: 100%;
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
export class MisPacientesComponent implements OnInit {
  private medicalRecordsService = inject(MedicalRecordsService);

  pacientes = signal<(User & { paciente?: { obraSocial: string } })[]>([]);
  filtroTexto = "";
  loading = signal(false);

  // Historia Clínica
  selectedPatient = signal<(User & { paciente?: { obraSocial: string } }) | null>(null);
  patientMedicalRecords = signal<MedicalRecord[]>([]);
  loadingMedicalHistory = signal(false);
  showMedicalHistoryDialog = signal(false);
  descargandoPDF = signal(false);

  pacientesFiltrados = computed(() => {
    const filter = this.filtroTexto.toLowerCase();
    if (!filter) {
      return this.pacientes();
    }
    return this.pacientes().filter((p) => {
      const nombreCompleto = `${p.nombre} ${p.apellido}`.toLowerCase();
      return nombreCompleto.includes(filter) || p.email.toLowerCase().includes(filter);
    });
  });

  ngOnInit(): void {
    this.loadPacientes();
  }

  loadPacientes() {
    this.loading.set(true);
    this.medicalRecordsService.getSpecialistPatients().subscribe({
      next: (data) => {
        this.pacientes.set(data);
        this.loading.set(false);
      },
      error: (error) => {
        console.error("[MisPacientes] Error al cargar pacientes:", error);
        this.loading.set(false);
        alert("Error al cargar los pacientes. Intentá nuevamente.");
      },
    });
  }

  verHistoriaClinica(paciente: User & { paciente?: { obraSocial: string } }) {
    this.selectedPatient.set(paciente);
    this.showMedicalHistoryDialog.set(true);
    this.loadingMedicalHistory.set(true);
    this.patientMedicalRecords.set([]);

    this.medicalRecordsService.getSpecialistPatientHistory(paciente.id).subscribe({
      next: (records) => {
        this.patientMedicalRecords.set(records);
        this.loadingMedicalHistory.set(false);
      },
      error: (error) => {
        console.error("[MisPacientes] Error al cargar historia clínica:", error);
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
      console.error("[MisPacientes] Error al generar PDF:", error);
      alert("Error al generar el PDF. Intentá nuevamente.");
    } finally {
      this.descargandoPDF.set(false);
    }
  }
}

