import { CriarEnderecoDto } from './endereco.model';

export type FaixaRenda =
  | 'ATE_1_SALARIO'
  | 'DE_1_A_3_SALARIOS'
  | 'ACIMA_3_SALARIOS';

export type TipoMoradia =
  | 'PROPRIA'
  | 'ALUGADA'
  | 'CEDIDA'
  | 'OCUPACAO_IRREGULAR';

export interface Familia {
  id: string;
  faixaRenda: string;
  tipoMoradia: TipoMoradia;
  possuiBeneficioSocial: boolean;
  enderecoId: string;
}

export interface CriarFamiliaDto {
  faixaRenda: FaixaRenda;
  tipoMoradia: TipoMoradia;
  possuiBeneficioSocial: boolean;
  endereco: CriarEnderecoDto;
}
