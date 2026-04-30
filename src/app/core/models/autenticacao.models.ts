import { UsuarioAutenticado } from './usuario-autenticado.model';

export interface LoginRequisicao {
  email: string;
  senha: string;
}

export interface LoginResposta {
  tokenAcesso: string;
  usuario: UsuarioAutenticado;
}
