import { PrismaClient, UserRole, UserStatus } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed de la base de datos...");

  // 1. Crear especialidades básicas
  console.log("📋 Creando especialidades...");
  const especialidades = [
    { nombre: "Clínica Médica", slug: "clinica-medica" },
    { nombre: "Pediatría", slug: "pediatria" },
    { nombre: "Cardiología", slug: "cardiologia" },
    { nombre: "Dermatología", slug: "dermatologia" },
    { nombre: "Nutrición", slug: "nutricion" },
    { nombre: "Psicología", slug: "psicologia" },
    { nombre: "Oftalmología", slug: "oftalmologia" },
    { nombre: "Traumatología", slug: "traumatologia" },
  ];

  for (const esp of especialidades) {
    await prisma.especialidad.upsert({
      where: { slug: esp.slug },
      update: {},
      create: esp,
    });
  }
  console.log(`✅ ${especialidades.length} especialidades creadas/actualizadas`);

  // 2. Crear admin de prueba
  console.log("👤 Creando admin de prueba...");
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@clinica.com" },
    update: {},
    create: {
      nombre: "Admin",
      apellido: "Sistema",
      edad: 30,
      dni: "12345678",
      email: "admin@clinica.com",
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
      status: UserStatus.APPROVED,
      emailVerified: true,
      admin: {
        create: {},
      },
    },
    include: { admin: true },
  });
  console.log(`✅ Admin creado: ${admin.email} / admin123`);

  // 3. Crear especialista de prueba
  console.log("👨‍⚕️ Creando especialista de prueba...");
  const especialistaPassword = await bcrypt.hash("especialista123", 10);
  const especialista = await prisma.user.upsert({
    where: { email: "especialista@clinica.com" },
    update: {},
    create: {
      nombre: "Dr. Juan",
      apellido: "Pérez",
      edad: 35,
      dni: "23456789",
      email: "especialista@clinica.com",
      passwordHash: especialistaPassword,
      role: UserRole.SPECIALIST,
      status: UserStatus.APPROVED,
      emailVerified: true,
      especialista: {
        create: {
          skills: {
            create: [
              {
                especialidad: {
                  connect: { slug: "cardiologia" },
                },
              },
              {
                especialidad: {
                  connect: { slug: "clinica-medica" },
                },
              },
            ],
          },
        },
      },
    },
    include: {
      especialista: {
        include: {
          skills: {
            include: {
              especialidad: true,
            },
          },
        },
      },
    },
  });
  console.log(
    `✅ Especialista creado: ${especialista.email} / especialista123`,
  );

  // 4. Crear paciente de prueba
  console.log("👤 Creando paciente de prueba...");
  const pacientePassword = await bcrypt.hash("paciente123", 10);
  const paciente = await prisma.user.upsert({
    where: { email: "paciente@clinica.com" },
    update: {},
    create: {
      nombre: "María",
      apellido: "González",
      edad: 28,
      dni: "34567890",
      email: "paciente@clinica.com",
      passwordHash: pacientePassword,
      role: UserRole.PATIENT,
      status: UserStatus.APPROVED,
      emailVerified: true,
      paciente: {
        create: {
          obraSocial: "OSDE",
        },
      },
    },
    include: { paciente: true },
  });
  console.log(`✅ Paciente creado: ${paciente.email} / paciente123`);

  // 5. Crear usuarios de botones rápidos del frontend
  console.log("👤 Creando usuarios de botones rápidos...");
  
  // Admin rápido
  const adminRapidoPassword = await bcrypt.hash("123456", 10);
  const adminRapido = await prisma.user.upsert({
    where: { email: "admin@test.com" },
    update: {
      status: UserStatus.APPROVED,
      emailVerified: true,
    },
    create: {
      nombre: "Admin",
      apellido: "Test",
      edad: 30,
      dni: "11111111",
      email: "admin@test.com",
      passwordHash: adminRapidoPassword,
      role: UserRole.ADMIN,
      status: UserStatus.APPROVED,
      emailVerified: true,
      admin: {
        create: {},
      },
    },
    include: { admin: true },
  });
  console.log(`✅ Admin rápido creado: ${adminRapido.email} / 123456`);

  // Especialista rápido (Oculista)
  const especialistaRapidoPassword = await bcrypt.hash("123456", 10);
  const especialistaRapido = await prisma.user.upsert({
    where: { email: "ocu-doc@mail.com" },
    update: {
      status: UserStatus.APPROVED,
      emailVerified: true,
    },
    create: {
      nombre: "Dr. Oculista",
      apellido: "Test",
      edad: 35,
      dni: "22222222",
      email: "ocu-doc@mail.com",
      passwordHash: especialistaRapidoPassword,
      role: UserRole.SPECIALIST,
      status: UserStatus.APPROVED,
      emailVerified: true,
      especialista: {
        create: {
          skills: {
            create: [
              {
                especialidad: {
                  connect: { slug: "oftalmologia" },
                },
              },
            ],
          },
        },
      },
    },
    include: {
      especialista: {
        include: {
          skills: {
            include: {
              especialidad: true,
            },
          },
        },
      },
    },
  });
  console.log(`✅ Especialista rápido creado: ${especialistaRapido.email} / 123456`);

  // Paciente rápido
  const pacienteRapidoPassword = await bcrypt.hash("123456", 10);
  const pacienteRapido = await prisma.user.upsert({
    where: { email: "pac1@mail.com" },
    update: {
      status: UserStatus.APPROVED,
      emailVerified: true,
    },
    create: {
      nombre: "Paciente",
      apellido: "Test",
      edad: 28,
      dni: "33333333",
      email: "pac1@mail.com",
      passwordHash: pacienteRapidoPassword,
      role: UserRole.PATIENT,
      status: UserStatus.APPROVED,
      emailVerified: true,
      paciente: {
        create: {
          obraSocial: "Swiss Medical",
        },
      },
    },
    include: { paciente: true },
  });
  console.log(`✅ Paciente rápido creado: ${pacienteRapido.email} / 123456`);

  console.log("\n✅ Seed completado exitosamente!");
  console.log("\n📝 Usuarios de prueba creados:");
  console.log("   Admin: admin@clinica.com / admin123");
  console.log("   Especialista: especialista@clinica.com / especialista123");
  console.log("   Paciente: paciente@clinica.com / paciente123");
  console.log("\n📝 Usuarios de botones rápidos:");
  console.log("   Admin: admin@test.com / 123456");
  console.log("   Especialista: ocu-doc@mail.com / 123456");
  console.log("   Paciente: pac1@mail.com / 123456");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

