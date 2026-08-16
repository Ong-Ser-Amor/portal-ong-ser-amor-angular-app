import { Routes } from '@angular/router';
import { VoluntariosComponent } from './voluntarios.component';
import { CadastroVoluntarioComponent } from './cadastro-voluntario/cadastro-voluntario.component';

export const VoluntariosRoutes: Routes = [
  {
    path: '',
    component: VoluntariosComponent,
  },
  {
    path: 'novo',
    component: CadastroVoluntarioComponent,
  },
];
