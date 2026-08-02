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

export interface Endereco {
  id: string;
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cep: string;
  cidade: string;
  uf: UF;
}

export interface CriarEnderecoDto {
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cep: string;
  cidade: string;
  uf: UF;
}
