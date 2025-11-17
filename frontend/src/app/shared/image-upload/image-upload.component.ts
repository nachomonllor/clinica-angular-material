import { Component, Input, Output, EventEmitter, signal, inject, ViewChild, ElementRef, OnInit, OnChanges, SimpleChanges } from "@angular/core";
import { CommonModule } from "@angular/common";
import { StorageService } from "../../services/storage.service";

@Component({
  selector: "app-image-upload",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="image-upload-container">
      <label class="upload-label">
        {{ label || "Imagen de perfil" }}
        <input
          #fileInput
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          (change)="onFileSelected($event)"
          style="display: none"
        />
      </label>

      <div class="preview-container">
        <!-- Preview de la imagen actual o nueva -->
        <div *ngIf="previewUrl()" class="image-preview">
          <img [src]="previewUrl()!" alt="Preview" />
          <button type="button" class="remove-btn" (click)="removeImage()" *ngIf="!disabled">
            ✕
          </button>
        </div>

        <!-- Placeholder cuando no hay imagen -->
        <div *ngIf="!previewUrl()" class="placeholder">
          <span>Sin imagen</span>
        </div>
      </div>

      <div class="actions" *ngIf="!disabled">
        <button type="button" class="btn-select" (click)="fileInput.click()" [disabled]="uploading() || disabled">
          {{ uploading() ? "Subiendo..." : previewUrl() ? "Cambiar imagen" : "Seleccionar imagen" }}
        </button>
        <button
          type="button"
          class="btn-remove"
          (click)="removeImage()"
          *ngIf="previewUrl()"
          [disabled]="uploading() || disabled"
        >
          Eliminar
        </button>
      </div>

      <div *ngIf="error()" class="error-message">
        {{ error() }}
      </div>

      <small class="hint">
        Formatos permitidos: JPEG, PNG, WebP. Tamaño máximo: 5MB
      </small>
    </div>
  `,
  styles: `
    .image-upload-container {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .upload-label {
      font-size: 0.9rem;
      font-weight: 500;
      color: #475569;
      display: block;
    }
    .preview-container {
      width: 150px;
      height: 150px;
      border: 2px dashed #cbd5e1;
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      background: #f8fafc;
      position: relative;
    }
    .image-preview {
      width: 100%;
      height: 100%;
      position: relative;
    }
    .image-preview img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .remove-btn {
      position: absolute;
      top: 0.25rem;
      right: 0.25rem;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: none;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
      transition: background 0.15s;
    }
    .remove-btn:hover {
      background: rgba(0, 0, 0, 0.9);
    }
    .placeholder {
      color: #94a3b8;
      font-size: 0.85rem;
      text-align: center;
      padding: 1rem;
    }
    .actions {
      display: flex;
      gap: 0.5rem;
    }
    .btn-select,
    .btn-remove {
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      border: 1px solid #cbd5e1;
      background: white;
      color: #475569;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.15s;
    }
    .btn-select:hover:not(:disabled) {
      background: #f1f5f9;
      border-color: #94a3b8;
    }
    .btn-remove {
      color: #b91c1c;
      border-color: #fecaca;
    }
    .btn-remove:hover:not(:disabled) {
      background: #fee2e2;
    }
    .btn-select:disabled,
    .btn-remove:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .error-message {
      color: #b91c1c;
      font-size: 0.85rem;
      padding: 0.5rem;
      background: #fee2e2;
      border: 1px solid #fecaca;
      border-radius: 0.5rem;
    }
    .hint {
      color: #64748b;
      font-size: 0.75rem;
    }
  `,
})
export class ImageUploadComponent implements OnInit, OnChanges {
  private storageService = inject(StorageService);

  @Input() label = "Imagen de perfil";
  @Input() currentImageUrl: string | null | undefined = null;
  @Input() disabled: boolean = false;

  @Output() imageUploaded = new EventEmitter<{ filename: string; url: string }>();
  @Output() imageRemoved = new EventEmitter<void>();

  @ViewChild("fileInput") fileInput!: ElementRef<HTMLInputElement>;

  previewUrl = signal<string | null>(null);
  uploading = signal(false);
  error = signal<string | null>(null);

  ngOnInit() {
    // Cargar imagen actual si existe
    if (this.currentImageUrl) {
      this.previewUrl.set(this.storageService.getImageUrl(this.currentImageUrl));
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    // Actualizar preview cuando cambia currentImageUrl
    if (changes['currentImageUrl']) {
      if (this.currentImageUrl) {
        this.previewUrl.set(this.storageService.getImageUrl(this.currentImageUrl));
      } else {
        this.previewUrl.set(null);
      }
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    // Validar tipo de archivo
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      this.error.set("Tipo de archivo no permitido. Solo se permiten imágenes JPEG, PNG o WebP.");
      return;
    }

    // Validar tamaño (5MB máximo)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      this.error.set("La imagen es demasiado grande. Tamaño máximo: 5MB.");
      return;
    }

    // Mostrar preview local antes de subir
    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewUrl.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Subir imagen al servidor
    this.uploadImage(file);
  }

  private uploadImage(file: File) {
    this.uploading.set(true);
    this.error.set(null);

    this.storageService.uploadProfileImage(file).subscribe({
      next: (response) => {
        this.uploading.set(false);
        const fullUrl = this.storageService.getImageUrl(response.url);
        this.previewUrl.set(fullUrl);
        this.imageUploaded.emit({
          filename: response.filename,
          url: response.url,
        });
      },
      error: (error) => {
        this.uploading.set(false);
        console.error("[ImageUpload] Error al subir imagen:", error);
        this.error.set(
          error.error?.message || "Error al subir la imagen. Intentá nuevamente."
        );
        // Restaurar imagen anterior si existe
        if (this.currentImageUrl) {
          this.previewUrl.set(this.storageService.getImageUrl(this.currentImageUrl));
        } else {
          this.previewUrl.set(null);
        }
      },
    });
  }

  removeImage() {
    this.previewUrl.set(null);
    this.error.set(null);
    this.imageRemoved.emit();

    // Limpiar el input
    if (this.fileInput) {
      this.fileInput.nativeElement.value = "";
    }
  }
}

