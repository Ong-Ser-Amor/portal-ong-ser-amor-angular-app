export interface Usuario {
  id: string;
  email: string;
}

export interface CriarUsuarioDto {
  voluntarioId: string;
  email: string;
  senha: string;
}
