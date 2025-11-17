import { Injectable } from "@nestjs/common";
import * as nodemailer from "nodemailer";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
    const smtpSecure = process.env.SMTP_SECURE === "true";
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    // Si no hay configuración de SMTP, no inicializar (emails no se enviarán)
    if (!smtpHost || !smtpUser || !smtpPass) {
      console.warn(
        "[EmailService] SMTP no configurado. Los emails no se enviarán. Configura SMTP_HOST, SMTP_USER y SMTP_PASS en .env",
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure, // true para 465, false para otros puertos
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  }

  async sendEmail(options: SendEmailOptions): Promise<void> {
    if (!this.transporter) {
      console.warn(
        "[EmailService] Intento de enviar email pero SMTP no está configurado. Email no enviado a:",
        options.to,
      );
      return;
    }

    const from = process.env.EMAIL_FROM || `Clínica Online <${process.env.SMTP_USER}>`;
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:4200";

    try {
      await this.transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, ""), // Convertir HTML a texto plano
      });

      console.log(`[EmailService] Email enviado exitosamente a: ${options.to}`);
    } catch (error) {
      console.error("[EmailService] Error al enviar email:", error);
      throw new Error("No se pudo enviar el email");
    }
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:4200";
    const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verifica tu email</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(90deg, #2563eb, #1d4ed8); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0;">🏥 Clínica Online</h1>
          </div>
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0;">
            <h2 style="color: #0f172a; margin-top: 0;">Verifica tu dirección de correo electrónico</h2>
            <p style="color: #475569;">Hola,</p>
            <p style="color: #475569;">Gracias por registrarte en Clínica Online. Para completar tu registro, necesitamos verificar tu dirección de correo electrónico.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; box-shadow: 0 8px 18px rgba(37, 99, 235, 0.35);">
                Verificar mi email
              </a>
            </div>
            <p style="color: #64748b; font-size: 0.9rem;">O copiá y pegá este enlace en tu navegador:</p>
            <p style="color: #2563eb; word-break: break-all; font-size: 0.85rem;">${verificationUrl}</p>
            <p style="color: #64748b; font-size: 0.85rem; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              Este enlace expirará en 24 horas.
            </p>
            <p style="color: #64748b; font-size: 0.85rem;">
              Si no creaste esta cuenta, podés ignorar este email.
            </p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #94a3b8; font-size: 0.8rem;">
            <p>© ${new Date().getFullYear()} Clínica Online. Todos los derechos reservados.</p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: "Verifica tu email - Clínica Online",
      html,
    });
  }
}
