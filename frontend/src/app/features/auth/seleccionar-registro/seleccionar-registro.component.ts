import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-seleccionar-registro',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seleccionar-registro.component.html',
  styleUrl: './seleccionar-registro.component.scss'
})
export class SeleccionarRegistroComponent {
  opciones = [
    {
      rol: 'Paciente',
      descripcion: 'Solicitá turnos y llevá tu historia clínica digital.',
      route: '/register',
      color: '#2563eb'
    },
    {
      rol: 'Especialista',
      descripcion: 'Gestioná tu agenda y registrá historias clínicas.',
      route: '/register-especialista',
      color: '#7c3aed'
    }
  ];

  constructor(private router: Router) {}

  seleccionar(opcion: typeof this.opciones[number]): void {
    this.router.navigate([opcion.route]);
  }
}
