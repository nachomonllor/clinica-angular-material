import { Controller, Get, Query } from "@nestjs/common";
import { SlotsService } from "./slots.service";
import { QuerySlotsDto } from "./dto/query-slots.dto";

@Controller("slots")
export class SlotsController {
  constructor(private readonly slotsService: SlotsService) {}

  @Get()
  findAll(@Query() query: QuerySlotsDto) {
    return this.slotsService.findAll(query);
  }

  // Endpoint público para obtener todas las especialidades disponibles
  // (que tienen al menos un especialista asignado y aprobado)
  @Get("specialties")
  findAllSpecialties() {
    return this.slotsService.findAllAvailableSpecialties();
  }
}
