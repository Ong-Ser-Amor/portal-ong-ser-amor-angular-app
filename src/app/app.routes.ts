import { Routes } from '@angular/router';
import { LoginComponent } from './features/autenticacao/login/login.component';
import { LayoutComponent } from './layout/layout.component';
import { autenticacaoGuard } from './core/guards/autenticacao.guard';
import { VoluntariosRoutes } from './features/voluntarios/voluntarios.routing';
import { CursosRoutes } from './features/cursos/cursos.routing';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [autenticacaoGuard],
    children: [
      { path: 'cursos', children: CursosRoutes },
      { path: 'voluntarios', children: VoluntariosRoutes },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
