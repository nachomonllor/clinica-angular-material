import { Component, OnInit, signal, inject, ViewChild, ElementRef, AfterViewInit, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { HttpClient } from "@angular/common/http";
import { ReportsService } from "../../../services/reports.service";
import { SlotsService } from "../../../services/slots.service";
import { UsersService } from "../../../services/users.service";
import { StatusLabelPipe } from "../../../pipes/status-label.pipe";
import { RoleLabelPipe } from "../../../pipes/role-label.pipe";
import { LocalDatePipe } from "../../../pipes/local-date.pipe";
import { StatusBadgeDirective } from "../../../directives/status-badge.directive";
import { ElevateOnHoverDirective } from "../../../directives/elevate-on-hover.directive";
import { AutoFocusDirective } from "../../../directives/auto-focus.directive";
import { exportToExcel, generateFilename } from "../../../utils/excel.util";
import { generateReportPDF } from "../../../utils/reports-pdf.util";
import type {
  LoginLog,
  TurnosPorEspecialidad,
  TurnosPorDia,
  TurnosPorMedico,
  QueryReportParams,
} from "../../../models/report.model";
import type { User } from "../../../models/user.model";
import type { Specialty } from "../../../services/slots.service";
import {
  Chart,
  ChartConfiguration,
  ChartType,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  BarController,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

import { API_BASE_URL } from "../../../utils/api-config";

// Registrar componentes de Chart.js
Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  BarController,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
);

type TabType = "logins" | "turnos-especialidad" | "turnos-dia" | "turnos-medico" | "turnos-finalizados-medico";

@Component({
  selector: "app-estadisticas",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    StatusLabelPipe,
    RoleLabelPipe,
    LocalDatePipe,
    StatusBadgeDirective,
    ElevateOnHoverDirective,
    AutoFocusDirective,
  ],
  templateUrl: "./estadisticas.component.html",
  styleUrl: "./estadisticas.component.scss",
})
export class EstadisticasComponent implements OnInit, AfterViewInit, OnDestroy {
  private reportsService = inject(ReportsService);
  private slotsService = inject(SlotsService);
  private usersService = inject(UsersService);
  private http = inject(HttpClient);

  // Tabs
  activeTab = signal<TabType>("logins");
  
  // Filtros
  desde = signal<string>("");
  hasta = signal<string>("");

  // Datos
  logins = signal<LoginLog[]>([]);
  turnosPorEspecialidad = signal<TurnosPorEspecialidad[]>([]);
  turnosPorDia = signal<TurnosPorDia[]>([]);
  turnosPorMedico = signal<TurnosPorMedico[]>([]);
  turnosFinalizadosPorMedico = signal<TurnosPorMedico[]>([]);

  // Datos auxiliares para mapear IDs a nombres
  especialidades = signal<Map<number, string>>(new Map());
  especialistas = signal<Map<number, { nombre: string; apellido: string }>>(new Map());

  // Estados de carga
  loading = signal<Record<TabType, boolean>>({
    logins: false,
    "turnos-especialidad": false,
    "turnos-dia": false,
    "turnos-medico": false,
    "turnos-finalizados-medico": false,
  });

  // Gráficos
  chartRefs: Record<string, Chart | null> = {};

  async ngOnInit(): Promise<void> {
    // Establecer fechas por defecto (últimos 30 días)
    const hoy = new Date();
    const hace30Dias = new Date(hoy);
    hace30Dias.setDate(hoy.getDate() - 30);

    this.desde.set(hace30Dias.toISOString().split("T")[0]);
    this.hasta.set(hoy.toISOString().split("T")[0]);

    // Cargar datos auxiliares para mapear IDs a nombres
    await this.loadAuxiliaryData();

    // Cargar datos iniciales
    this.loadData();
  }

  ngAfterViewInit(): void {
    // Los gráficos se crearán después de que se carguen los datos
  }

