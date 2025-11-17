import { Routes } from "@angular/router";
import { authGuard } from "./guards/auth.guard";
import { roleGuard } from "./guards/role.guard";

export const routes: Routes = [
  {
    path: "login",
    loadComponent: () =>
      import("./features/auth/login/login.component").then((m) => m.LoginComponent),
  },
  {
    path: "seleccionar-registro",
    loadComponent: () =>
      import("./features/auth/seleccionar-registro/seleccionar-registro.component").then(
        (m) => m.SeleccionarRegistroComponent,
      ),
  },
  {
    path: "register",
    loadComponent: () =>
      import("./features/auth/register/register.component").then((m) => m.RegisterComponent),
  },
  {
    path: "register-especialista",
    loadComponent: () =>
      import("./features/auth/register-especialista/register-especialista.component").then(
        (m) => m.RegisterEspecialistaComponent,
      ),
  },
  {
    path: "admin/users",
    loadComponent: () =>
      import("./features/admin/admin-users/admin-users.component").then(
        (m) => m.AdminUsersComponent,
      ),
    canActivate: [authGuard, roleGuard(["ADMIN"])],
  },
  {
    path: "admin/estadisticas",
    loadComponent: () =>
      import("./features/admin/estadisticas/estadisticas.component").then(
        (m) => m.EstadisticasComponent,
      ),
    canActivate: [authGuard, roleGuard(["ADMIN"])],
  },
  {
    path: "bienvenida",
    loadComponent: () =>
      import("./features/bienvenida/bienvenida.component").then((m) => m.BienvenidaComponent),
  },
  {
    path: "mis-turnos-paciente",
    loadComponent: () =>
      import("./features/turnos/mis-turnos-paciente/mis-turnos-paciente.component").then(
        (m) => m.MisTurnosPacienteComponent,
      ),
    canActivate: [authGuard, roleGuard(["PATIENT"])],
  },
  {
    path: "mis-turnos-especialista",
    loadComponent: () =>
      import("./features/turnos/mis-turnos-especialista/mis-turnos-especialista.component").then(
        (m) => m.MisTurnosEspecialistaComponent,
      ),
    canActivate: [authGuard, roleGuard(["SPECIALIST"])],
  },
  {
    path: "solicitar-turno",
    loadComponent: () =>
      import("./features/turnos/solicitar-turno/solicitar-turno.component").then(
        (m) => m.SolicitarTurnoComponent,
      ),
    canActivate: [authGuard, roleGuard(["PATIENT", "ADMIN"])],
  },
  {
    path: "admin/turnos",
    loadComponent: () =>
      import("./features/admin/turnos-admin/turnos-admin.component").then(
        (m) => m.TurnosAdminComponent,
      ),
    canActivate: [authGuard, roleGuard(["ADMIN"])],
  },
      {
        path: "mi-perfil",
        loadComponent: () =>
          import("./features/profile/mi-perfil/mi-perfil.component").then(
            (m) => m.MiPerfilComponent,
          ),
        canActivate: [authGuard],
      },
      {
        path: "mis-pacientes",
        loadComponent: () =>
          import("./features/specialist/mis-pacientes/mis-pacientes.component").then(
            (m) => m.MisPacientesComponent,
          ),
        canActivate: [authGuard, roleGuard(["SPECIALIST"])],
      },
  { path: "", pathMatch: "full", redirectTo: "bienvenida" },
  { path: "**", redirectTo: "bienvenida" },
];
