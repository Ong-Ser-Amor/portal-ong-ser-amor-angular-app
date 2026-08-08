import { OpcaoSelect } from './opcao-select.model';

export type UF =
  | 'AC'
  | 'AL'
  | 'AP'
  | 'AM'
  | 'BA'
  | 'CE'
  | 'DF'
  | 'ES'
  | 'GO'
  | 'MA'
  | 'MT'
  | 'MS'
  | 'MG'
  | 'PA'
  | 'PB'
  | 'PR'
  | 'PE'
  | 'PI'
  | 'RJ'
  | 'RN'
  | 'RS'
  | 'RO'
  | 'RR'
  | 'SC'
  | 'SP'
  | 'SE'
  | 'TO';

export const OPCOES_UF: OpcaoSelect<UF>[] = [
  { valor: 'AC', rotulo: 'AC' },
  { valor: 'AL', rotulo: 'AL' },
  { valor: 'AP', rotulo: 'AP' },
  { valor: 'AM', rotulo: 'AM' },
  { valor: 'BA', rotulo: 'BA' },
  { valor: 'CE', rotulo: 'CE' },
  { valor: 'DF', rotulo: 'DF' },
  { valor: 'ES', rotulo: 'ES' },
  { valor: 'GO', rotulo: 'GO' },
  { valor: 'MA', rotulo: 'MA' },
  { valor: 'MT', rotulo: 'MT' },
  { valor: 'MS', rotulo: 'MS' },
  { valor: 'MG', rotulo: 'MG' },
  { valor: 'PA', rotulo: 'PA' },
  { valor: 'PB', rotulo: 'PB' },
  { valor: 'PR', rotulo: 'PR' },
  { valor: 'PE', rotulo: 'PE' },
  { valor: 'PI', rotulo: 'PI' },
  { valor: 'RJ', rotulo: 'RJ' },
  { valor: 'RN', rotulo: 'RN' },
  { valor: 'RS', rotulo: 'RS' },
  { valor: 'RO', rotulo: 'RO' },
  { valor: 'RR', rotulo: 'RR' },
  { valor: 'SC', rotulo: 'SC' },
  { valor: 'SP', rotulo: 'SP' },
  { valor: 'SE', rotulo: 'SE' },
  { valor: 'TO', rotulo: 'TO' },
];

export interface Endereco {
  id: string;
  logradouro: string;
  numero: string | null;
  complemento: string | null;
  bairro: string;
  cep: string;
  cidade: string;
  uf: UF;
}

export interface CriarEnderecoDto {
  logradouro: string;
  numero?: string;
  complemento?: string;
  bairro: string;
  cep: string;
  cidade: string;
  uf: UF;
}
