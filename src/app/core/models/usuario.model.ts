import { OpcaoSelect } from './opcao-select.model';

export const PERFIL_ACESSO = {
  ADMINISTRADOR: 'ADMINISTRADOR',
  COORDENADOR_CURSOS: 'COORDENADOR_CURSOS',
  PROFESSOR: 'PROFESSOR',
} as const;

export type PerfilAcesso = (typeof PERFIL_ACESSO)[keyof typeof PERFIL_ACESSO];

export const OPCOES_PERFIL_ACESSO: OpcaoSelect<PerfilAcesso>[] = [
  { valor: PERFIL_ACESSO.ADMINISTRADOR, rotulo: 'Administrador' },
  { valor: PERFIL_ACESSO.COORDENADOR_CURSOS, rotulo: 'Coordenador de Cursos' },
  { valor: PERFIL_ACESSO.PROFESSOR, rotulo: 'Professor' },
];

export interface Usuario {
  id: string;
  email: string;
  perfisAcesso: PerfilAcesso[];
}

export interface CriarUsuarioDto {
  voluntarioId: string;
  email: string;
  senha: string;
  perfisAcesso: PerfilAcesso[];
}
