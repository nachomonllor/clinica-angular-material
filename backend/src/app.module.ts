import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { PrismaModule } from "./prisma/prisma.module";
import { UsersModule } from "./users/users.module";
import { AvailabilityModule } from './availability/availability.module';
import { SlotsModule } from './slots/slots.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { MedicalRecordsModule } from './medical-records/medical-records.module';
import { ReportsModule } from './reports/reports.module';
import { EmailModule } from './email/email.module';
import { StorageModule } from './storage/storage.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [PrismaModule, UsersModule, AuthModule, AvailabilityModule, SlotsModule, AppointmentsModule, MedicalRecordsModule, ReportsModule, EmailModule, StorageModule, AdminModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
