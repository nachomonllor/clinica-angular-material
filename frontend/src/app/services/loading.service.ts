import { Injectable, signal, computed } from "@angular/core";

@Injectable({ providedIn: "root" })
export class LoadingService {
  private loadingCount = signal<number>(0);
  private loadingMessage = signal<string | null>(null);

  // Computed signal que indica si hay algún loading activo
  isLoading = computed(() => this.loadingCount() > 0);
  message = computed(() => this.loadingMessage());

  /**
   * Iniciar un loading con un mensaje opcional
   */
  start(message?: string): void {
    this.loadingCount.update((count) => count + 1);
    if (message) {
      this.loadingMessage.set(message);
    }
  }

  /**
   * Detener un loading
   */
  stop(): void {
    this.loadingCount.update((count) => Math.max(0, count - 1));
    // Si no hay loadings activos, limpiar el mensaje
    if (this.loadingCount() === 0) {
      this.loadingMessage.set(null);
    }
  }

  /**
   * Detener todos los loadings
   */
  stopAll(): void {
    this.loadingCount.set(0);
    this.loadingMessage.set(null);
  }

  /**
   * Ejecutar una función asíncrona mostrando loading
   */
  async execute<T>(fn: () => Promise<T>, message?: string): Promise<T> {
    this.start(message);
    try {
      return await fn();
    } finally {
      this.stop();
    }
  }
}

