import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import type { SessionUser } from "../auth/types/session-user";
import { MedicalRecordsService } from "./medical-records.service";

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("medical-records")
export class MedicalRecordsController {
  constructor(private readonly medicalRecordsService: MedicalRecordsService) {}

  @Roles(UserRole.PATIENT)
  @Get("me")
  getMine(@CurrentUser() user: SessionUser) {
    return this.medicalRecordsService.findForPatient(user.id);
  }

  @Roles(UserRole.ADMIN)
  @Get("admin/patient/:patientId")
  adminPatient(
    @Param("patientId", ParseUUIDPipe) patientId: string,
  ) {
    return this.medicalRecordsService.findForPatient(patientId);
  }

  @Roles(UserRole.SPECIALIST)
  @Get("specialist/patients")
  specialistPatients(@CurrentUser() user: SessionUser) {
    return this.medicalRecordsService.listPatients(user.id);
  }

  @Roles(UserRole.SPECIALIST)
  @Get("specialist/patient/:patientId")
  specialistPatientHistory(
    @Param("patientId", ParseUUIDPipe) patientId: string,
    @CurrentUser() user: SessionUser,
  ) {
    return this.medicalRecordsService.findForSpecialist(patientId, user.id);
  }
}
