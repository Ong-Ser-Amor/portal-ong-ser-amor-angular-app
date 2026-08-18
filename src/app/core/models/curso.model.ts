export interface Curso {
  id: number;
  nome: string;
}

export interface CriarCursoDto {
  nome: string;
}

export interface AtualizarCursoDto {
  nome: string;
}

export interface FiltroBuscaCurso {
  pagina?: number;
  itensPorPagina?: number;
}