  ngOnDestroy(): void {
    // Destruir todos los gráficos al salir del componente
    Object.values(this.chartRefs).forEach((chart) => {
      if (chart) {
        chart.destroy();
      }
    });
  }

  async loadAuxiliaryData(): Promise<void> {
    // Cargar especialidades
    try {
      const especialidades = await this.slotsService.getAllAvailableSpecialties().toPromise();
      if (especialidades) {
        const map = new Map<number, string>();
        especialidades.forEach((esp) => {
          map.set(esp.id, esp.nombre);
        });
        this.especialidades.set(map);
      }
    } catch (error) {
      console.error("[Estadisticas] Error al cargar especialidades:", error);
    }

    // Cargar especialistas
    try {
      const especialistas = await this.http
        .get<User[]>(`${API_BASE_URL}/admin/users?role=SPECIALIST`, {
          withCredentials: true,
        })
        .toPromise();
      if (especialistas) {
        const map = new Map<number, { nombre: string; apellido: string }>();
        especialistas.forEach((user) => {
          if (user.especialista?.id) {
            map.set(user.especialista.id, {
              nombre: user.nombre,
              apellido: user.apellido,
            });
          }
        });
        this.especialistas.set(map);
      }
    } catch (error) {
      console.error("[Estadisticas] Error al cargar especialistas:", error);
    }
  }

  loadData() {
    const params: QueryReportParams = {
      desde: this.desde() || undefined,
      hasta: this.hasta() || undefined,
    };

    // Cargar según el tab activo
    const currentTab = this.activeTab();
    this.loadTabData(currentTab, params);
  }

  loadTabData(tab: TabType, params: QueryReportParams) {
    this.loading.set({ ...this.loading(), [tab]: true });

    switch (tab) {
      case "logins":
        this.reportsService.getLogins(params).subscribe({
          next: (data) => {
            this.logins.set(data);
            this.loading.set({ ...this.loading(), logins: false });
          },
          error: (error) => {
            console.error("[Estadisticas] Error al cargar logins:", error);
            this.loading.set({ ...this.loading(), logins: false });
          },
        });
        break;

      case "turnos-especialidad":
        this.reportsService.getTurnosPorEspecialidad(params).subscribe({
          next: (data) => {
            this.turnosPorEspecialidad.set(data);
            this.loading.set({ ...this.loading(), "turnos-especialidad": false });
            setTimeout(() => this.createChart("turnos-especialidad"), 100);
          },
          error: (error) => {
            console.error("[Estadisticas] Error al cargar turnos por especialidad:", error);
            this.loading.set({ ...this.loading(), "turnos-especialidad": false });
          },
        });
        break;

      case "turnos-dia":
        this.reportsService.getTurnosPorDia(params).subscribe({
          next: (data) => {
            this.turnosPorDia.set(data);
            this.loading.set({ ...this.loading(), "turnos-dia": false });
            setTimeout(() => this.createChart("turnos-dia"), 100);
          },
          error: (error) => {
            console.error("[Estadisticas] Error al cargar turnos por día:", error);
            this.loading.set({ ...this.loading(), "turnos-dia": false });
          },
        });
        break;

      case "turnos-medico":
        this.reportsService.getTurnosPorMedico({ ...params, soloFinalizados: false }).subscribe({
          next: (data) => {
            this.turnosPorMedico.set(data);
            this.loading.set({ ...this.loading(), "turnos-medico": false });
            setTimeout(() => this.createChart("turnos-medico"), 100);
          },
          error: (error) => {
            console.error("[Estadisticas] Error al cargar turnos por médico:", error);
            this.loading.set({ ...this.loading(), "turnos-medico": false });
          },
        });
        break;

      case "turnos-finalizados-medico":
        this.reportsService.getTurnosFinalizadosPorMedico(params).subscribe({
          next: (data) => {
            this.turnosFinalizadosPorMedico.set(data);
            this.loading.set({ ...this.loading(), "turnos-finalizados-medico": false });
            setTimeout(() => this.createChart("turnos-finalizados-medico"), 100);
          },
          error: (error) => {
            console.error("[Estadisticas] Error al cargar turnos finalizados por médico:", error);
            this.loading.set({ ...this.loading(), "turnos-finalizados-medico": false });
          },
        });
        break;
    }
  }

