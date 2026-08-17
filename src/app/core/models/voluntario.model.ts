import { Pessoa, PessoaResumo } from './pessoa.model';
import { OpcaoSelect } from './opcao-select.model';

export type NivelFormacao = 'COMPLETO' | 'CURSANDO' | 'INCOMPLETO';
export type TipoVoluntario = 'COORDENADOR' | 'PROFESSOR' | 'GERAL';

export const OPCOES_NIVEL_FORMACAO: OpcaoSelect<NivelFormacao>[] = [
  { valor: 'COMPLETO', rotulo: 'Completo' },
  { valor: 'CURSANDO', rotulo: 'Cursando' },
  { valor: 'INCOMPLETO', rotulo: 'Incompleto' },
];

export const OPCOES_TIPO_VOLUNTARIO: OpcaoSelect<TipoVoluntario>[] = [
  { valor: 'COORDENADOR', rotulo: 'Coordenador' },
  { valor: 'PROFESSOR', rotulo: 'Professor' },
  { valor: 'GERAL', rotulo: 'Geral' },
];

export interface VoluntarioResumo {
  id: string;
  pessoa: PessoaResumo;
  formacaoAcademica: string | null;
  statusFormacao: NivelFormacao | null;
  tipoVoluntario: TipoVoluntario;
}

export interface Voluntario extends Omit<VoluntarioResumo, 'pessoa'> {
  pessoa: Pessoa;
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

export interface FiltroBuscaVoluntario {
  pagina?: number;
  itensPorPagina?: number;
  nome?: string;
}
