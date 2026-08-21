import { Routes } from '@angular/router';
import { CursosComponent } from './cursos.component';
import { DetalhesCursoComponent } from './detalhes-curso/detalhes-curso.component';
import { DetalhesTurmaComponent } from './detalhes-turma/detalhes-turma.component';
import { ChamadaAulaComponent } from './chamada-aula/chamada-aula.component';

export const CursosRoutes: Routes = [
  {
    path: '',
    component: CursosComponent,
  },
  {
    path: ':id',
    component: DetalhesCursoComponent,
  },
  {
    path: ':cursoId/turmas/:turmaId',
    component: DetalhesTurmaComponent,
  },
  {
    path: ':cursoId/turmas/:turmaId/aulas/:aulaId/chamada',
    component: ChamadaAulaComponent,
  },
];
