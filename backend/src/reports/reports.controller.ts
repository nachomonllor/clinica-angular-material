import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { AppointmentStatus } from "@prisma/client";
import { Roles } from "../auth/decorators/roles.decorator";
import { RolesGuard } from "../auth/guards/roles.guard";
import { SessionAuthGuard } from "../auth/guards/session-auth.guard";
import { ReportsService } from "./reports.service";

@UseGuards(SessionAuthGuard, RolesGuard)
@Roles("ADMIN")
@Controller("admin/reports")
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get("logins")
  logins(
    @Query("desde") desde?: string,
    @Query("hasta") hasta?: string,
    @Query("userId") userId?: string,
  ) {
    return this.reportsService.logins(desde, hasta, userId);
  }

  @Get("turnos-por-especialidad")
  turnosPorEspecialidad(
    @Query("desde") desde?: string,
    @Query("hasta") hasta?: string,
  ) {
    return this.reportsService.appointmentsByEspecialidad(desde, hasta);
  }

  @Get("turnos-por-dia")
  turnosPorDia(
    @Query("desde") desde?: string,
    @Query("hasta") hasta?: string,
  ) {
    return this.reportsService.appointmentsByDay(desde, hasta);
  }

  @Get("turnos-por-medico")
  turnosPorMedico(
    @Query("desde") desde?: string,
    @Query("hasta") hasta?: string,
    @Query("soloFinalizados") soloFinalizados?: string,
  ) {
    const onlyFinalized = soloFinalizados === "true";
    return this.reportsService.appointmentsByMedico(desde, hasta, onlyFinalized);
  }

  @Get("turnos-finalizados-por-medico")
  turnosFinalizadosPorMedico(
    @Query("desde") desde?: string,
    @Query("hasta") hasta?: string,
  ) {
    return this.reportsService.appointmentsByMedico(desde, hasta, true);
  }
}
