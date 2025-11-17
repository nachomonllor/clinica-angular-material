import * as XLSX from "xlsx";

export interface ExcelExportOptions {
  filename: string;
  sheetName?: string;
}

/**
 * Genera y descarga un archivo Excel a partir de datos
 */
export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  options: ExcelExportOptions,
): void {
  if (!data || data.length === 0) {
    alert("No hay datos para exportar.");
    return;
  }

  // Crear workbook
  const wb = XLSX.utils.book_new();

  // Convertir datos a worksheet
  const ws = XLSX.utils.json_to_sheet(data);

  // Ajustar anchos de columnas
  const colWidths = Object.keys(data[0]).map((key) => {
    const maxLength = Math.max(
      key.length,
      ...data.map((row) => String(row[key] || "").length),
    );
    return { wch: Math.min(Math.max(maxLength + 2, 10), 50) }; // Min 10, max 50
  });
  ws["!cols"] = colWidths;

  // Agregar worksheet al workbook
  XLSX.utils.book_append_sheet(wb, ws, options.sheetName || "Datos");

  // Generar archivo y descargar
  XLSX.writeFile(wb, options.filename);
}

/**
 * Genera nombre de archivo con fecha actual
 */
export function generateFilename(prefix: string, extension: string = "xlsx"): string {
  const now = new Date();
  const fecha = now.toISOString().split("T")[0]; // YYYY-MM-DD
  return `${prefix}-${fecha}.${extension}`;
}

