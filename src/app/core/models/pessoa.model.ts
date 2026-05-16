export interface PessoaResposta {
  id: string;
  nome: string;
  cpf: string;
  dataNascimento: string;
  podeSairSozinho?: boolean;
  responsavelId?: string;
}

export interface AtualizarPessoaRequest {
  nome?: string;
  cpf?: string;
  dataNascimento?: string;
  podeSairSozinho?: boolean;
  responsavelId?: string;
}