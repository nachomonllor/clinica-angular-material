import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { User } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

const recordInclude = {
  appointment: {
    include: {
      especialidad: true,
      specialist: {
        include: {
          user: true,
        },
      },
      slot: true,
    },
  },
  especialista: {
    include: {
      user: true,
    },
  },
} as const;

@Injectable()
export class MedicalRecordsService {
  constructor(private readonly prisma: PrismaService) {}

  findForPatient(patientId: string) {
    return this.prisma.medicalRecord.findMany({
      where: { pacienteId: patientId },
      orderBy: { createdAt: "desc" },
      include: recordInclude,
    });
  }

  async findForSpecialist(patientId: string, specialistUserId: string) {
    const specialistProfile = await this.prisma.especialistaProfile.findUnique({
      where: { userId: specialistUserId },
      select: { id: true },
    });

    if (!specialistProfile) {
      throw new NotFoundException("Especialista no encontrado");
    }

    const records = await this.prisma.medicalRecord.findMany({
      where: {
        pacienteId: patientId,
        especialistaId: specialistProfile.id,
      },
      orderBy: { createdAt: "desc" },
      include: recordInclude,
    });

    if (!records.length) {
      throw new ForbiddenException(
        "No tienes historial disponible para este paciente",
      );
    }

    return records;
  }

  async listPatients(specialistUserId: string) {
    const specialistProfile = await this.prisma.especialistaProfile.findUnique({
      where: { userId: specialistUserId },
      select: { id: true },
    });

    if (!specialistProfile) {
      throw new NotFoundException("Especialista no encontrado");
    }

    const patientIds = await this.prisma.medicalRecord.findMany({
      where: { especialistaId: specialistProfile.id },
      select: { pacienteId: true },
      distinct: ["pacienteId"],
    });

    const ids = patientIds.map((item) => item.pacienteId);
    if (!ids.length) {
      return [];
    }

    return this.prisma.user.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        paciente: {
          select: {
            obraSocial: true,
          },
        },
      },
    });
  }
}
