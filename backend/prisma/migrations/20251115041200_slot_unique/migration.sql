-- Add unique constraint to prevent duplicated slots per especialista/start time
CREATE UNIQUE INDEX "AppointmentSlot_especialistaId_startAt_key"
  ON "AppointmentSlot"("especialistaId", "startAt");

