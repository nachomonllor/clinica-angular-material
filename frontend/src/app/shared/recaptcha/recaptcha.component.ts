import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, signal, AfterViewInit, inject, ElementRef } from "@angular/core";
import { CommonModule } from "@angular/common";

declare var grecaptcha: any;

@Component({
  selector: "app-recaptcha",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="enabled" class="recaptcha-container">
      <div #recaptchaContainer id="recaptcha-container"></div>
      <p *ngIf="error()" class="error-text">{{ error() }}</p>
    </div>
  `,
  styles: `
    .recaptcha-container {
      margin: 1rem 0;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }
    .error-text {
      margin-top: 0.5rem;
      color: #b91c1c;
      font-size: 0.85rem;
    }
  `,
})
export class RecaptchaComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() siteKey: string = "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"; // Google test key (solo para desarrollo)
  @Input() enabled: boolean = true;
  @Output() captchaValid = new EventEmitter<string | null>();

  private elementRef = inject(ElementRef);
  private widgetId: number | null = null;
  error = signal<string | null>(null);
  captchaToken = signal<string | null>(null);

  ngOnInit(): void {
    // Verificar que grecaptcha esté disponible
    if (typeof grecaptcha === "undefined") {
      this.error.set("reCAPTCHA no está disponible. Verificá tu conexión a internet.");
      this.enabled = false;
    }
  }

  ngAfterViewInit(): void {
    if (this.enabled && typeof grecaptcha !== "undefined") {
      setTimeout(() => {
        this.renderRecaptcha();
      }, 500); // Esperar un poco para que el DOM esté completamente cargado
    }
  }

  ngOnDestroy(): void {
    if (this.widgetId !== null && typeof grecaptcha !== "undefined") {
      try {
        grecaptcha.reset(this.widgetId);
      } catch (e) {
        console.error("[Recaptcha] Error al resetear captcha:", e);
      }
    }
  }

  private renderRecaptcha(): void {
    const container = this.elementRef.nativeElement.querySelector("#recaptcha-container");
    if (!container) {
      this.error.set("No se pudo encontrar el contenedor de reCAPTCHA.");
      return;
    }

    try {
      this.widgetId = grecaptcha.render(container, {
        sitekey: this.siteKey,
        callback: (token: string) => {
          this.captchaToken.set(token);
          this.error.set(null);
          this.captchaValid.emit(token);
        },
        "expired-callback": () => {
          this.captchaToken.set(null);
          this.captchaValid.emit(null);
        },
        "error-callback": () => {
          this.captchaToken.set(null);
          this.error.set("Error al verificar reCAPTCHA. Intentá nuevamente.");
          this.captchaValid.emit(null);
        },
      });
    } catch (e: any) {
      console.error("[Recaptcha] Error al renderizar captcha:", e);
      this.error.set("Error al cargar reCAPTCHA. Verificá tu conexión.");
    }
  }

  reset(): void {
    if (this.widgetId !== null && typeof grecaptcha !== "undefined") {
      try {
        grecaptcha.reset(this.widgetId);
        this.captchaToken.set(null);
        this.error.set(null);
        this.captchaValid.emit(null);
      } catch (e) {
        console.error("[Recaptcha] Error al resetear captcha:", e);
      }
    }
  }
}
