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

export const OPCOES_STATUS_TURMA = [
  { valor: 'EM_FORMACAO', rotulo: 'Em Formação' },
  { valor: 'EM_ANDAMENTO', rotulo: 'Em Andamento' },
  { valor: 'FINALIZADA', rotulo: 'Finalizada' },
  { valor: 'CANCELADA', rotulo: 'Cancelada' },
] as const;

export const ROTULOS_CRITERIO_AVALIACAO_TURMA: Record<CriterioAvaliacaoTurma, string> = {
  SEM_CONTROLE: 'Sem Controle',
  POR_PARTICIPACAO: 'Por Participação',
  POR_NOTA_PRESENCA: 'Por Nota e Presença',
  QUALITATIVA: 'Qualitativa',
};

export const OPCOES_CRITERIO_AVALIACAO_TURMA = [
  { valor: 'SEM_CONTROLE', rotulo: 'Sem Controle' },
  { valor: 'POR_PARTICIPACAO', rotulo: 'Por Participação' },
  { valor: 'POR_NOTA_PRESENCA', rotulo: 'Por Nota e Presença' },
  { valor: 'QUALITATIVA', rotulo: 'Qualitativa' },
] as const;

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

export interface CriarTurmaDto {
  planoCursoId: string;
  nome: string;
  cargaHoraria: number;
  dataInicio: string;
  dataFim: string;
  status: StatusTurma;
  criterioAvaliacao: CriterioAvaliacaoTurma;
  frequenciaMinima?: number | null;
  notaMinima?: string | null;
}

export interface AtualizarTurmaDto extends Partial<Omit<CriarTurmaDto, 'planoCursoId'>> {}

export interface FiltroBuscaTurma {
  pagina?: number;
  itensPorPagina?: number;
  cursoId?: string | number;
  planoCursoId?: string | number;
}
