import { PerfilAcesso } from './usuario.model';

export interface UsuarioAutenticado {
  id: string;
  email: string;
  voluntarioId: string;
  nome: string;
  perfisAcesso: PerfilAcesso[];
}