  changeTab(tab: TabType) {
    this.activeTab.set(tab);
    this.loadData();
  }

  applyFilters() {
    this.loadData();
  }

  clearFilters() {
    const hoy = new Date();
    const hace30Dias = new Date(hoy);
    hace30Dias.setDate(hoy.getDate() - 30);

    this.desde.set(hace30Dias.toISOString().split("T")[0]);
    this.hasta.set(hoy.toISOString().split("T")[0]);
    this.loadData();
  }

  createChart(chartType: string) {
    // Esperar un poco para asegurar que el DOM esté listo
    setTimeout(() => {
      // Destruir gráfico anterior si existe
      if (this.chartRefs[chartType]) {
        this.chartRefs[chartType]?.destroy();
        this.chartRefs[chartType] = null;
      }

      const canvasId = `chart-${chartType}`;
      const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
      if (!canvas) {
        console.error(`[Estadisticas] No se encontró el canvas: ${canvasId}`);
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        console.error(`[Estadisticas] No se pudo obtener el contexto 2D del canvas: ${canvasId}`);
        return;
      }

      let config: ChartConfiguration | null = null;

      switch (chartType) {
        case "turnos-especialidad":
          if (this.turnosPorEspecialidad().length === 0) return;
          config = this.createChartTurnosPorEspecialidad();
          break;
        case "turnos-dia":
          if (this.turnosPorDia().length === 0) return;
          config = this.createChartTurnosPorDia();
          break;
        case "turnos-medico":
          if (this.turnosPorMedico().length === 0) return;
          config = this.createChartTurnosPorMedico(false);
          break;
        case "turnos-finalizados-medico":
          if (this.turnosFinalizadosPorMedico().length === 0) return;
          config = this.createChartTurnosPorMedico(true);
          break;
        default:
          console.error(`[Estadisticas] Tipo de gráfico no reconocido: ${chartType}`);
          return;
      }

      if (config) {
        this.chartRefs[chartType] = new Chart(ctx, config);
      }
    }, 50);
  }

