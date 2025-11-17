import jsPDF from "jspdf";
import type {
  LoginLog,
  TurnosPorEspecialidad,
  TurnosPorDia,
  TurnosPorMedico,
} from "../models/report.model";

interface ReportPDFOptions {
  desde?: string;
  hasta?: string;
  tipo: "logins" | "turnos-especialidad" | "turnos-dia" | "turnos-medico" | "turnos-finalizados-medico";
}

interface LoginsPDFData {
  tipo: "logins";
  datos: LoginLog[];
}

interface TurnosEspecialidadPDFData {
  tipo: "turnos-especialidad";
  datos: TurnosPorEspecialidad[];
  especialidadesMap: Map<number, string>;
}

interface TurnosDiaPDFData {
  tipo: "turnos-dia";
  datos: TurnosPorDia[];
}

interface TurnosMedicoPDFData {
  tipo: "turnos-medico" | "turnos-finalizados-medico";
  datos: TurnosPorMedico[];
  especialistasMap: Map<number, { nombre: string; apellido: string }>;
}

type ReportPDFData =
  | LoginsPDFData
  | TurnosEspecialidadPDFData
  | TurnosDiaPDFData
  | TurnosMedicoPDFData;

/**
 * Convierte una imagen a base64 usando fetch (más confiable que Image)
 */
