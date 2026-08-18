import { PlanoCurso } from './plano-curso.model';

export type StatusTurma = 'EM_FORMACAO' | 'EM_ANDAMENTO' | 'FINALIZADA' | 'CANCELADA';
export type CriterioAvaliacaoTurma =
  | 'SEM_CONTROLE'
  | 'POR_PARTICIPACAO'
  | 'POR_NOTA_PRESENCA'
  | 'QUALITATIVA';

export const ROTULOS_STATUS_TURMA: Record<StatusTurma, string> = {
  EM_FORMACAO: 'Em Formação',
  EM_ANDAMENTO: 'Em Andamento',
  FINALIZADA: 'Finalizada',
  CANCELADA: 'Cancelada',
};

export interface ProfessorResumo {
  id: string;
  nome: string;
}

export interface Turma {
  id: string;
  nome: string;
  planoCurso?: PlanoCurso;
  cargaHoraria: number;
  dataInicio: string;
  dataFim: string;
  status: StatusTurma;
  criterioAvaliacao: CriterioAvaliacaoTurma;
  frequenciaMinima?: number | null;
  notaMinima?: string | null;
  professores?: ProfessorResumo[];
}

export interface FiltroBuscaTurma {
  pagina?: number;
  itensPorPagina?: number;
  cursoId?: string | number;
  planoCursoId?: string | number;
}
