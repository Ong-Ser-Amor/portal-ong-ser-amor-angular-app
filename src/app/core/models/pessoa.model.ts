import { ContatoResposta } from './contato.model';

export interface PessoaResumo {
  id: string;
  nome: string;
  cpf: string;
  dataNascimento: string;
  emancipado: boolean;
  podeSairSozinho: boolean | null;
  responsavelId: string | null;
}

export interface Pessoa extends PessoaResumo {
  contatos?: ContatoResposta[];
}

export type AtualizarPessoaRequest = Partial<Omit<PessoaResumo, 'id'>>;