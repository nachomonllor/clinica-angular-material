import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import type { SessionUser } from "../auth/types/session-user";
import { CreateUserDto } from "./dto/create-user.dto";
import { QueryUsersDto } from "./dto/query-users.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UpdateUserStatusDto } from "./dto/update-user-status.dto";
import { UsersService } from "./users.service";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller("admin/users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll(@Query() query: QueryUsersDto) {
    return this.usersService.findAll(query);
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    const user = await this.usersService.findOne(id);
    return this.usersService.toPublic(user);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Patch(":id/status")
  updateStatus(
    @Param("id") id: string,
    @Body() updateUserStatusDto: UpdateUserStatusDto,
  ) {
    return this.usersService.updateStatus(id, updateUserStatusDto);
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SPECIALIST, UserRole.ADMIN)
@Controller("specialists")
export class SpecialistsController {
  constructor(private readonly usersService: UsersService) {}

  // IMPORTANTE: Esta ruta debe ir ANTES de la ruta con parámetro dinámico
  @Get("me/specialties")
  getMySpecialties(@CurrentUser() user: SessionUser) {
    return this.usersService.getSpecialistSpecialtiesByUserId(user.id);
  }

  // Esta ruta debe ir DESPUÉS de las rutas estáticas como "me"
  @Get(":especialistaId/specialties")
  getSpecialties(@Param("especialistaId", ParseIntPipe) especialistaId: number) {
    return this.usersService.getSpecialistSpecialties(especialistaId);
  }
}

@UseGuards(JwtAuthGuard)
@Controller("users")
export class MyProfileController {
  constructor(private readonly usersService: UsersService) {}

  // Endpoint para que cualquier usuario autenticado actualice su propio perfil
  @Patch("me")
  updateMyProfile(
    @CurrentUser() currentUser: SessionUser,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    // Solo permitir actualizar el propio perfil
    return this.usersService.update(currentUser.id, updateUserDto);
  }
}
