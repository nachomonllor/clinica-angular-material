import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  Prisma,
  SlotDuration,
  SlotStatus,
  Weekday,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateAvailabilityDto } from "./dto/create-availability.dto";
import { GenerateSlotsDto } from "./dto/generate-slots.dto";
import { QueryAvailabilityDto } from "./dto/query-availability.dto";
import { UpdateAvailabilityDto } from "./dto/update-availability.dto";

const WEEKDAY_TO_JS: Record<Weekday, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAvailabilityDto) {
    await this.ensureSpecialistEspecialidad(dto.especialistaId, dto.especialidadId);
    this.validateMinutes(dto.startMinute, dto.endMinute, dto.duration);

    return this.prisma.specialistAvailability.create({
      data: {
        especialistaId: dto.especialistaId,
        especialidadId: dto.especialidadId,
        dayOfWeek: dto.dayOfWeek,
        startMinute: dto.startMinute,
        endMinute: dto.endMinute,
        duration: dto.duration,
        active: dto.active ?? true,
      },
      include: {
        especialidad: true,
      },
    });
  }

  async findAll(query: QueryAvailabilityDto) {
    return this.prisma.specialistAvailability.findMany({
      where: {
        especialistaId: query.especialistaId,
        especialidadId: query.especialidadId,
        dayOfWeek: query.dayOfWeek,
        active: query.active,
      },
      orderBy: { createdAt: "desc" },
      include: {
        especialidad: true,
      },
    });
  }

  async findOne(id: number) {
    const availability = await this.prisma.specialistAvailability.findUnique({
      where: { id },
      include: {
        especialidad: true,
      },
    });

    if (!availability) {
      throw new NotFoundException("Disponibilidad no encontrada");
    }

    return availability;
  }

  async update(id: number, dto: UpdateAvailabilityDto) {
    const current = await this.findOne(id);
    const especialistaId = dto.especialistaId ?? current.especialistaId;
    const especialidadId = dto.especialidadId ?? current.especialidadId;

    await this.ensureSpecialistEspecialidad(especialistaId, especialidadId);

    const startMinute = dto.startMinute ?? current.startMinute;
    const endMinute = dto.endMinute ?? current.endMinute;
    const duration = dto.duration ?? current.duration;
    this.validateMinutes(startMinute, endMinute, duration);

    return this.prisma.specialistAvailability.update({
      where: { id },
      data: {
        especialistaId,
        especialidadId,
        dayOfWeek: dto.dayOfWeek ?? current.dayOfWeek,
        startMinute,
        endMinute,
        duration,
        active: dto.active ?? current.active,
      },
      include: {
        especialidad: true,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.specialistAvailability.update({
      where: { id },
      data: {
        active: false,
      },
    });
  }

  async generateSlots(
    especialistaId: number,
    dto: GenerateSlotsDto = {},
  ): Promise<{ created: number }> {
    const availabilities = await this.prisma.specialistAvailability.findMany({
      where: { especialistaId, active: true },
    });

    if (!availabilities.length) {
      throw new BadRequestException(
        "El especialista no posee disponibilidades activas",
      );
    }

    const lastSlot = await this.prisma.appointmentSlot.findFirst({
      where: { especialistaId },
      orderBy: { date: "desc" },
    });

    const startDate = this.getStartDate(lastSlot?.date);
    const days = dto.days ?? 15;
    const endExclusive = this.addDays(startDate, days);

    const data: Prisma.AppointmentSlotCreateManyInput[] = [];

    for (
      let pointer = new Date(startDate);
      pointer < endExclusive;
      pointer = this.addDays(pointer, 1)
    ) {
      const pointerDay = pointer.getDay();
      const dayStart = this.startOfDay(pointer);

      for (const availability of availabilities) {
        if (WEEKDAY_TO_JS[availability.dayOfWeek] !== pointerDay) {
          continue;
        }

        const durationMinutes = this.durationToMinutes(availability.duration);
        const dayEnd = availability.endMinute;

        for (
          let minute = availability.startMinute;
          minute + durationMinutes <= dayEnd;
          minute += durationMinutes
        ) {
          const startAt = new Date(dayStart.getTime() + minute * 60000);
          const endAt = new Date(startAt.getTime() + durationMinutes * 60000);

          data.push({
            especialistaId,
            especialidadId: availability.especialidadId,
            date: dayStart,
            startAt,
            endAt,
            duration: availability.duration,
            status: SlotStatus.FREE,
            specialistAvailabilityId: availability.id,
          });
        }
      }
    }

    if (!data.length) {
      return { created: 0 };
    }

    const result = await this.prisma.appointmentSlot.createMany({
      data,
      skipDuplicates: true,
    });

    return { created: result.count };
  }

  private async ensureSpecialistEspecialidad(
    especialistaId: number,
    especialidadId: number,
  ) {
    const specialist = await this.prisma.especialistaProfile.findUnique({
      where: { id: especialistaId },
      select: { id: true },
    });

    if (!specialist) {
      throw new NotFoundException("Especialista inexistente");
    }

    const match =
      await this.prisma.especialistaEspecialidad.findUnique({
        where: {
          especialistaId_especialidadId: {
            especialistaId,
            especialidadId,
          },
        },
        select: { especialistaId: true },
      });

    if (!match) {
      throw new BadRequestException(
        "El especialista no tiene asociada esa especialidad",
      );
    }
  }

  private validateMinutes(
    startMinute: number,
    endMinute: number,
    duration: SlotDuration,
  ) {
    if (startMinute >= endMinute) {
      throw new BadRequestException(
        "El horario de inicio debe ser menor al horario de fin",
      );
    }

    if (startMinute % 5 !== 0 || endMinute % 5 !== 0) {
      throw new BadRequestException(
        "Los horarios deben ser múltiplos de 5 minutos",
      );
    }

    const durationMinutes = this.durationToMinutes(duration);
    if ((endMinute - startMinute) % durationMinutes !== 0) {
      throw new BadRequestException(
        "La duración debe completar la franja horaria sin sobrantes",
      );
    }
  }

  private durationToMinutes(duration: SlotDuration) {
    switch (duration) {
      case SlotDuration.MIN_5:
        return 5;
      case SlotDuration.MIN_10:
        return 10;
      case SlotDuration.MIN_15:
        return 15;
      case SlotDuration.MIN_30:
        return 30;
      default:
        throw new BadRequestException("Duración inválida");
    }
  }

  private startOfDay(date: Date) {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy;
  }

  private addDays(date: Date, days: number) {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + days);
    return copy;
  }

  private getStartDate(lastSlotDate?: Date) {
    if (!lastSlotDate) {
      return this.startOfDay(new Date());
    }

    const start = this.startOfDay(new Date(lastSlotDate));
    return this.addDays(start, 1);
  }
}
