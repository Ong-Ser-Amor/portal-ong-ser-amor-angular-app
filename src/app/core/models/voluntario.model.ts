import { Pessoa } from './pessoa.model';

export type NivelFormacao = 'COMPLETO' | 'CURSANDO' | 'INCOMPLETO';
export type TipoVoluntario = 'COORDENADOR' | 'PROFESSOR' | 'GERAL';

export interface Voluntario {
  id: string;
  pessoa: Pessoa;
  formacaoAcademica: string | null;
  statusFormacao: NivelFormacao | null;
  tipoVoluntario: TipoVoluntario;
}

export interface CriarVoluntarioComPessoaExistenteDto {
  pessoaId: string;
  tipoVoluntario: TipoVoluntario;
  formacaoAcademica?: string;
  statusFormacao?: NivelFormacao;
}

export interface CriarVoluntarioComNovaPessoaDto {
  nome: string;
  cpf: string;
  dataNascimento: string;
  tipoVoluntario: TipoVoluntario;
  formacaoAcademica?: string;
  statusFormacao?: NivelFormacao;
}

export type CriarVoluntarioDto =
  | CriarVoluntarioComPessoaExistenteDto
  | CriarVoluntarioComNovaPessoaDto;

export type AtualizarVoluntarioDto = Partial<
  | CriarVoluntarioComPessoaExistenteDto
  | CriarVoluntarioComNovaPessoaDto
>;
