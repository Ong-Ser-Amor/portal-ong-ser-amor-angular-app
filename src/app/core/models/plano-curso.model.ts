export interface PlanoCurso {
  id: string;
  nome: string;
  cursoId: string;
}

export interface CriarPlanoCursoDto extends Omit<PlanoCurso, 'id'> { }

export interface AtualizarPlanoCursoDto extends Partial<Omit<CriarPlanoCursoDto, 'cursoId'>> { }

export interface FiltroBuscaPlanoCurso {
  pagina?: number;
  itensPorPagina?: number;
}
