import { Component, OnInit, signal, AfterViewInit, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-bienvenida',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './bienvenida.component.html',
  styleUrl: './bienvenida.component.scss',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(8px)' }),
        animate('450ms ease-out', style({ opacity: 1, transform: 'none' }))
      ])
    ])
  ]
})
export class BienvenidaComponent implements OnInit, AfterViewInit {
  protected readonly autenticado = signal(false);
  protected readonly currentUser = signal<any>(null);

  constructor(
    private authService: AuthService,
    private router: Router,
    private el: ElementRef
  ) {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      const heroElement = this.el.nativeElement.querySelector('.hero') as HTMLElement;
      if (heroElement) {
        heroElement.style.backgroundImage = `linear-gradient(180deg, rgba(7,26,40,.05), rgba(7,26,40,.15)), url('/assets/medical.jpg')`;
        heroElement.style.backgroundPosition = 'center';
        heroElement.style.backgroundSize = 'cover';
        heroElement.style.backgroundRepeat = 'no-repeat';
        heroElement.style.backgroundAttachment = 'fixed';
      }
    }, 100);
  }

  async ngOnInit(): Promise<void> {
    await this.verificarSesion();
  }

  private async verificarSesion(): Promise<void> {
    try {
      const res = await firstValueFrom(this.authService.loadSession());
      const user = res.user;
      const tieneSesion = !!user;
      this.autenticado.set(tieneSesion);
      this.currentUser.set(user);
      // No redirigimos automáticamente desde bienvenida, solo mostramos el estado
    } catch (error) {
      console.error('[Bienvenida] Error al verificar sesión:', error);
      this.autenticado.set(false);
      this.currentUser.set(null);
    }
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.authService.logout());
      this.autenticado.set(false);
      this.currentUser.set(null);
      this.router.navigate(['/bienvenida']);
    } catch (error) {
      console.error('[Bienvenida] Error al cerrar sesión:', error);
    }
  }

  irADashboard(): void {
    const user = this.currentUser();
    if (user) {
      this.redirigirSegunRol(user.role);
    }
  }

  irARegistro(): void {
    this.router.navigate(['/seleccionar-registro']);
  }

  irALogin(): void {
    this.router.navigate(['/login']);
  }

  private async redirigirSegunRol(role: string): Promise<void> {
    if (role === 'PATIENT') {
      this.router.navigate(['/mis-turnos-paciente']);
    } else if (role === 'SPECIALIST') {
      this.router.navigate(['/mis-turnos-especialista']);
    } else if (role === 'ADMIN') {
      this.router.navigate(['/admin/users']);
    }
  }
}
