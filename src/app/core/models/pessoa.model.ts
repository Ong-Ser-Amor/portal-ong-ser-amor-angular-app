export interface PessoaResposta {
  id: string;
  nome: string;
  cpf: string;
  dataNascimento: string;
  podeSairSozinho?: boolean;
  responsavelId?: string;
}