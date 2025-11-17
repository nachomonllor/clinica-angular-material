import { Injectable, BadRequestException } from "@nestjs/common";
import * as fs from "fs/promises";
import * as path from "path";

export interface UploadResult {
  filename: string;
  url: string;
  path: string;
}

@Injectable()
export class StorageService {
  private readonly uploadsDir: string;
  private readonly profilesDir: string;
  private readonly storageType: "local" | "s3" | "r2";
  private readonly baseUrl: string;

  constructor() {
    // Determinar tipo de almacenamiento
    this.storageType = (process.env.STORAGE_TYPE as "local" | "s3" | "r2") || "local";

    // Directorio base de uploads (solo para local)
    const uploadsBaseDir = process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");
    this.uploadsDir = uploadsBaseDir;
    this.profilesDir = path.join(this.uploadsDir, "profiles");

    // URL base para servir archivos
    this.baseUrl = process.env.STORAGE_BASE_URL || "/uploads";

    // Crear directorios si no existen (solo para local)
    if (this.storageType === "local") {
      this.ensureDirectoriesExist();
    }
  }

  private async ensureDirectoriesExist(): Promise<void> {
    try {
      await fs.mkdir(this.uploadsDir, { recursive: true });
      await fs.mkdir(this.profilesDir, { recursive: true });
    } catch (error) {
      console.error("[StorageService] Error al crear directorios:", error);
    }
  }

  async uploadProfileImage(
    file: Express.Multer.File,
    userId: string,
  ): Promise<UploadResult> {
    // Validar tipo de archivo
    const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(
        "Tipo de archivo no permitido. Solo se permiten imágenes (JPEG, PNG, WebP)",
      );
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException("La imagen es demasiado grande. Máximo 5MB");
    }

    // Generar nombre único
    const extension = path.extname(file.originalname);
    const filename = `${userId}-${Date.now()}${extension}`;

    if (this.storageType === "local") {
      // Guardar en almacenamiento local
      const filePath = path.join(this.profilesDir, filename);
      await fs.writeFile(filePath, file.buffer);

      const url = `${this.baseUrl}/profiles/${filename}`;
      return {
        filename,
        url,
        path: filePath,
      };
    } else if (this.storageType === "s3" || this.storageType === "r2") {
      // TODO: Implementar upload a S3/R2
      throw new BadRequestException("Almacenamiento S3/R2 aún no implementado");
    } else {
      throw new BadRequestException(`Tipo de almacenamiento no soportado: ${this.storageType}`);
    }
  }

  async deleteProfileImage(filename: string): Promise<void> {
    if (this.storageType === "local") {
      const filePath = path.join(this.profilesDir, filename);
      try {
        await fs.unlink(filePath);
      } catch (error) {
        // Si el archivo no existe, no hacer nada
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
          console.error("[StorageService] Error al eliminar archivo:", error);
        }
      }
    } else if (this.storageType === "s3" || this.storageType === "r2") {
      // TODO: Implementar eliminación de S3/R2
      throw new BadRequestException("Almacenamiento S3/R2 aún no implementado");
    }
  }

  getStorageType(): string {
    return this.storageType;
  }
}
