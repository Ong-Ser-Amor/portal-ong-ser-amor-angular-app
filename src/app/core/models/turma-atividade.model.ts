import { OpcaoSelect } from './opcao-select.model';

export type TipoAtividade = 'EXERCICIO' | 'PROJETO' | 'PROVA' | 'OUTRA';

export const ROTULOS_TIPO_ATIVIDADE: Record<TipoAtividade, string> = {
  EXERCICIO: 'Exercício',
  PROJETO: 'Projeto',
  PROVA: 'Prova',
  OUTRA: 'Outra',
};

export const OPCOES_TIPO_ATIVIDADE: OpcaoSelect<TipoAtividade>[] = [
  { valor: 'EXERCICIO', rotulo: 'Exercício' },
  { valor: 'PROJETO', rotulo: 'Projeto' },
  { valor: 'PROVA', rotulo: 'Prova' },
  { valor: 'OUTRA', rotulo: 'Outra' },
];

export type StatusEntregaAtividade =
  | 'PENDENTE'
  | 'ENTREGUE'
  | 'ENTREGUE_COM_ATRASO'
  | 'NAO_ENTREGUE';

export const ROTULOS_STATUS_ENTREGA: Record<StatusEntregaAtividade, string> = {
  PENDENTE: 'Pendente',
  ENTREGUE: 'Entregue',
  ENTREGUE_COM_ATRASO: 'Entregue com Atraso',
  NAO_ENTREGUE: 'Não Entregue',
};

export const OPCOES_STATUS_ENTREGA: OpcaoSelect<StatusEntregaAtividade>[] = [
  { valor: 'PENDENTE', rotulo: 'Pendente' },
  { valor: 'ENTREGUE', rotulo: 'Entregue' },
  { valor: 'ENTREGUE_COM_ATRASO', rotulo: 'Entregue com Atraso' },
  { valor: 'NAO_ENTREGUE', rotulo: 'Não Entregue' },
];

export interface CriarTurmaAtividadeDto {
  turmaId: string;
  titulo: string;
  descricao?: string | null;
  tipoAtividade: TipoAtividade;
  valeNota: boolean;
  notaMaxima?: string | null;
  dataAtribuicao: string;
  prazoEntrega: string;
}

export interface AtualizarTurmaAtividadeDto {
  titulo?: string;
  descricao?: string | null;
  tipoAtividade?: TipoAtividade;
  valeNota?: boolean;
  notaMaxima?: string | null;
  dataAtribuicao?: string;
  prazoEntrega?: string;
}

export interface TurmaAtividadeRespostaDto {
  id: string;
  turmaId: string;
  titulo: string;
  descricao?: string | null;
  tipoAtividade: TipoAtividade;
  valeNota: boolean;
  notaMaxima?: string | null;
  dataAtribuicao: string;
  prazoEntrega: string;
}

export interface MatriculaResumoDto {
  id: string;
  beneficiarioId: string;
  nomeAluno: string;
}

export interface TurmaAtividadeEntregaRespostaDto {
  id: string;
  atividadeId: string;
  matriculaId: string;
  statusEntrega: StatusEntregaAtividade;
  notaObtida?: string | null;
  dataEntrega?: string | null;
  observacao?: string | null;
  atividade?: TurmaAtividadeRespostaDto;
  matricula?: MatriculaResumoDto;
}

export interface EntregaAtividadeDto {
  entregaId: string;
  statusEntrega: StatusEntregaAtividade;
  notaObtida?: string | null;
  observacao?: string | null;
}

export interface RegistrarEntregasLoteDto {
  entregas: EntregaAtividadeDto[];
}
