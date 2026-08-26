import { OpcaoSelect } from './opcao-select.model';

export type PerfilAcesso = 'ADMIN' | 'COORDENADOR_CURSOS' | 'PROFESSOR';

export const OPCOES_PERFIL_ACESSO: OpcaoSelect<PerfilAcesso>[] = [
  { valor: 'ADMIN', rotulo: 'Administrador' },
  { valor: 'COORDENADOR_CURSOS', rotulo: 'Coordenador de Cursos' },
  { valor: 'PROFESSOR', rotulo: 'Professor' },
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
