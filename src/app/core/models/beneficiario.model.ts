import { CriarFamiliaDto, Familia } from './familia.model';
import { Pessoa, PessoaResumo } from './pessoa.model';
import { CriarContatoDto } from './contato.model';
import { OpcaoSelect } from './opcao-select.model';

export type NivelEscolaridade =
  | 'ENSINO_FUNDAMENTAL_INCOMPLETO'
  | 'ENSINO_FUNDAMENTAL_COMPLETO'
  | 'ENSINO_MEDIO_INCOMPLETO'
  | 'ENSINO_MEDIO_COMPLETO'
  | 'ENSINO_SUPERIOR_INCOMPLETO'
  | 'ENSINO_SUPERIOR_COMPLETO'
  | 'SEM_ESCOLARIDADE';

export type EstadoCivil =
  | 'SOLTEIRO'
  | 'UNIAO_ESTAVEL'
  | 'CASADO'
  | 'DIVORCIADO'
  | 'VIUVO';

export type VinculoEmpregaticio =
  | 'EMPREGADO_CLT'
  | 'AUTONOMO'
  | 'INFORMAL'
  | 'DESEMPREGADO'
  | 'APOSENTADO';

export const OPCOES_NIVEL_ESCOLARIDADE: OpcaoSelect<NivelEscolaridade>[] = [
  { valor: 'ENSINO_FUNDAMENTAL_INCOMPLETO', rotulo: 'Ensino Fundamental Incompleto' },
  { valor: 'ENSINO_FUNDAMENTAL_COMPLETO', rotulo: 'Ensino Fundamental Completo' },
  { valor: 'ENSINO_MEDIO_INCOMPLETO', rotulo: 'Ensino Médio Incompleto' },
  { valor: 'ENSINO_MEDIO_COMPLETO', rotulo: 'Ensino Médio Completo' },
  { valor: 'ENSINO_SUPERIOR_INCOMPLETO', rotulo: 'Ensino Superior Incompleto' },
  { valor: 'ENSINO_SUPERIOR_COMPLETO', rotulo: 'Ensino Superior Completo' },
  { valor: 'SEM_ESCOLARIDADE', rotulo: 'Sem Escolaridade' },
];

export const OPCOES_ESTADO_CIVIL: OpcaoSelect<EstadoCivil>[] = [
  { valor: 'SOLTEIRO', rotulo: 'Solteiro(a)' },
  { valor: 'UNIAO_ESTAVEL', rotulo: 'União Estável' },
  { valor: 'CASADO', rotulo: 'Casado(a)' },
  { valor: 'DIVORCIADO', rotulo: 'Divorciado(a)' },
  { valor: 'VIUVO', rotulo: 'Viúvo(a)' },
];

export const OPCOES_VINCULO_EMPREGATICIO: OpcaoSelect<VinculoEmpregaticio>[] = [
  { valor: 'EMPREGADO_CLT', rotulo: 'Empregado CLT (Carteira Assinada)' },
  { valor: 'AUTONOMO', rotulo: 'Autônomo' },
  { valor: 'INFORMAL', rotulo: 'Informal' },
  { valor: 'DESEMPREGADO', rotulo: 'Desempregado(a)' },
  { valor: 'APOSENTADO', rotulo: 'Aposentado(a)' },
];

export interface BeneficiarioResumo {
  id: string;
  familiaId: string | null;
  pessoa: PessoaResumo;
  nivelEscolaridade: NivelEscolaridade;
  estadoCivil: EstadoCivil | null;
  vinculoEmpregaticio: VinculoEmpregaticio | null;
  quantidadeFilhos: number | null;
}

export interface Beneficiario extends Omit<BeneficiarioResumo, 'pessoa' | 'familiaId'> {
  pessoa: Pessoa;
  familia: Familia;
}

export interface CriarBeneficiarioComPessoaEFamiliaExistentesDto {
  pessoaId: string;
  familiaId: string;
  nivelEscolaridade: NivelEscolaridade;
  estadoCivil?: EstadoCivil;
  vinculoEmpregaticio?: VinculoEmpregaticio;
  quantidadeFilhos?: number;
  contatos: CriarContatoDto[];
}

export interface CriarBeneficiarioComPessoaExistenteEFamiliaNovaDto {
  pessoaId: string;
  novaFamilia: CriarFamiliaDto;
  nivelEscolaridade: NivelEscolaridade;
  estadoCivil?: EstadoCivil;
  vinculoEmpregaticio?: VinculoEmpregaticio;
  quantidadeFilhos?: number;
  contatos: CriarContatoDto[];
}

export interface CriarBeneficiarioComPessoaEFamiliaNovasDto {
  nome: string;
  cpf: string;
  dataNascimento: string;
  emancipado?: boolean;
  podeSairSozinho?: boolean;
  responsavelId?: string;
  quantidadeFilhos?: number;
  nivelEscolaridade: NivelEscolaridade;
  estadoCivil?: EstadoCivil;
  vinculoEmpregaticio?: VinculoEmpregaticio;
  novaFamilia: CriarFamiliaDto;
  contatos: CriarContatoDto[];
}

export interface CriarBeneficiarioComPessoaNovaEFamiliaExistenteDto {
  nome: string;
  cpf: string;
  dataNascimento: string;
  emancipado?: boolean;
  podeSairSozinho?: boolean;
  responsavelId?: string;
  quantidadeFilhos?: number;
  nivelEscolaridade: NivelEscolaridade;
  estadoCivil?: EstadoCivil;
  vinculoEmpregaticio?: VinculoEmpregaticio;
  familiaId: string;
  contatos: CriarContatoDto[];
}

export type CriarBeneficiarioDto =
  | CriarBeneficiarioComPessoaEFamiliaExistentesDto
  | CriarBeneficiarioComPessoaExistenteEFamiliaNovaDto
  | CriarBeneficiarioComPessoaEFamiliaNovasDto
  | CriarBeneficiarioComPessoaNovaEFamiliaExistenteDto;

export type AtualizarBeneficiarioDto = Partial<
  | CriarBeneficiarioComPessoaEFamiliaExistentesDto
  | CriarBeneficiarioComPessoaExistenteEFamiliaNovaDto
  | CriarBeneficiarioComPessoaEFamiliaNovasDto
  | CriarBeneficiarioComPessoaNovaEFamiliaExistenteDto
>;

export interface FiltroBuscaBeneficiario {
  pagina?: number;
  itensPorPagina?: number;
  nome?: string;
  cpf?: string;
  familiaId?: string;
  ignorarId?: string;
}