  createChartTurnosPorEspecialidad(): ChartConfiguration {
    const data = this.turnosPorEspecialidad();
    const especialidadesMap = this.especialidades();

    // Mapear datos con nombres de especialidades
    const mappedData = data.map((item) => ({
      nombre: especialidadesMap.get(item.especialidadId) || `Especialidad ${item.especialidadId}`,
      count: item._count._all,
    }));

    // Ordenar por nombre
    mappedData.sort((a, b) => a.nombre.localeCompare(b.nombre));

    const labels = mappedData.map((item) => item.nombre);
    const counts = mappedData.map((item) => item.count);

    return {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Cantidad de Turnos",
            data: counts,
            backgroundColor: "rgba(37, 99, 235, 0.6)",
            borderColor: "rgba(37, 99, 235, 1)",
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: "Turnos por Especialidad",
            font: { size: 16, weight: "bold" },
          },
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
            },
          },
        },
      },
    };
  }

  createChartTurnosPorDia(): ChartConfiguration {
    const data = this.turnosPorDia();
    
    const labels = data.map((item) => {
      const date = new Date(item.date);
      return date.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
    });

    const counts = data.map((item) => item.count);

    return {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Cantidad de Turnos",
            data: counts,
            borderColor: "rgba(37, 99, 235, 1)",
            backgroundColor: "rgba(37, 99, 235, 0.1)",
            borderWidth: 2,
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: "Turnos por Día (Tendencia)",
            font: { size: 16, weight: "bold" },
          },
          legend: {
            display: true,
            position: "top",
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
            },
          },
        },
      },
    };
  }

  createChartTurnosPorMedico(onlyFinalizados: boolean): ChartConfiguration {
    const data = onlyFinalizados ? this.turnosFinalizadosPorMedico() : this.turnosPorMedico();
    const especialistasMap = this.especialistas();

    // Mapear datos con nombres de especialistas
    const mappedData = data.map((item) => {
      const especialista = especialistasMap.get(item.especialistaId);
      return {
        nombre: especialista
          ? `${especialista.nombre} ${especialista.apellido}`
          : `Especialista ${item.especialistaId}`,
        count: item._count._all,
      };
    });

    // Ordenar por nombre
    mappedData.sort((a, b) => a.nombre.localeCompare(b.nombre));

    const labels = mappedData.map((item) => item.nombre);
    const counts = mappedData.map((item) => item.count);

    return {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: onlyFinalizados ? "Turnos Finalizados" : "Total de Turnos",
            data: counts,
            backgroundColor: onlyFinalizados ? "rgba(16, 185, 129, 0.6)" : "rgba(124, 58, 237, 0.6)",
            borderColor: onlyFinalizados ? "rgba(16, 185, 129, 1)" : "rgba(124, 58, 237, 1)",
            borderWidth: 2,
          },
        ],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: onlyFinalizados ? "Turnos Finalizados por Médico" : "Turnos por Médico",
            font: { size: 16, weight: "bold" },
          },
          legend: {
            display: false,
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
            },
          },
        },
      },
    };
  }

  descargarExcel() {
    const tab = this.activeTab();
    const params: QueryReportParams = {
      desde: this.desde() || undefined,
      hasta: this.hasta() || undefined,
    };

    try {
      switch (tab) {
        case "logins":
          this.descargarExcelLogins();
          break;
        case "turnos-especialidad":
          this.descargarExcelTurnosPorEspecialidad();
          break;
        case "turnos-dia":
          this.descargarExcelTurnosPorDia();
          break;
        case "turnos-medico":
          this.descargarExcelTurnosPorMedico(false);
          break;
        case "turnos-finalizados-medico":
          this.descargarExcelTurnosPorMedico(true);
          break;
      }
    } catch (error) {
      console.error("[Estadisticas] Error al descargar Excel:", error);
      alert("Error al generar el archivo Excel. Intentá nuevamente.");
    }
  }

  descargarExcelLogins() {
    const logins = this.logins();
    if (logins.length === 0) {
      alert("No hay datos para exportar.");
      return;
    }

    const datosExcel = logins.map((log) => ({
      Usuario: `${log.user.nombre} ${log.user.apellido}`,
      Email: log.user.email,
      Rol: log.user.role,
      "Fecha y Hora": new Date(log.createdAt).toLocaleString("es-AR"),
    }));

    const filename = generateFilename("logins");
    exportToExcel(datosExcel, { filename, sheetName: "Log de Ingresos" });
  }

  descargarExcelTurnosPorEspecialidad() {
    const data = this.turnosPorEspecialidad();
    const especialidadesMap = this.especialidades();

    if (data.length === 0) {
      alert("No hay datos para exportar.");
      return;
    }

    const datosExcel = data
      .map((item) => ({
        Especialidad: especialidadesMap.get(item.especialidadId) || `Especialidad ${item.especialidadId}`,
        Cantidad: item._count._all,
      }))
      .sort((a, b) => a.Especialidad.localeCompare(b.Especialidad));

    const filename = generateFilename("turnos-por-especialidad");
    exportToExcel(datosExcel, { filename, sheetName: "Turnos por Especialidad" });
  }

  descargarExcelTurnosPorDia() {
    const data = this.turnosPorDia();

    if (data.length === 0) {
      alert("No hay datos para exportar.");
      return;
    }

    const datosExcel = data.map((item) => ({
      Fecha: new Date(item.date).toLocaleDateString("es-AR"),
      Cantidad: item.count,
    }));

    const filename = generateFilename("turnos-por-dia");
    exportToExcel(datosExcel, { filename, sheetName: "Turnos por Día" });
  }

  descargarExcelTurnosPorMedico(onlyFinalizados: boolean) {
    const data = onlyFinalizados ? this.turnosFinalizadosPorMedico() : this.turnosPorMedico();
    const especialistasMap = this.especialistas();

    if (data.length === 0) {
      alert("No hay datos para exportar.");
      return;
    }

    const datosExcel = data
      .map((item) => {
        const especialista = especialistasMap.get(item.especialistaId);
        return {
          Médico: especialista
            ? `${especialista.nombre} ${especialista.apellido}`
            : `Especialista ${item.especialistaId}`,
          Cantidad: item._count._all,
        };
      })
      .sort((a, b) => a.Médico.localeCompare(b.Médico));

    const filename = generateFilename(
      onlyFinalizados ? "turnos-finalizados-por-medico" : "turnos-por-medico",
    );
    exportToExcel(datosExcel, {
      filename,
      sheetName: onlyFinalizados ? "Turnos Finalizados por Médico" : "Turnos por Médico",
    });
  }

  async descargarPDF() {
    const tab = this.activeTab();
    const params: QueryReportParams = {
      desde: this.desde() || undefined,
      hasta: this.hasta() || undefined,
    };

    try {
      switch (tab) {
        case "logins":
          await generateReportPDF(
            {
              tipo: "logins",
              datos: this.logins(),
            },
            { ...params, tipo: "logins" },
          );
          break;
        case "turnos-especialidad":
          await generateReportPDF(
            {
              tipo: "turnos-especialidad",
              datos: this.turnosPorEspecialidad(),
              especialidadesMap: this.especialidades(),
            },
            { ...params, tipo: "turnos-especialidad" },
          );
          break;
        case "turnos-dia":
          await generateReportPDF(
            {
              tipo: "turnos-dia",
              datos: this.turnosPorDia(),
            },
            { ...params, tipo: "turnos-dia" },
          );
          break;
        case "turnos-medico":
          await generateReportPDF(
            {
              tipo: "turnos-medico",
              datos: this.turnosPorMedico(),
              especialistasMap: this.especialistas(),
            },
            { ...params, tipo: "turnos-medico" },
          );
          break;
        case "turnos-finalizados-medico":
          await generateReportPDF(
            {
              tipo: "turnos-finalizados-medico",
              datos: this.turnosFinalizadosPorMedico(),
              especialistasMap: this.especialistas(),
            },
            { ...params, tipo: "turnos-finalizados-medico" },
          );
          break;
      }
    } catch (error) {
      console.error("[Estadisticas] Error al generar PDF:", error);
      alert("Error al generar el PDF. Intentá nuevamente.");
    }
  }

  descargarGrafico() {
    const tab = this.activeTab();
    const chartKey = tab === "turnos-dia" 
      ? "turnos-dia"
      : tab === "turnos-especialidad"
        ? "turnos-especialidad"
        : tab === "turnos-medico"
          ? "turnos-medico"
          : tab === "turnos-finalizados-medico"
            ? "turnos-finalizados-medico"
            : null;

    if (!chartKey) {
      alert("No hay gráfico disponible para descargar.");
      return;
    }

    const chart = this.chartRefs[chartKey];
    if (!chart) {
      alert("El gráfico aún no se ha cargado. Esperá un momento e intentá nuevamente.");
      return;
    }

    try {
      // Obtener la URL del canvas como imagen
      const url = chart.toBase64Image("image/png", 1.0);
      
      // Crear un elemento <a> temporal para descargar
      const link = document.createElement("a");
      link.href = url;
      link.download = `grafico-${chartKey}-${new Date().toISOString().split("T")[0]}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("[Estadisticas] Error al descargar gráfico:", error);
      alert("Error al descargar el gráfico. Intentá nuevamente.");
    }
  }
}

