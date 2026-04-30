import { User } from './user.model';

export interface LoginRequisicao {
  email: string;
  senha: string;
}

export interface LoginResposta {
  tokenAcesso: string;
  usuario: User;
}
