import { Injectable } from "@nestjs/common";
import { SlotStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { QuerySlotsDto } from "./dto/query-slots.dto";

@Injectable()
export class SlotsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(query: QuerySlotsDto) {
    const where = {
      especialistaId: query.especialistaId,
      especialidadId: query.especialidadId,
      status: query.status ?? SlotStatus.FREE,
      startAt: query.dateFrom ? { gte: new Date(query.dateFrom) } : undefined,
      endAt: query.dateTo ? { lte: new Date(query.dateTo) } : undefined,
    };

    return this.prisma.appointmentSlot.findMany({
      where,
      orderBy: { startAt: "asc" },
      include: {
        specialist: {
          include: {
            user: true,
          },
        },
        especialidad: true,
      },
    });
  }

  // Obtener todas las especialidades que tienen al menos un especialista asignado
  async findAllAvailableSpecialties() {
    const specialties = await this.prisma.especialidad.findMany({
      where: {
        doctors: {
          some: {
            // Solo especialistas con perfil aprobado
            especialista: {
              user: {
                status: "APPROVED",
              },
            },
          },
        },
      },
      orderBy: {
        nombre: "asc",
      },
    });

    return specialties.map((esp) => ({
      id: esp.id,
      nombre: esp.nombre,
      slug: esp.slug,
    }));
  }
}
