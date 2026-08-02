import { CriarFamiliaDto } from './familia.model';
import { PessoaResposta } from './pessoa.model';

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

export interface Beneficiario {
  id: string;
  pessoa: PessoaResposta;
  familiaId: string;
  nivelEscolaridade: NivelEscolaridade;
  estadoCivil: EstadoCivil | null;
  vinculoEmpregaticio: VinculoEmpregaticio | null;
  quantidadeFilhos: number | null;
}

export interface CriarBeneficiarioComPessoaEFamiliaExistentesDto {
  pessoaId: string;
  familiaId: string;
  nivelEscolaridade: NivelEscolaridade;
  estadoCivil?: EstadoCivil;
  vinculoEmpregaticio?: VinculoEmpregaticio;
  quantidadeFilhos?: number;
}

export interface CriarBeneficiarioComPessoaExistenteEFamiliaNovaDto {
  pessoaId: string;
  familia: CriarFamiliaDto;
  nivelEscolaridade: NivelEscolaridade;
  estadoCivil?: EstadoCivil;
  vinculoEmpregaticio?: VinculoEmpregaticio;
  quantidadeFilhos?: number;
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
  familia: CriarFamiliaDto;
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
