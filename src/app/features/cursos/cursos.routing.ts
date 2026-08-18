import { Routes } from '@angular/router';
import { CursosComponent } from './cursos.component';
import { DetalhesCursoComponent } from './detalhes-curso/detalhes-curso.component';

export const CursosRoutes: Routes = [
  {
    path: '',
    component: CursosComponent,
  },
  {
    path: ':id',
    component: DetalhesCursoComponent,
  },
];
