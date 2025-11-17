import {
  Directive,
  Input,
  Output,
  EventEmitter,
  OnInit,
  ElementRef,
  Renderer2,
  signal,
  computed,
} from "@angular/core";
import { CommonModule } from "@angular/common";

@Directive({
  selector: "[appCustomCaptcha]",
  standalone: true,
  host: {
    class: "custom-captcha-container",
  },
})
export class CustomCaptchaDirective implements OnInit {
  @Input() enabled: boolean = true;
  @Input() difficulty: "easy" | "medium" | "hard" = "easy";
  @Output() captchaValid = new EventEmitter<boolean>();
  @Output() captchaToken = new EventEmitter<string | null>();

  private captchaContainer?: HTMLElement;
  private captchaQuestion?: HTMLElement;
  private captchaInput?: HTMLInputElement;
  private captchaError?: HTMLElement;
  private refreshButton?: HTMLButtonElement;

  private correctAnswer = signal<number>(0);
  private userAnswer = signal<string>("");
  private isValid = signal<boolean>(false);
  private hasError = signal<boolean>(false);

  captchaValue = computed(() => this.userAnswer());

  constructor(
    private el: ElementRef<HTMLElement>,
    private renderer: Renderer2,
  ) {}

  ngOnInit(): void {
    if (!this.enabled) {
      this.captchaValid.emit(true);
      this.captchaToken.emit("disabled");
      return;
    }

    this.createCaptcha();
    this.generateNewCaptcha();
  }

  private createCaptcha(): void {
    const container = this.renderer.createElement("div");
    this.renderer.addClass(container, "custom-captcha");
    this.captchaContainer = container;

    // Pregunta del captcha
    const question = this.renderer.createElement("div");
    this.renderer.addClass(question, "captcha-question");
    this.captchaQuestion = question;
    this.renderer.appendChild(container, question);

    // Input para respuesta
    const input = this.renderer.createElement("input");
    this.renderer.setAttribute(input, "type", "number");
    this.renderer.setAttribute(input, "placeholder", "Ingresá el resultado");
    this.renderer.addClass(input, "captcha-input");
    this.renderer.listen(input, "input", (e) => this.onAnswerChange(e));
    this.renderer.listen(input, "blur", () => this.validateCaptcha());
    this.captchaInput = input;
    this.renderer.appendChild(container, input);

    // Botón de actualizar
    const refreshBtn = this.renderer.createElement("button");
    this.renderer.addClass(refreshBtn, "captcha-refresh");
    this.renderer.setAttribute(refreshBtn, "type", "button");
    this.renderer.setProperty(refreshBtn, "innerHTML", "🔄 Actualizar");
    this.renderer.listen(refreshBtn, "click", () => this.generateNewCaptcha());
    this.refreshButton = refreshBtn;
    this.renderer.appendChild(container, refreshBtn);

    // Mensaje de error
    const error = this.renderer.createElement("div");
    this.renderer.addClass(error, "captcha-error");
    this.renderer.setStyle(error, "display", "none");
    this.captchaError = error;
    this.renderer.appendChild(container, error);

    // Añadir estilos
    this.addStyles();

    // Insertar en el DOM
    this.renderer.appendChild(this.el.nativeElement, container);
  }

  private generateNewCaptcha(): void {
    if (!this.captchaQuestion || !this.captchaInput) return;

    let num1: number;
    let num2: number;
    let operator: string;

    switch (this.difficulty) {
      case "easy":
        num1 = Math.floor(Math.random() * 10) + 1;
        num2 = Math.floor(Math.random() * 10) + 1;
        operator = Math.random() > 0.5 ? "+" : "-";
        break;
      case "medium":
        num1 = Math.floor(Math.random() * 20) + 1;
        num2 = Math.floor(Math.random() * 20) + 1;
        operator = ["+", "-", "*"][Math.floor(Math.random() * 3)];
        break;
      case "hard":
        num1 = Math.floor(Math.random() * 50) + 1;
        num2 = Math.floor(Math.random() * 50) + 1;
        operator = ["+", "-", "*"][Math.floor(Math.random() * 3)];
        break;
      default:
        num1 = 1;
        num2 = 1;
        operator = "+";
    }

    let answer: number;
    switch (operator) {
      case "+":
        answer = num1 + num2;
        break;
      case "-":
        answer = num1 - num2;
        break;
      case "*":
        answer = num1 * num2;
        break;
      default:
        answer = num1 + num2;
    }

    this.correctAnswer.set(answer);

    const questionText = `${num1} ${operator} ${num2} = ?`;
    this.renderer.setProperty(this.captchaQuestion, "textContent", questionText);

    // Limpiar input y estado
    this.renderer.setProperty(this.captchaInput, "value", "");
    this.userAnswer.set("");
    this.isValid.set(false);
    this.hasError.set(false);
    this.captchaValid.emit(false);
    this.captchaToken.emit(null);

    if (this.captchaError) {
      this.renderer.setStyle(this.captchaError, "display", "none");
    }
  }

