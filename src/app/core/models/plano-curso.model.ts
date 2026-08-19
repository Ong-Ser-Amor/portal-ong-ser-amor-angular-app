import { Curso } from './curso.model';

export interface PlanoCurso {
  id: string;
  nome: string;
  cursoId: string;
  curso?: Curso;
}

export interface CriarPlanoCursoDto extends Omit<PlanoCurso, 'id' | 'curso'> {}

export interface AtualizarPlanoCursoDto extends Partial<Omit<CriarPlanoCursoDto, 'cursoId'>> {}

export interface FiltroBuscaPlanoCurso {
  pagina?: number;
  itensPorPagina?: number;
  cursoId?: string;
}
