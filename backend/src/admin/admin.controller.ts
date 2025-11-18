import { Controller, Get, UseGuards } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SessionAuthGuard } from "../auth/guards/session-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";

@Controller("admin")
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("db-status")
  async getDbStatus() {
    try {
      // Contar registros en cada tabla
      const counts = {
        users: await this.prisma.user.count(),
        pacientes: await this.prisma.pacienteProfile.count(),
        especialistas: await this.prisma.especialistaProfile.count(),
        admins: await this.prisma.adminProfile.count(),
        especialidades: await this.prisma.especialidad.count(),
        availabilities: await this.prisma.specialistAvailability.count(),
        slots: await this.prisma.appointmentSlot.count(),
        appointments: await this.prisma.appointment.count(),
        medicalRecords: await this.prisma.medicalRecord.count(),
        loginLogs: await this.prisma.loginLog.count(),
      };

      // Obtener algunos ejemplos
      const samples = {
        users: await this.prisma.user.findMany({
          take: 5,
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            role: true,
            status: true,
          },
          orderBy: { createdAt: "desc" },
        }),
        especialidades: await this.prisma.especialidad.findMany({
          take: 10,
          orderBy: { nombre: "asc" },
        }),
      };

      return {
        status: "ok",
        database: "connected",
        counts,
        samples,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: "error",
        message: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