  private onAnswerChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.userAnswer.set(target.value);
    this.hasError.set(false);

    if (this.captchaError) {
      this.renderer.setStyle(this.captchaError, "display", "none");
    }

    // Validar automáticamente cuando el usuario termine de escribir
    if (target.value.trim() !== "") {
      setTimeout(() => this.validateCaptcha(), 500);
    } else {
      this.isValid.set(false);
      this.captchaValid.emit(false);
      this.captchaToken.emit(null);
    }
  }

  private validateCaptcha(): void {
    if (!this.captchaInput) return;

    const userAnswerStr = this.captchaInput.value.trim();
    const userAnswerNum = parseInt(userAnswerStr, 10);

    if (isNaN(userAnswerNum)) {
      this.isValid.set(false);
      this.captchaValid.emit(false);
      this.captchaToken.emit(null);
      return;
    }

    if (userAnswerNum === this.correctAnswer()) {
      this.isValid.set(true);
      this.hasError.set(false);
      this.captchaValid.emit(true);
      this.captchaToken.emit(this.generateToken());
      
      if (this.captchaError) {
        this.renderer.setStyle(this.captchaError, "display", "none");
      }
      if (this.captchaInput) {
        this.renderer.removeClass(this.captchaInput, "error");
        this.renderer.addClass(this.captchaInput, "valid");
      }
    } else {
      this.isValid.set(false);
      this.hasError.set(true);
      this.captchaValid.emit(false);
      this.captchaToken.emit(null);
      
      if (this.captchaError) {
        this.renderer.setProperty(
          this.captchaError,
          "textContent",
          "Respuesta incorrecta. Intentá nuevamente.",
        );
        this.renderer.setStyle(this.captchaError, "display", "block");
      }
      if (this.captchaInput) {
        this.renderer.addClass(this.captchaInput, "error");
        this.renderer.removeClass(this.captchaInput, "valid");
      }
    }
  }

  private generateToken(): string {
    // Generar token simple basado en timestamp y respuesta correcta
    const timestamp = Date.now();
    const answer = this.correctAnswer();
    return `${timestamp}_${answer}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private addStyles(): void {
    const style = this.renderer.createElement("style");
    this.renderer.setProperty(
      style,
      "textContent",
      `
      .custom-captcha-container {
        width: 100%;
      }
      .custom-captcha {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        padding: 1rem;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 0.5rem;
        margin-top: 1rem;
      }
      .captcha-question {
        font-size: 1.1rem;
        font-weight: 600;
        color: #0f172a;
        text-align: center;
        padding: 0.5rem;
        background: white;
        border-radius: 0.5rem;
        border: 2px solid #2563eb;
      }
      .captcha-input {
        padding: 0.65rem 0.75rem;
        border-radius: 0.5rem;
        border: 1px solid #cbd5e1;
        font-size: 1rem;
        text-align: center;
        outline: none;
        transition: all 0.2s;
      }
      .captcha-input:focus {
        border-color: #2563eb;
        box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.2);
      }
      .captcha-input.error {
        border-color: #b91c1c;
        box-shadow: 0 0 0 1px rgba(185, 28, 28, 0.2);
      }
      .captcha-input.valid {
        border-color: #10b981;
        box-shadow: 0 0 0 1px rgba(16, 185, 129, 0.2);
      }
      .captcha-refresh {
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        border: 1px solid #cbd5e1;
        background: white;
        color: #475569;
        font-size: 0.9rem;
        cursor: pointer;
        transition: all 0.2s;
      }
      .captcha-refresh:hover {
        background: #f1f5f9;
        border-color: #2563eb;
        color: #2563eb;
      }
      .captcha-error {
        color: #b91c1c;
        font-size: 0.85rem;
        text-align: center;
        padding: 0.5rem;
        background: #fee2e2;
        border-radius: 0.5rem;
        border: 1px solid #fecaca;
      }
      `,
    );
    this.renderer.appendChild(document.head, style);
  }

  // Método público para validar manualmente desde el componente
  validate(): boolean {
    this.validateCaptcha();
    return this.isValid();
  }

  // Método público para obtener el token
  getToken(): string | null {
    return this.isValid() ? this.captchaToken.observed ? this.generateToken() : null : null;
  }

  // Método público para resetear el captcha
  reset(): void {
    this.generateNewCaptcha();
  }
}

