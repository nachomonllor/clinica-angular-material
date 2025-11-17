import jsPDF from "jspdf";
import type { MedicalRecord } from "../models/appointment.model";
import type { User } from "../models/user.model";

interface PDFOptions {
  paciente: User;
  records: MedicalRecord[];
}

/**
 * Convierte una imagen a base64 usando fetch (más confiable que Image)
 */
function getImageAsBase64(imgPath: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      // Normalizar la ruta
      const normalizedPath = imgPath.startsWith("/") ? imgPath : `/${imgPath}`;
      
      // Intentar cargar con fetch primero
      const response = await fetch(normalizedPath);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const base64String = reader.result as string;
        resolve(base64String);
      };
      
      reader.onerror = () => {
        // Si fetch falla, intentar con Image como fallback
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("No se pudo obtener el contexto del canvas"));
            return;
          }
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          try {
            const base64 = canvas.toDataURL("image/png");
            resolve(base64);
          } catch (error) {
            reject(error);
          }
        };
        img.onerror = () => {
          reject(new Error(`Error al cargar la imagen: ${imgPath}`));
        };
        img.src = imgPath;
      };
      
      reader.readAsDataURL(blob);
    } catch (error) {
      // Fallback: intentar con Image
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("No se pudo obtener el contexto del canvas"));
          return;
        }
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        try {
          const base64 = canvas.toDataURL("image/png");
          resolve(base64);
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => {
        reject(new Error(`Error al cargar la imagen: ${imgPath}`));
      };
      img.src = imgPath;
    }
  });
}

/**
 * Genera y descarga un PDF de historia clínica
 */
export async function generateMedicalHistoryPDF(options: PDFOptions): Promise<void> {
  const { paciente, records } = options;

  if (!records || records.length === 0) {
    alert("No hay registros médicos para generar el PDF.");
    return;
  }

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  // Función para agregar nueva página si es necesario
  const checkNewPage = (requiredHeight: number) => {
    if (yPosition + requiredHeight > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Cargar y agregar logo
  try {
    // Intentar cargar el logo desde assets (con diferentes rutas posibles)
    let logoBase64: string | null = null;
    const logoPaths = [
      "assets/img/logo-clinica.png",
      "/assets/img/logo-clinica.png",
      "./assets/img/logo-clinica.png",
    ];

    for (const logoPath of logoPaths) {
      try {
        logoBase64 = await getImageAsBase64(logoPath);
        break; // Si funciona, salir del loop
      } catch (err) {
        // Intentar siguiente ruta
        continue;
      }
    }

    if (logoBase64) {
      // Agregar logo a la izquierda
      const logoWidth = 30;
      const logoHeight = 20;
      doc.addImage(logoBase64, "PNG", margin, yPosition, logoWidth, logoHeight);
      
      // Título junto al logo
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("Clínica Online", margin + logoWidth + 10, yPosition + logoHeight / 2);
      
      yPosition += logoHeight + 10;
    } else {
      throw new Error("No se pudo cargar el logo desde ninguna ruta");
    }
  } catch (error) {
    console.warn("[PDF] Error al cargar logo, usando texto:", error);
    // Fallback: usar texto si falla la carga del logo
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("🏥 Clínica Online", margin, yPosition);
    yPosition += 10;
  }

  doc.setFontSize(16);
  doc.text("Historia Clínica", margin, yPosition);
  yPosition += 10;

  // Fecha de emisión
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
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
  yPosition += 10;

  // Datos del paciente
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Datos del Paciente", margin, yPosition);
  yPosition += 8;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Nombre: ${paciente.nombre} ${paciente.apellido}`, margin, yPosition);
  yPosition += 6;
  doc.text(`DNI: ${paciente.dni}`, margin, yPosition);
  yPosition += 6;
  doc.text(`Email: ${paciente.email}`, margin, yPosition);
  yPosition += 6;
  doc.text(`Edad: ${paciente.edad} años`, margin, yPosition);
  if (paciente.paciente?.obraSocial) {
    yPosition += 6;
    doc.text(`Obra Social: ${paciente.paciente.obraSocial}`, margin, yPosition);
  }
  yPosition += 12;

  // Línea separadora
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Registros médicos
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Registros Médicos", margin, yPosition);
  yPosition += 10;

  records.forEach((record, index) => {
    checkNewPage(60); // Espacio aproximado para cada registro

    // Número de registro
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Registro #${index + 1}`, margin, yPosition);
    yPosition += 7;

    // Fecha de atención
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const fechaAtencion = new Date(record.appointment.slot.date).toLocaleDateString("es-AR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    const horaAtencion = new Date(record.appointment.slot.startAt).toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    doc.text(`Fecha: ${fechaAtencion} - ${horaAtencion}`, margin, yPosition);
    yPosition += 6;

    // Especialidad
    doc.text(`Especialidad: ${record.appointment.especialidad.nombre}`, margin, yPosition);
    yPosition += 6;

    // Especialista
    doc.text(
      `Especialista: Dr/a. ${record.especialista.user.nombre} ${record.especialista.user.apellido}`,
      margin,
      yPosition,
    );
    yPosition += 8;

    // Datos de la consulta
    doc.setFont("helvetica", "bold");
    doc.text("Datos de la consulta:", margin, yPosition);
    yPosition += 6;

    doc.setFont("helvetica", "normal");
    doc.text(`  • Altura: ${record.altura} cm`, margin, yPosition);
    yPosition += 5;
    doc.text(`  • Peso: ${record.peso} kg`, margin, yPosition);
    yPosition += 5;
    doc.text(`  • Temperatura: ${record.temperatura} °C`, margin, yPosition);
    yPosition += 5;
    doc.text(`  • Presión: ${record.presion}`, margin, yPosition);
    yPosition += 6;

    // Datos dinámicos
    if (record.extraData && record.extraData.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.text("Datos adicionales:", margin, yPosition);
      yPosition += 6;

      doc.setFont("helvetica", "normal");
      record.extraData.forEach((extra) => {
        doc.text(`  • ${extra.clave}: ${extra.valor}`, margin, yPosition);
        yPosition += 5;
      });
      yPosition += 5;
    }

    // Separador entre registros (si no es el último)
    if (index < records.length - 1) {
      doc.setLineWidth(0.2);
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      doc.setDrawColor(0, 0, 0); // Resetear color
      yPosition += 10;
    }
  });

  // Pie de página
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth - margin - 20,
      pageHeight - 10,
    );
  }

  // Generar nombre de archivo
  const fecha = new Date().toISOString().split("T")[0];
  const nombreArchivo = `historia-clinica-${paciente.nombre.toLowerCase().replace(/\s+/g, "-")}-${paciente.apellido.toLowerCase().replace(/\s+/g, "-")}-${fecha}.pdf`;

  // Descargar PDF
  doc.save(nombreArchivo);
}

/**
 * Genera nombre de archivo PDF con fecha
 */
export function generatePDFFilename(
  prefix: string,
  pacienteNombre: string,
  pacienteApellido: string,
  extension: string = "pdf",
): string {
  const fecha = new Date().toISOString().split("T")[0];
  return `${prefix}-${pacienteNombre.toLowerCase()}-${pacienteApellido.toLowerCase()}-${fecha}.${extension}`;
}

