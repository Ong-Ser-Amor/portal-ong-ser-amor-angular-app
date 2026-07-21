export interface Curso {
  id: number;
  nome: string;
}

export interface CriaCursoRequest {
  nome: string;
}

export interface AtualizaCursoRequest {
  nome: string;
}
