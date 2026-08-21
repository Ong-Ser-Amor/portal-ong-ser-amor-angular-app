import { OpcaoSelect } from './opcao-select.model';

export type MotivoJustificativaFalta = 'SAUDE' | 'OUTROS';

export const ROTULOS_MOTIVO_JUSTIFICATIVA_FALTA: Record<MotivoJustificativaFalta, string> = {
  SAUDE: 'Saúde',
  OUTROS: 'Outros',
};

export const OPCOES_MOTIVO_JUSTIFICATIVA_FALTA: OpcaoSelect<MotivoJustificativaFalta>[] = [
  { valor: 'SAUDE', rotulo: 'Saúde' },
  { valor: 'OUTROS', rotulo: 'Outros' },
];

export interface RegistroPresencaDto {
  matriculaId: string;
  presente: boolean;
  faltaJustificada?: boolean;
  motivoJustificativa?: MotivoJustificativaFalta | null;
  observacao?: string | null;
}

export interface CriarChamadaLoteDto {
  aulaId: string;
  registros: RegistroPresencaDto[];
}

export interface MatriculaResumoRespostaDto {
  id: string;
  beneficiarioId: string;
  nomeAluno: string;
}

export interface ChamadaRespostaDto {
  id: string;
  aulaId: string;
  matriculaId: string;
  presente: boolean;
  faltaJustificada: boolean;
  motivoJustificativa: MotivoJustificativaFalta | null;
  observacao: string | null;
  matricula?: MatriculaResumoRespostaDto;
}
