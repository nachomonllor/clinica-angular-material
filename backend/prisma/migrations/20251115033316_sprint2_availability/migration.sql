-- CreateEnum
CREATE TYPE "Weekday" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "SlotDuration" AS ENUM ('MIN_5', 'MIN_10', 'MIN_15', 'MIN_30');

-- CreateEnum
CREATE TYPE "SlotStatus" AS ENUM ('FREE', 'RESERVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'DONE');

-- CreateTable
CREATE TABLE "SpecialistAvailability" (
    "id" SERIAL NOT NULL,
    "especialistaId" INTEGER NOT NULL,
    "especialidadId" INTEGER NOT NULL,
    "dayOfWeek" "Weekday" NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,
    "duration" "SlotDuration" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpecialistAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentSlot" (
    "id" TEXT NOT NULL,
    "especialistaId" INTEGER NOT NULL,
    "especialidadId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "duration" "SlotDuration" NOT NULL,
    "status" "SlotStatus" NOT NULL DEFAULT 'FREE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "specialistAvailabilityId" INTEGER,

    CONSTRAINT "AppointmentSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "especialistaId" INTEGER NOT NULL,
    "especialidadId" INTEGER NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "creadoPorId" TEXT,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "cancelReason" TEXT,
    "rejectReason" TEXT,
    "specialistReview" TEXT,
    "patientComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentHistory" (
    "id" SERIAL NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "actorId" TEXT,
    "action" "AppointmentStatus" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppointmentHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SpecialistAvailability_especialistaId_especialidadId_idx" ON "SpecialistAvailability"("especialistaId", "especialidadId");

-- CreateIndex
CREATE INDEX "AppointmentSlot_especialistaId_date_idx" ON "AppointmentSlot"("especialistaId", "date");

-- CreateIndex
CREATE INDEX "AppointmentSlot_especialidadId_date_idx" ON "AppointmentSlot"("especialidadId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_slotId_key" ON "Appointment"("slotId");

-- CreateIndex
CREATE INDEX "Appointment_pacienteId_status_idx" ON "Appointment"("pacienteId", "status");

-- CreateIndex
CREATE INDEX "Appointment_especialistaId_status_idx" ON "Appointment"("especialistaId", "status");

-- CreateIndex
CREATE INDEX "Appointment_especialidadId_status_idx" ON "Appointment"("especialidadId", "status");

-- AddForeignKey
ALTER TABLE "SpecialistAvailability" ADD CONSTRAINT "SpecialistAvailability_especialistaId_fkey" FOREIGN KEY ("especialistaId") REFERENCES "EspecialistaProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecialistAvailability" ADD CONSTRAINT "SpecialistAvailability_especialidadId_fkey" FOREIGN KEY ("especialidadId") REFERENCES "Especialidad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentSlot" ADD CONSTRAINT "AppointmentSlot_especialistaId_fkey" FOREIGN KEY ("especialistaId") REFERENCES "EspecialistaProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentSlot" ADD CONSTRAINT "AppointmentSlot_especialidadId_fkey" FOREIGN KEY ("especialidadId") REFERENCES "Especialidad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentSlot" ADD CONSTRAINT "AppointmentSlot_specialistAvailabilityId_fkey" FOREIGN KEY ("specialistAvailabilityId") REFERENCES "SpecialistAvailability"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "AppointmentSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_especialistaId_fkey" FOREIGN KEY ("especialistaId") REFERENCES "EspecialistaProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_especialidadId_fkey" FOREIGN KEY ("especialidadId") REFERENCES "Especialidad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentHistory" ADD CONSTRAINT "AppointmentHistory_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentHistory" ADD CONSTRAINT "AppointmentHistory_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
