import { Component, OnInit } from '@angular/core';
import { RouterOutlet, NavigationEnd, Router, RouterEvent } from '@angular/router';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { AuthService } from './services/auth.service';
import { firstValueFrom } from 'rxjs';
import { filter } from 'rxjs/operators';
import { routeAnimationsAdvanced } from './animations/route.animations';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  animations: [routeAnimationsAdvanced],
})
export class AppComponent implements OnInit {
  title = 'frontend';
  routeAnimationState = '';

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  async ngOnInit(): Promise<void> {
    // Cargar sesión al iniciar la app
    try {
      await firstValueFrom(this.authService.loadSession());
    } catch (error) {
      // Si no hay sesión, no pasa nada
      console.log('[App] No hay sesión activa');
    }

    // Inicializar estado de animación
    this.routeAnimationState = this.getRouteAnimationData();

    // Actualizar estado de animación cuando cambia la ruta
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        this.routeAnimationState = this.getRouteAnimationData();
      });
  }

  getRouteAnimationData(): string {
    // Determinar el tipo de animación basado en la ruta
    const url = this.router.url.split('?')[0];
    
    // Login/Register: slideRight
    if (url === '/login' || url === '/register' || url === '/register-especialista' || url === '/seleccionar-registro') {
      return 'slideRight';
    }
    
    // Admin pages: scaleIn
    if (url.startsWith('/admin')) {
      return 'scaleIn';
    }
    
    // Patient/Specialist pages: slideLeft
    if (url.startsWith('/mis-turnos') || url === '/solicitar-turno' || url === '/mi-perfil' || url === '/mis-pacientes') {
      return 'slideLeft';
    }
    
    // Bienvenida: bounceIn
    if (url === '/bienvenida' || url === '/') {
      return 'bounceIn';
    }
    
    // Default: fadeSlide (original)
    return 'fadeSlide';
  }
}
