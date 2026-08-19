import { OpcaoSelect } from './opcao-select.model';
import { Turma } from './turma.model';

export type StatusMatricula = 'ATIVA' | 'CONCLUIDA' | 'EVADIDA';
export type ResultadoFinalMatricula = 'APROVADO' | 'REPROVADO';

export const ROTULOS_STATUS_MATRICULA: Record<StatusMatricula, string> = {
  ATIVA: 'Ativa',
  CONCLUIDA: 'Concluída',
  EVADIDA: 'Evadida',
};

export const ROTULOS_RESULTADO_FINAL_MATRICULA: Record<ResultadoFinalMatricula, string> = {
  APROVADO: 'Aprovado',
  REPROVADO: 'Reprovado',
};

export const OPCOES_STATUS_MATRICULA: OpcaoSelect<StatusMatricula>[] = [
  { valor: 'ATIVA', rotulo: 'Ativa' },
  { valor: 'CONCLUIDA', rotulo: 'Concluída' },
  { valor: 'EVADIDA', rotulo: 'Evadida' },
];

export const OPCOES_RESULTADO_FINAL_MATRICULA: OpcaoSelect<ResultadoFinalMatricula>[] = [
  { valor: 'APROVADO', rotulo: 'Aprovado' },
  { valor: 'REPROVADO', rotulo: 'Reprovado' },
];

export interface BeneficiarioResumoMatricula {
  id: string;
  nome: string;
}

export interface TurmaMatricula {
  id: string;
  status: StatusMatricula;
  resultadoFinal: ResultadoFinalMatricula | null;
  notaFinal: string | null;
  parecerPedagogico: string | null;
  turma?: Turma;
  beneficiario: BeneficiarioResumoMatricula;
}

export interface CriarTurmaMatriculaDto {
  turmaId: string;
  beneficiarioId: string;
}

export interface AtualizarTurmaMatriculaDto {
  status?: StatusMatricula;
  resultadoFinal?: ResultadoFinalMatricula | null;
  notaFinal?: string | null;
  parecerPedagogico?: string | null;
}

export interface FiltroBuscaTurmaMatricula {
  pagina?: number;
  itensPorPagina?: number;
  turmaId?: string;
}
