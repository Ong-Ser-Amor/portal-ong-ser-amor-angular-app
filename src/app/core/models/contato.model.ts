import { OpcaoSelect } from './opcao-select.model';

export type TipoContato = 'CELULAR' | 'TELEFONE_FIXO' | 'EMAIL';

export interface ContatoResposta {
  id: string;
  tipoContato: TipoContato;
  valor: string;
  ehPrincipal: boolean;
}

// DTO para contatos aninhados na criação de beneficiário
export interface CriarContatoBeneficiarioDto {
  tipoContato: TipoContato;
  valor: string;
  ehPrincipal?: boolean;
}

// DTO para o endpoint dedicado POST /contatos
export interface CriarContatoDto extends CriarContatoBeneficiarioDto {
  pessoaId: string;
}

export type AtualizarContatoDto = Partial<CriarContatoBeneficiarioDto>;

export const OPCOES_TIPO_CONTATO: OpcaoSelect<TipoContato>[] = [
  { valor: 'CELULAR', rotulo: 'Celular' },
  { valor: 'TELEFONE_FIXO', rotulo: 'Telefone Fixo' },
  { valor: 'EMAIL', rotulo: 'E-mail' },
];
