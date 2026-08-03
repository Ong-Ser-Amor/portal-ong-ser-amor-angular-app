import { OpcaoSelect } from './opcao-select.model';

export type TipoContato = 'CELULAR' | 'TELEFONE_FIXO' | 'EMAIL';

export interface ContatoResposta {
  id: string;
  tipoContato: TipoContato;
  valor: string;
  ehPrincipal: boolean;
}

export interface CriarContatoDto {
  tipoContato: TipoContato;
  valor: string;
  ehPrincipal?: boolean;
}

export const OPCOES_TIPO_CONTATO: OpcaoSelect<TipoContato>[] = [
  { valor: 'CELULAR', rotulo: 'Celular' },
  { valor: 'TELEFONE_FIXO', rotulo: 'Telefone Fixo' },
  { valor: 'EMAIL', rotulo: 'E-mail' },
];
