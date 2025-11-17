import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { Roles } from "../auth/decorators/roles.decorator";
import { SessionAuthGuard } from "../auth/guards/session-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { AvailabilityService } from "./availability.service";
import { CreateAvailabilityDto } from "./dto/create-availability.dto";
import { GenerateSlotsDto } from "./dto/generate-slots.dto";
import { QueryAvailabilityDto } from "./dto/query-availability.dto";
import { UpdateAvailabilityDto } from "./dto/update-availability.dto";

@Controller("availability")
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SPECIALIST)
  @Post()
  create(@Body() createAvailabilityDto: CreateAvailabilityDto) {
    return this.availabilityService.create(createAvailabilityDto);
  }

  @Get()
  findAll(@Query() query: QueryAvailabilityDto) {
    return this.availabilityService.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.availabilityService.findOne(id);
  }

  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SPECIALIST)
  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateAvailabilityDto: UpdateAvailabilityDto,
  ) {
    return this.availabilityService.update(id, updateAvailabilityDto);
  }

  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SPECIALIST)
  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.availabilityService.remove(id);
  }

  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SPECIALIST)
  @Post("specialist/:especialistaId/generate-slots")
  generateSlots(
    @Param("especialistaId", ParseIntPipe) especialistaId: number,
    @Body() dto: GenerateSlotsDto,
  ) {
    return this.availabilityService.generateSlots(especialistaId, dto);
  }
}
