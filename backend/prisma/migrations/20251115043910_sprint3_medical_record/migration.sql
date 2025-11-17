-- CreateTable
CREATE TABLE "MedicalRecord" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "especialistaId" INTEGER NOT NULL,
    "altura" INTEGER NOT NULL,
    "peso" INTEGER NOT NULL,
    "temperatura" DOUBLE PRECISION NOT NULL,
    "presion" TEXT NOT NULL,
    "extraData" JSON,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MedicalRecord_appointmentId_key" ON "MedicalRecord"("appointmentId");

-- CreateIndex
CREATE INDEX "MedicalRecord_pacienteId_idx" ON "MedicalRecord"("pacienteId");

-- CreateIndex
CREATE INDEX "MedicalRecord_especialistaId_idx" ON "MedicalRecord"("especialistaId");

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_especialistaId_fkey" FOREIGN KEY ("especialistaId") REFERENCES "EspecialistaProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
