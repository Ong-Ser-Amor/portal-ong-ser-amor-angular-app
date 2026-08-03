import { CriarEnderecoDto } from './endereco.model';
import { OpcaoSelect } from './opcao-select.model';

export type FaixaRenda =
  | 'ATE_1_SALARIO'
  | 'DE_1_A_3_SALARIOS'
  | 'ACIMA_3_SALARIOS';

export type TipoMoradia =
  | 'PROPRIA'
  | 'ALUGADA'
  | 'CEDIDA'
  | 'OCUPACAO_IRREGULAR';

export const OPCOES_FAIXA_RENDA: OpcaoSelect<FaixaRenda>[] = [
  { valor: 'ATE_1_SALARIO', rotulo: 'Até 1 Salário Mínimo' },
  { valor: 'DE_1_A_3_SALARIOS', rotulo: 'De 1 a 3 Salários Mínimos' },
  { valor: 'ACIMA_3_SALARIOS', rotulo: 'Acima de 3 Salários Mínimos' },
];

export const OPCOES_TIPO_MORADIA: OpcaoSelect<TipoMoradia>[] = [
  { valor: 'PROPRIA', rotulo: 'Própria' },
  { valor: 'ALUGADA', rotulo: 'Alugada' },
  { valor: 'CEDIDA', rotulo: 'Cedida' },
  { valor: 'OCUPACAO_IRREGULAR', rotulo: 'Ocupação Irregular' },
];

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
