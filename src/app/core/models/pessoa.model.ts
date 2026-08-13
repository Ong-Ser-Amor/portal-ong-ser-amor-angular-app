import { ContatoResposta } from './contato.model';

export interface CriarPessoaDto {
  nome: string;
  cpf: string;
  dataNascimento: string;
  emancipado?: boolean;
  podeSairSozinho?: boolean | null;
  responsavelId?: string | null;
}

export interface PessoaResumo extends CriarPessoaDto {
  id: string;
}

export interface Pessoa extends PessoaResumo {
  contatos?: ContatoResposta[];
}

export type AtualizarPessoaRequest = Partial<CriarPessoaDto>;