import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AppointmentStatus, UserRole } from "@prisma/client";
import type { Request } from "express";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { SessionAuthGuard } from "../auth/guards/session-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import type { SessionUser } from "../auth/types/session-user";
import { AppointmentsService } from "./appointments.service";
import { AppointmentActionDto } from "./dto/appointment-action.dto";
import { CreateAppointmentDto } from "./dto/create-appointment.dto";
import { FinalizeAppointmentDto } from "./dto/finalize-appointment.dto";
import { QueryAppointmentsDto } from "./dto/query-appointments.dto";

@UseGuards(SessionAuthGuard, RolesGuard)
@Controller("appointments")
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  create(
    @Body() createAppointmentDto: CreateAppointmentDto,
    @CurrentUser() user: SessionUser,
  ) {
    return this.appointmentsService.create(createAppointmentDto, user.id);
  }

  @Get("me")
  me(@CurrentUser() user: SessionUser, @Query() query: QueryAppointmentsDto) {
    return this.appointmentsService.listMine(user.id, user.role, query);
  }

  @Roles(UserRole.ADMIN)
  @Get("admin")
  admin(@Query() query: QueryAppointmentsDto) {
    return this.appointmentsService.listAdmin(query);
  }

  @Patch(":id/cancel")
  cancel(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: SessionUser,
    @Body() body: AppointmentActionDto,
  ) {
    return this.appointmentsService.cancel(id, user.id, body.note);
  }

  @Roles(UserRole.SPECIALIST, UserRole.ADMIN)
  @Patch(":id/accept")
  accept(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: SessionUser,
  ) {
    return this.appointmentsService.accept(id, user.id);
  }

  @Roles(UserRole.SPECIALIST, UserRole.ADMIN)
  @Patch(":id/reject")
  reject(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: SessionUser,
    @Body() body: AppointmentActionDto,
  ) {
    return this.appointmentsService.reject(id, user.id, body.note ?? "");
  }

  @Roles(UserRole.SPECIALIST, UserRole.ADMIN)
  @Patch(":id/finalize")
  finalize(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: SessionUser,
    @Body() body: FinalizeAppointmentDto,
  ) {
    return this.appointmentsService.finalize(id, user.id, body);
  }

  @Roles(UserRole.PATIENT)
  @Patch(":id/patient-review")
  review(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: SessionUser,
    @Body() body: AppointmentActionDto,
  ) {
    return this.appointmentsService.patientReview(id, user.id, body.note ?? "");
  }
}
