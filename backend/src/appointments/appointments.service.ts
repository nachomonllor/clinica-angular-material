import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  AppointmentStatus,
  Prisma,
  SlotStatus,
  UserRole,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { UsersService } from "../users/users.service";
import { CreateAppointmentDto } from "./dto/create-appointment.dto";
import { FinalizeAppointmentDto } from "./dto/finalize-appointment.dto";
import { QueryAppointmentsDto } from "./dto/query-appointments.dto";

const appointmentInclude = {
  slot: true,
  especialidad: true,
  specialist: {
    include: {
      user: true,
    },
  },
  paciente: true,
  creadoPor: true,
  medicalRecord: true,
} satisfies Prisma.AppointmentInclude;

type AppointmentWithRelations = Prisma.AppointmentGetPayload<{
  include: typeof appointmentInclude;
}>;

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async create(dto: CreateAppointmentDto, actorId: string) {
    const slot = await this.prisma.appointmentSlot.findUnique({
      where: { id: dto.slotId },
      include: {
        specialist: {
          include: { user: true },
        },
        especialidad: true,
      },
    });

    if (!slot) {
      throw new NotFoundException("Turno no disponible");
    }

    if (slot.status !== SlotStatus.FREE) {
      throw new BadRequestException("El turno ya fue reservado");
    }

    const actor = await this.usersService.findOne(actorId);
    const pacienteId =
      actor.role === UserRole.PATIENT
        ? actor.id
        : dto.pacienteId ?? actor.id;

    const status =
      actor.role === UserRole.ADMIN ? AppointmentStatus.ACCEPTED : AppointmentStatus.PENDING;

    const appointment = await this.prisma.appointment.create({
      data: {
        slotId: slot.id,
        especialistaId: slot.especialistaId,
        especialidadId: slot.especialidadId,
        pacienteId,
        creadoPorId: actor.id,
        status,
        patientComment: dto.patientComment,
      },
      include: appointmentInclude,
    });

    await this.prisma.appointmentSlot.update({
      where: { id: slot.id },
      data: { status: SlotStatus.RESERVED },
    });

    await this.logHistory(appointment.id, actorId, appointment.status, dto.patientComment);

    return appointment;
  }

  async listMine(userId: string, role: UserRole, query: QueryAppointmentsDto) {
    const where: Prisma.AppointmentWhereInput = {
      status: query.status,
      especialidadId: query.especialidadId
        ? Number(query.especialidadId)
        : undefined,
    };
    const searchTerm = query.search?.trim();

    if (role === UserRole.PATIENT) {
      where.pacienteId = userId;
    } else if (role === UserRole.SPECIALIST) {
      const specialist = await this.prisma.especialistaProfile.findUnique({
        where: { userId },
      });
      if (!specialist) {
        throw new NotFoundException("Especialista no encontrado");
      }
      where.especialistaId = specialist.id;
    } else {
      throw new ForbiddenException();
    }

    if (searchTerm) {
      const searchConditions: Prisma.AppointmentWhereInput[] = [
        {
          especialidad: {
            nombre: { contains: searchTerm, mode: "insensitive" },
          },
        },
        {
          medicalRecord: {
          OR: [
              {
                presion: { contains: searchTerm, mode: "insensitive" },
              },
              {
                searchText: { contains: searchTerm, mode: "insensitive" },
              },
          ],
          },
        },
        {
          specialistReview: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
        {
          patientComment: { contains: searchTerm, mode: "insensitive" },
        },
      ];

      if (role === UserRole.PATIENT) {
        searchConditions.push({
          specialist: {
            user: {
              OR: [
                { nombre: { contains: searchTerm, mode: "insensitive" } },
                { apellido: { contains: searchTerm, mode: "insensitive" } },
              ],
            },
          },
        });
      } else if (role === UserRole.SPECIALIST) {
        searchConditions.push({
          paciente: {
            OR: [
              { nombre: { contains: searchTerm, mode: "insensitive" } },
              { apellido: { contains: searchTerm, mode: "insensitive" } },
            ],
          },
        });
      }

      const existingAnd = Array.isArray(where.AND)
        ? where.AND
        : where.AND
          ? [where.AND]
          : [];
      where.AND = [...existingAnd, { OR: searchConditions }];
    }

    return this.prisma.appointment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: appointmentInclude,
    });
  }

  async listAdmin(query: QueryAppointmentsDto) {
    const where: Prisma.AppointmentWhereInput = {
      pacienteId: query.pacienteId,
      especialidadId: query.especialidadId
        ? Number(query.especialidadId)
        : undefined,
      status: query.status,
      especialistaId: query.especialistaId
        ? Number(query.especialistaId)
        : undefined,
    };

    if (query.search?.trim()) {
      const term = query.search.trim();
      where.AND = [
        {
          OR: [
            {
              paciente: {
                OR: [
                  { nombre: { contains: term, mode: "insensitive" } },
                  { apellido: { contains: term, mode: "insensitive" } },
                ],
              },
            },
            {
              specialist: {
                user: {
                  OR: [
                    { nombre: { contains: term, mode: "insensitive" } },
                    { apellido: { contains: term, mode: "insensitive" } },
                  ],
                },
              },
            },
            {
              especialidad: {
                nombre: { contains: term, mode: "insensitive" },
              },
            },
            {
              medicalRecord: {
                OR: [
                  { presion: { contains: term, mode: "insensitive" } },
                  { searchText: { contains: term, mode: "insensitive" } },
                ],
              },
            },
            {
              specialistReview: { contains: term, mode: "insensitive" },
            },
            {
              patientComment: { contains: term, mode: "insensitive" },
            },
          ],
        },
      ];
    }

    return this.prisma.appointment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: appointmentInclude,
    });
  }

  async cancel(id: string, actorId: string, note?: string) {
    return this.changeStatus(
      id,
      actorId,
      AppointmentStatus.CANCELLED,
      note ?? "Cancelado por el usuario",
    );
  }

  async accept(id: string, actorId: string) {
    return this.changeStatus(id, actorId, AppointmentStatus.ACCEPTED);
  }

  async reject(id: string, actorId: string, note: string) {
    if (!note) {
      throw new BadRequestException("Debe indicar un motivo de rechazo");
    }
    return this.changeStatus(id, actorId, AppointmentStatus.REJECTED, note);
  }

  async finalize(
    id: string,
    actorId: string,
    dto: FinalizeAppointmentDto,
  ) {
    if (!dto.specialistReview) {
      throw new BadRequestException("Debe agregar una reseña del turno");
    }
    this.validateExtraFields(dto.extraData);

    const updated = await this.changeStatus(
      id,
      actorId,
      AppointmentStatus.DONE,
      dto.specialistReview,
      {
        specialistReview: dto.specialistReview,
        completedAt: new Date(),
      },
    );

    await this.saveMedicalRecord(updated, dto);
    const refreshedRecord = await this.prisma.medicalRecord.findUnique({
      where: { appointmentId: updated.id },
    });

    return {
      ...updated,
      medicalRecord: refreshedRecord,
    };
  }

  async patientReview(id: string, actorId: string, note: string) {
    const appointment = await this.ensureOwnership(id, actorId);

    if (appointment.status !== AppointmentStatus.DONE) {
      throw new BadRequestException(
        "Sólo se puede calificar turnos finalizados",
      );
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        patientComment: note,
      },
      include: appointmentInclude,
    });

    await this.logHistory(id, actorId, appointment.status as AppointmentStatus, note);
    return updated;
  }

  private async changeStatus(
    id: string,
    actorId: string,
    nextStatus: AppointmentStatus,
    note?: string,
    extraData?: Prisma.AppointmentUpdateInput,
  ) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        specialist: { include: { user: true } },
        paciente: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException("Turno inexistente");
    }

    const actor = await this.usersService.findOne(actorId);
    if (!this.canChange(actor, appointment, nextStatus)) {
      throw new ForbiddenException("No puedes realizar esta acción");
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        status: nextStatus,
        cancelReason:
          nextStatus === AppointmentStatus.CANCELLED ? note : undefined,
        rejectReason:
          nextStatus === AppointmentStatus.REJECTED ? note : undefined,
        acceptedAt:
          nextStatus === AppointmentStatus.ACCEPTED
            ? new Date()
            : appointment.acceptedAt,
        ...extraData,
      },
      include: appointmentInclude,
    });

    if (nextStatus === AppointmentStatus.CANCELLED) {
      await this.prisma.appointmentSlot.update({
        where: { id: appointment.slotId },
        data: { status: SlotStatus.CANCELLED },
      });
    }

    await this.logHistory(id, actorId, nextStatus, note);
    return updated;
  }

  private async logHistory(
    appointmentId: string,
    actorId: string,
    status: AppointmentStatus,
    note?: string,
  ) {
    await this.prisma.appointmentHistory.create({
      data: {
        appointmentId,
        actorId,
        action: status,
        note,
      },
    });
  }

  private validateExtraFields(
    extraData?: { clave: string; valor: string }[],
  ) {
    if (!extraData || !extraData.length) {
      return;
    }

    if (extraData.length > 3) {
      throw new BadRequestException(
        "Solo se permiten hasta 3 datos dinámicos",
      );
    }

    for (const field of extraData) {
      if (!field.clave?.trim() || !field.valor?.trim()) {
        throw new BadRequestException(
          "Los datos dinámicos deben incluir clave y valor",
        );
      }
    }
  }

  private async saveMedicalRecord(
    appointment: AppointmentWithRelations,
    dto: FinalizeAppointmentDto,
  ) {
    const normalizedExtra =
      dto.extraData?.map((item) => ({
        clave: item.clave.trim(),
        valor: item.valor.trim(),
      })) ?? [];

    const recordPayload = {
      altura: dto.altura,
      peso: dto.peso,
      temperatura: dto.temperatura,
      presion: dto.presion,
      extraData: normalizedExtra,
      searchText: this.buildRecordSearchText(dto, normalizedExtra),
    };

    await this.prisma.medicalRecord.upsert({
      where: { appointmentId: appointment.id },
      update: recordPayload,
      create: {
        appointmentId: appointment.id,
        pacienteId: appointment.pacienteId,
        especialistaId: appointment.especialistaId,
        ...recordPayload,
      },
    });
  }

  private buildRecordSearchText(
    dto: FinalizeAppointmentDto,
    extra: { clave: string; valor: string }[],
  ) {
    const parts = [
      dto.altura.toString(),
      dto.peso.toString(),
      dto.temperatura.toString(),
      dto.presion,
      dto.specialistReview ?? "",
      ...extra.flatMap((item) => [item.clave, item.valor]),
    ];

    return parts.filter(Boolean).join(" ").toLowerCase();
  }

  private canChange(
    actor: Awaited<ReturnType<UsersService["findOne"]>>,
    appointment: Prisma.AppointmentGetPayload<{ include: { specialist: { include: { user: true } }, paciente: true } }>,
    nextStatus: AppointmentStatus,
  ) {
    if (actor.role === UserRole.ADMIN) {
      return true;
    }

    if (actor.role === UserRole.PATIENT) {
      return (
        appointment.pacienteId === actor.id &&
        nextStatus === AppointmentStatus.CANCELLED &&
        appointment.status === AppointmentStatus.PENDING
      );
    }

    if (actor.role === UserRole.SPECIALIST) {
      const specialistId = appointment.specialist?.userId;
      if (specialistId !== actor.id) {
        return false;
      }

      if (
        nextStatus === AppointmentStatus.ACCEPTED &&
        appointment.status === AppointmentStatus.PENDING
      ) {
        return true;
      }

      if (
        nextStatus === AppointmentStatus.REJECTED &&
        (appointment.status === AppointmentStatus.PENDING ||
          appointment.status === AppointmentStatus.ACCEPTED)
      ) {
        return true;
      }

      if (
        nextStatus === AppointmentStatus.DONE &&
        appointment.status === AppointmentStatus.ACCEPTED
      ) {
        return true;
      }
    }

    return false;
  }

  private async ensureOwnership(id: string, actorId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
    });
    if (!appointment || appointment.pacienteId !== actorId) {
      throw new ForbiddenException();
    }
    return appointment;
  }
}
