export interface CreateUsuarioRequest {
  voluntarioId: string;
  email: string;
  senha: string;
}

export interface UsuarioResposta {
  id: string;
  email: string;
}
