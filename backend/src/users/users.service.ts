import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, UserRole, UserStatus } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../prisma/prisma.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { QueryUsersDto } from "./dto/query-users.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UpdateUserStatusDto } from "./dto/update-user-status.dto";

const USER_INCLUDE = {
  paciente: true,
  especialista: {
    include: {
      skills: {
        include: {
          especialidad: true,
        },
      },
    },
  },
  admin: true,
} satisfies Prisma.UserInclude;

type UserWithRelations = Prisma.UserGetPayload<{ include: typeof USER_INCLUDE }>;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    await this.ensureRoleData(dto);
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        nombre: dto.nombre,
        apellido: dto.apellido,
        edad: dto.edad,
        dni: dto.dni,
        email: dto.email.toLowerCase(),
        passwordHash,
        role: dto.role,
        status: dto.role === UserRole.SPECIALIST ? UserStatus.PENDING : UserStatus.APPROVED,
        paciente:
          dto.role === UserRole.PATIENT
            ? {
                create: {
                  obraSocial: dto.paciente!.obraSocial,
                  imagenUno: dto.paciente!.imagenUno,
                  imagenDos: dto.paciente!.imagenDos,
                },
              }
            : undefined,
        especialista:
          dto.role === UserRole.SPECIALIST
            ? {
                create: {
                  imagen: dto.especialista!.imagen,
                  notas: dto.especialista!.notas,
                  skills: {
                    create: await this.buildEspecialidades(
                      dto.especialista!.especialidades,
                    ),
                  },
                },
              }
            : undefined,
        admin:
          dto.role === UserRole.ADMIN
            ? {
                create: {
                  imagen: dto.admin?.imagen,
                },
              }
            : undefined,
      },
      include: USER_INCLUDE,
    });

    return this.toPublic(user);
  }

  async findAll(query: QueryUsersDto) {
    const users = await this.prisma.user.findMany({
      where: {
        role: query.role,
        status: query.status,
        OR: query.search
          ? [
              { nombre: { contains: query.search, mode: "insensitive" } },
              { apellido: { contains: query.search, mode: "insensitive" } },
              { email: { contains: query.search, mode: "insensitive" } },
              { dni: { contains: query.search, mode: "insensitive" } },
            ]
          : undefined,
      },
      include: USER_INCLUDE,
      orderBy: {
        createdAt: "desc",
      },
    });

    return users.map((user) => this.toPublic(user));
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: USER_INCLUDE,
    });

    if (!user) {
      throw new NotFoundException("Usuario no encontrado");
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: USER_INCLUDE,
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.findOne(id);

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        nombre: dto.nombre ?? user.nombre,
        apellido: dto.apellido ?? user.apellido,
        edad: dto.edad ?? user.edad,
        dni: dto.dni ?? user.dni,
        email: dto.email ? dto.email.toLowerCase() : user.email,
        paciente:
          dto.paciente && user.role === UserRole.PATIENT
            ? {
                update: {
                  obraSocial: dto.paciente.obraSocial,
                  imagenUno: dto.paciente.imagenUno,
                  imagenDos: dto.paciente.imagenDos,
                },
              }
            : undefined,
        especialista:
          dto.especialista && user.role === UserRole.SPECIALIST
            ? {
                update: {
                  imagen: dto.especialista.imagen,
                  notas: dto.especialista.notas,
                  skills: dto.especialista.especialidades
                    ? {
                        deleteMany: {},
                        create: await this.buildEspecialidades(
                          dto.especialista.especialidades,
                        ),
                      }
                    : undefined,
                },
              }
            : undefined,
        admin:
          dto.admin && user.role === UserRole.ADMIN
            ? {
                update: {
                  imagen: dto.admin.imagen,
                },
              }
            : undefined,
      },
      include: USER_INCLUDE,
    });

    return this.toPublic(updated);
  }

  async updateStatus(id: string, dto: UpdateUserStatusDto) {
    const user = await this.findOne(id);

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        status: dto.status,
      },
      include: USER_INCLUDE,
    });

    return this.toPublic(updated);
  }

  private async ensureRoleData(dto: CreateUserDto) {
    if (dto.role === UserRole.PATIENT && !dto.paciente) {
      throw new BadRequestException(
        "Los pacientes deben incluir datos de perfil",
      );
    }

    if (dto.role === UserRole.SPECIALIST && !dto.especialista) {
      throw new BadRequestException(
        "Los especialistas deben incluir datos de perfil",
      );
  }
  }

  private async buildEspecialidades(
    names: string[],
  ): Promise<
    Prisma.EspecialistaEspecialidadCreateWithoutEspecialistaInput[]
  > {
    const creations: Prisma.EspecialistaEspecialidadCreateWithoutEspecialistaInput[] =
      [];

    for (const nombre of names) {
      const slug = this.slugify(nombre);
      const especialidad = await this.prisma.especialidad.upsert({
        where: { slug },
        update: { nombre },
        create: { nombre, slug },
      });

      creations.push({
        especialidad: {
          connect: { id: especialidad.id },
        },
      });
    }

    return creations;
  }

  private slugify(value: string) {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase();
  }

  async getSpecialistSpecialtiesByUserId(userId: string) {
    const specialist = await this.prisma.especialistaProfile.findUnique({
      where: { userId },
      include: {
        skills: {
          include: {
            especialidad: true,
          },
        },
      },
    });

    if (!specialist) {
      throw new NotFoundException("Especialista no encontrado");
    }

    return specialist.skills.map((skill) => ({
      id: skill.especialidad.id,
      nombre: skill.especialidad.nombre,
      slug: skill.especialidad.slug,
    }));
  }

  async getSpecialistSpecialties(especialistaId: number) {
    const specialist = await this.prisma.especialistaProfile.findUnique({
      where: { id: especialistaId },
      include: {
        skills: {
          include: {
            especialidad: true,
          },
        },
      },
    });

    if (!specialist) {
      throw new NotFoundException("Especialista no encontrado");
    }

    return specialist.skills.map((skill) => ({
      id: skill.especialidad.id,
      nombre: skill.especialidad.nombre,
      slug: skill.especialidad.slug,
    }));
  }

  toPublic(user: UserWithRelations) {
    if (!user) {
      return null;
    }

    const { passwordHash, especialista, ...rest } = user;

    return {
      ...rest,
      especialista: especialista
        ? {
            id: especialista.id,
            imagen: especialista.imagen,
            notas: especialista.notas,
            especialidades: especialista.skills.map(
              (skill) => skill.especialidad.nombre,
            ),
          }
        : null,
    };
  }
}