async function getImageAsBase64(imgPath: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const normalizedPath = imgPath.startsWith("/") ? imgPath : `/${imgPath}`;
      const response = await fetch(normalizedPath);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => {
        reject(new Error(`Error al leer el blob: ${imgPath}`));
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Genera y descarga un PDF de reporte estadístico
 */
export async function generateReportPDF(
  data: ReportPDFData,
  options: ReportPDFOptions,
): Promise<void> {
  if (!data.datos || data.datos.length === 0) {
    alert("No hay datos para generar el PDF.");
    return;
  }

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  const checkNewPage = (requiredHeight: number) => {
    if (yPosition + requiredHeight > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Encabezado con logo
  try {
    const logoBase64 = await getImageAsBase64("assets/img/logo-clinica.png");
    const logoWidth = 30;
    const logoHeight = 20;
    doc.addImage(logoBase64, "PNG", margin, yPosition, logoWidth, logoHeight);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Clínica Online", margin + logoWidth + 10, yPosition + logoHeight / 2);
    yPosition += logoHeight + 10;
  } catch (error) {
    console.warn("[ReportPDF] Error al cargar logo, usando texto:", error);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("🏥 Clínica Online", margin, yPosition);
    yPosition += 10;
  }

  // Título del informe
  const titulos: Record<ReportPDFData["tipo"], string> = {
    logins: "Log de Ingresos al Sistema",
    "turnos-especialidad": "Turnos por Especialidad",
    "turnos-dia": "Turnos por Día",
    "turnos-medico": "Turnos por Médico",
    "turnos-finalizados-medico": "Turnos Finalizados por Médico",
  };

  doc.setFontSize(16);
  doc.text(titulos[data.tipo], margin, yPosition);
  yPosition += 10;

  // Período consultado
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const periodo =
    options.desde && options.hasta
      ? `Período: ${new Date(options.desde).toLocaleDateString("es-AR")} - ${new Date(options.hasta).toLocaleDateString("es-AR")}`
      : options.desde
        ? `Desde: ${new Date(options.desde).toLocaleDateString("es-AR")}`
        : options.hasta
          ? `Hasta: ${new Date(options.hasta).toLocaleDateString("es-AR")}`
          : "Todos los registros";

  doc.text(periodo, margin, yPosition);
  yPosition += 8;

  // Fecha de emisión
  const fechaEmision = new Date().toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  doc.text(`Fecha de emisión: ${fechaEmision}`, margin, yPosition);
  yPosition += 15;

  // Línea separadora
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 15;

  // Contenido según el tipo
  switch (data.tipo) {
    case "logins":
      generateLoginsPDF(doc, data, margin, pageWidth, pageHeight, yPosition, checkNewPage);
      break;
    case "turnos-especialidad":
      generateTurnosEspecialidadPDF(
        doc,
        data,
        margin,
        pageWidth,
        pageHeight,
        yPosition,
        checkNewPage,
      );
      break;
    case "turnos-dia":
      generateTurnosDiaPDF(doc, data, margin, pageWidth, pageHeight, yPosition, checkNewPage);
      break;
    case "turnos-medico":
    case "turnos-finalizados-medico":
      generateTurnosMedicoPDF(
        doc,
        data,
        margin,
        pageWidth,
        pageHeight,
        yPosition,
        checkNewPage,
      );
      break;
  }

  // Pie de página
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin - 20, pageHeight - 10);
  }

  // Generar nombre de archivo
  const fecha = new Date().toISOString().split("T")[0];
  const filename = `reporte-${data.tipo}-${fecha}.pdf`;
  doc.save(filename);
}

function generateLoginsPDF(
  doc: jsPDF,
  data: LoginsPDFData,
  margin: number,
  pageWidth: number,
  pageHeight: number,
  yPos: number,
  checkNewPage: (h: number) => boolean,
) {
  let yPosition = yPos;

  // Tabla de logins
  const tableHeaders = ["Usuario", "Email", "Rol", "Fecha y Hora"];
  const colWidths = [(pageWidth - 2 * margin) / 4, (pageWidth - 2 * margin) / 4, (pageWidth - 2 * margin) / 4, (pageWidth - 2 * margin) / 4];

  // Encabezado de tabla
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  let xPos = margin;
  tableHeaders.forEach((header, i) => {
    doc.text(header, xPos, yPosition);
    xPos += colWidths[i];
  });
  yPosition += 8;

  // Línea bajo encabezado
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 5;

  // Filas de datos
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  data.datos.forEach((log) => {
    checkNewPage(10);

    xPos = margin;
    const rowData = [
      `${log.user.nombre} ${log.user.apellido}`,
      log.user.email,
      log.user.role,
      new Date(log.createdAt).toLocaleString("es-AR"),
    ];

    rowData.forEach((cell, i) => {
      const maxWidth = colWidths[i] - 5;
      const lines = doc.splitTextToSize(cell, maxWidth);
      lines.forEach((line: string, lineIndex: number) => {
        doc.text(line, xPos, yPosition + lineIndex * 5);
      });
      xPos += colWidths[i];
    });

    yPosition += Math.max(...rowData.map((cell, i) => {
      const lines = doc.splitTextToSize(cell, colWidths[i] - 5);
      return lines.length * 5;
    })) + 3;
  });
}

function generateTurnosEspecialidadPDF(
  doc: jsPDF,
  data: TurnosEspecialidadPDFData,
  margin: number,
  pageWidth: number,
  pageHeight: number,
  yPos: number,
  checkNewPage: (h: number) => boolean,
) {
  let yPosition = yPos;

  // Mapear y ordenar datos
  const mappedData = data.datos
    .map((item) => ({
      nombre: data.especialidadesMap.get(item.especialidadId) || `Especialidad ${item.especialidadId}`,
      count: item._count._all,
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  // Tabla
  const tableHeaders = ["Especialidad", "Cantidad de Turnos"];
  const colWidths = [(pageWidth - 2 * margin) * 0.7, (pageWidth - 2 * margin) * 0.3];

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(tableHeaders[0], margin, yPosition);
  doc.text(tableHeaders[1], margin + colWidths[0], yPosition);
  yPosition += 8;

  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 5;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  mappedData.forEach((item) => {
    checkNewPage(8);
    doc.text(item.nombre, margin, yPosition);
    doc.text(item.count.toString(), margin + colWidths[0], yPosition);
    yPosition += 8;
  });
}

function generateTurnosDiaPDF(
  doc: jsPDF,
  data: TurnosDiaPDFData,
  margin: number,
  pageWidth: number,
  pageHeight: number,
  yPos: number,
  checkNewPage: (h: number) => boolean,
) {
  let yPosition = yPos;

  const tableHeaders = ["Fecha", "Cantidad de Turnos"];
  const colWidths = [(pageWidth - 2 * margin) * 0.6, (pageWidth - 2 * margin) * 0.4];

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(tableHeaders[0], margin, yPosition);
  doc.text(tableHeaders[1], margin + colWidths[0], yPosition);
  yPosition += 8;

  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 5;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  data.datos.forEach((item) => {
    checkNewPage(8);
    const fecha = new Date(item.date).toLocaleDateString("es-AR");
    doc.text(fecha, margin, yPosition);
    doc.text(item.count.toString(), margin + colWidths[0], yPosition);
    yPosition += 8;
  });
}

function generateTurnosMedicoPDF(
  doc: jsPDF,
  data: TurnosMedicoPDFData,
  margin: number,
  pageWidth: number,
  pageHeight: number,
  yPos: number,
  checkNewPage: (h: number) => boolean,
) {
  let yPosition = yPos;

  // Mapear y ordenar datos
  const mappedData = data.datos
    .map((item) => {
      const especialista = data.especialistasMap.get(item.especialistaId);
      return {
        nombre: especialista
          ? `${especialista.nombre} ${especialista.apellido}`
          : `Especialista ${item.especialistaId}`,
        count: item._count._all,
      };
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  const tableHeaders = ["Médico", "Cantidad de Turnos"];
  const colWidths = [(pageWidth - 2 * margin) * 0.7, (pageWidth - 2 * margin) * 0.3];

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(tableHeaders[0], margin, yPosition);
  doc.text(tableHeaders[1], margin + colWidths[0], yPosition);
  yPosition += 8;

  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 5;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  mappedData.forEach((item) => {
    checkNewPage(8);
    doc.text(item.nombre, margin, yPosition);
    doc.text(item.count.toString(), margin + colWidths[0], yPosition);
    yPosition += 8;
  });
}

