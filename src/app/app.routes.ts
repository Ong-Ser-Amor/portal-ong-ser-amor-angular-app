import { Routes } from '@angular/router';
import { LoginComponent } from './features/autenticacao/login/login.component';
import { LayoutComponent } from './layout/layout.component';
import { autenticacaoGuard } from './core/guards/autenticacao.guard';
import { perfilAcessoGuard } from './core/guards/perfil-acesso.guard';
import { PERFIL_ACESSO } from './core/models/usuario.model';
import { VoluntariosRoutes } from './features/voluntarios/voluntarios.routing';
import { CursosRoutes } from './features/cursos/cursos.routing';
import { BeneficiariosRoutes } from './features/beneficiarios/beneficiarios.routing';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [autenticacaoGuard],
    children: [
      {
        path: 'beneficiarios',
        canActivate: [perfilAcessoGuard],
        data: { perfis: [PERFIL_ACESSO.ADMINISTRADOR] },
        children: BeneficiariosRoutes,
      },
      {
        path: 'voluntarios',
        canActivate: [perfilAcessoGuard],
        data: { perfis: [PERFIL_ACESSO.ADMINISTRADOR] },
        children: VoluntariosRoutes,
      },
      {
        path: 'cursos',
        canActivate: [perfilAcessoGuard],
        data: {
          perfis: [
            PERFIL_ACESSO.ADMINISTRADOR,
            PERFIL_ACESSO.COORDENADOR_CURSOS,
            PERFIL_ACESSO.PROFESSOR,
          ],
        },
        children: CursosRoutes,
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
