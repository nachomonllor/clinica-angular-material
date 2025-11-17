import { Injectable } from "@nestjs/common";
import { AppointmentStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async logins(desde?: string, hasta?: string, userId?: string) {
    const where: Prisma.LoginLogWhereInput = {};
    if (userId) where.userId = userId;
    if (desde || hasta) {
      where.createdAt = {};
      if (desde) where.createdAt.gte = new Date(desde);
      if (hasta) where.createdAt.lte = new Date(hasta);
    }

    return this.prisma.loginLog.findMany({
      where,
      orderBy: { createdAt: "asc" },
      include: {
        user: {
          select: { id: true, nombre: true, apellido: true, email: true, role: true },
        },
      },
    });
  }

  async appointmentsByEspecialidad(desde?: string, hasta?: string) {
    const where: Prisma.AppointmentWhereInput = {};
    if (desde || hasta) {
      where.createdAt = {};
      if (desde) where.createdAt.gte = new Date(desde);
      if (hasta) where.createdAt.lte = new Date(hasta);
    }

    return this.prisma.appointment.groupBy({
      by: ["especialidadId"],
      _count: { _all: true },
      where,
    });
  }

  async appointmentsByDay(desde?: string, hasta?: string) {
    const where: Prisma.AppointmentWhereInput = {};
    if (desde || hasta) {
      where.createdAt = {};
      if (desde) where.createdAt.gte = new Date(desde);
      if (hasta) where.createdAt.lte = new Date(hasta);
    }

    // usamos raw query para agrupar por fecha (date_trunc)
    const desdeParam = desde ? new Date(desde) : null;
    const hastaParam = hasta ? new Date(hasta) : null;

    return this.prisma.$queryRawUnsafe<
      { date: Date; count: number }[]
    >(
      `
      SELECT DATE("createdAt") as date, COUNT(*)::int as count
      FROM "Appointment"
      WHERE ($1::timestamp IS NULL OR "createdAt" >= $1)
        AND ($2::timestamp IS NULL OR "createdAt" <= $2)
      GROUP BY DATE("createdAt")
      ORDER BY DATE("createdAt")
    `,
      desdeParam,
      hastaParam,
    );
  }

  async appointmentsByMedico(desde?: string, hasta?: string, onlyFinalized = false) {
    const where: Prisma.AppointmentWhereInput = {};
    if (desde || hasta) {
      where.createdAt = {};
      if (desde) where.createdAt.gte = new Date(desde);
      if (hasta) where.createdAt.lte = new Date(hasta);
    }
    if (onlyFinalized) {
      where.status = AppointmentStatus.DONE;
    }

    return this.prisma.appointment.groupBy({
      by: ["especialistaId"],
      _count: { _all: true },
      where,
    });
  }
}
