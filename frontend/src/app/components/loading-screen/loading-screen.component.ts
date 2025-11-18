import { Component, OnInit, signal } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-loading-screen",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading-screen" *ngIf="visible()">
      <div class="loading-content">
        <div class="logo">
          <svg viewBox="0 0 100 100" class="logo-icon">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#2563eb" stroke-width="3" />
            <path
              d="M 30 50 L 45 65 L 70 35"
              fill="none"
              stroke="#2563eb"
              stroke-width="4"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
        <h1>Clínica Online</h1>
        <div class="spinner"></div>
        <p *ngIf="message()" class="message">{{ message() }}</p>
      </div>
    </div>
  `,
  styles: `
    .loading-screen {
      position: fixed;
      inset: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      transition: opacity 0.3s ease-out;
    }

    .loading-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.5rem;
      text-align: center;
    }

    .logo {
      animation: scaleIn 0.5s ease-out;
    }

    @keyframes scaleIn {
      from {
        transform: scale(0);
        opacity: 0;
      }
      to {
        transform: scale(1);
        opacity: 1;
      }
    }

    .logo-icon {
      width: 80px;
      height: 80px;
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.1);
      }
    }

    h1 {
      margin: 0;
      font-size: 2rem;
      color: white;
      font-weight: 700;
      letter-spacing: 0.05em;
      animation: slideDown 0.5s ease-out 0.2s both;
    }

    @keyframes slideDown {
      from {
        transform: translateY(-20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    .message {
      margin: 0;
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.9);
      animation: fadeIn 0.5s ease-out 0.4s both;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
  `,
})
export class LoadingScreenComponent {
  visible = signal(true);
  message = signal<string | null>(null);

  setMessage(msg: string) {
    this.message.set(msg);
  }
}

