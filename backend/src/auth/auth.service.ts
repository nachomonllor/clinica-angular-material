import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UserRole, UserStatus } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import type { Session } from "express-session";
import { PrismaService } from "../prisma/prisma.service";
import { UsersService } from "../users/users.service";
import { EmailService } from "../email/email.service";
import { RegisterDto } from "./dto/create-auth.dto";
import { VerifyEmailDto } from "./dto/verify-email.dto";
import { SessionUser } from "./types/session-user";

type PublicUser = NonNullable<ReturnType<UsersService["toPublic"]>>;
type SessionWithUser = Session & { user?: SessionUser };

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const user = await this.usersService.create(dto);
    if (!user) {
      throw new BadRequestException("No se pudo crear el usuario");
    }
    const verification = await this.createVerificationToken(user.id);

    // Enviar email de verificación
    try {
      await this.emailService.sendVerificationEmail(user.email, verification.token);
    } catch (error) {
      console.error("[AuthService] Error al enviar email de verificación:", error);
      // No lanzar error para no interrumpir el registro
      // El usuario puede solicitar reenvío del email más tarde
    }

    // Obtener el usuario completo con relaciones para generar el token
    const fullUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        paciente: true,
        especialista: { include: { skills: { include: { especialidad: true } } } },
        admin: true,
      },
    });

    if (!fullUser) {
      throw new BadRequestException("No se pudo obtener el usuario registrado");
    }

    const publicUser = this.usersService.toPublic(fullUser);
    if (!publicUser) {
      throw new BadRequestException("No se pudo procesar el usuario registrado");
    }

    // Generar JWT token para el usuario registrado
    const payload = {
      sub: publicUser.id,
      email: publicUser.email,
      role: publicUser.role,
    };
    const token = this.jwtService.sign(payload);

    return {
      user: publicUser,
      token,
      verificationToken: verification.token, // Solo para desarrollo/testing
    };
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return null;
  }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      return null;
    }

    if (
      (user.role === UserRole.PATIENT || user.role === UserRole.SPECIALIST) &&
      !user.emailVerified
    ) {
      throw new UnauthorizedException("Debes verificar tu correo electrónico");
    }

    if (
      user.role === UserRole.SPECIALIST &&
      user.status !== UserStatus.APPROVED
    ) {
      throw new UnauthorizedException(
        "Tu cuenta de especialista debe ser aprobada por un administrador",
      );
    }

    return this.usersService.toPublic(user);
  }

  async login(user: PublicUser, session: SessionWithUser | null, ip?: string, userAgent?: string) {
    if (!user) {
      throw new UnauthorizedException();
    }

    // Guardar también en sesión si está disponible (para compatibilidad)
    if (session) {
      session.user = {
        id: user.id,
        role: user.role,
        status: user.status,
        emailVerified: user.emailVerified,
      };

      // Guardar la sesión explícitamente para asegurar persistencia
      await new Promise<void>((resolve, reject) => {
        session.save((err) => {
          if (err) {
            console.error(`[AuthService] Error al guardar sesión:`, err);
            reject(err);
          } else {
            console.log(`[AuthService] ✅ Sesión guardada para usuario: ${user.id}`);
            resolve();
          }
        });
      });
    }

    // Generar JWT token
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const token = this.jwtService.sign(payload);
    console.log(`[AuthService] ✅ JWT token generado para usuario: ${user.id}`);

    await this.prisma.loginLog.create({
      data: {
        userId: user.id,
        ip,
        userAgent,
      },
    });

    return { user, token };
  }

  async logout(session: SessionWithUser) {
    return new Promise((resolve, reject) => {
      session.destroy((err) => {
        if (err) {
          reject(err);
        } else {
          resolve(true);
        }
      });
    });
  }

  async session(session: SessionWithUser) {
    if (!session.user) {
      return { user: null };
  }

    const user = await this.usersService.findOne(session.user.id);
    return { user: this.usersService.toPublic(user) };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const token = await this.prisma.emailVerificationToken.findUnique({
      where: { token: dto.token },
    });

    if (!token || token.usedAt || token.expiresAt < new Date()) {
      throw new BadRequestException("Token inválido o expirado");
    }

    await this.prisma.user.update({
      where: { id: token.userId },
      data: { emailVerified: true },
    });

    await this.prisma.emailVerificationToken.update({
      where: { id: token.id },
      data: { usedAt: new Date() },
    });

    return { success: true };
  }

  async createVerificationToken(userId: string) {
    const token = randomUUID();
    return this.prisma.emailVerificationToken.create({
      data: {
        userId,
        token,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
    });
  }
}
