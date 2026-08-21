import { OpcaoSelect } from './opcao-select.model';

export type StatusAula = 'AGENDADA' | 'REALIZADA' | 'CANCELADA';

export const ROTULOS_STATUS_AULA: Record<StatusAula, string> = {
  AGENDADA: 'Agendada',
  REALIZADA: 'Realizada',
  CANCELADA: 'Cancelada',
};

export const OPCOES_STATUS_AULA: OpcaoSelect<StatusAula>[] = [
  { valor: 'AGENDADA', rotulo: 'Agendada' },
  { valor: 'REALIZADA', rotulo: 'Realizada' },
  { valor: 'CANCELADA', rotulo: 'Cancelada' },
];

export const OPCOES_STATUS_EDICAO_AULA: OpcaoSelect<StatusAula>[] = [
  { valor: 'AGENDADA', rotulo: 'Agendada' },
  { valor: 'CANCELADA', rotulo: 'Cancelada' },
];

export interface Aula {
  id: string;
  turmaId: string;
  data: string;
  tema: string;
  status: StatusAula;
}

export interface CriarAulaDto {
  turmaId: string;
  data: string;
  tema: string;
}

export interface AtualizarAulaDto {
  data?: string;
  tema?: string;
  status?: StatusAula;
}

export interface FiltroBuscaAula {
  pagina?: number;
  itensPorPagina?: number;
  turmaId?: string;
}
