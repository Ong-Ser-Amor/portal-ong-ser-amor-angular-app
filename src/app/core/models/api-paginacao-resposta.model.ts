export interface PaginacaoMeta {
  itensPorPagina: number;
  totalItens: number;
  paginaAtual: number;
  totalPaginas: number;
}

export interface PaginacaoResposta<T> {
  meta: PaginacaoMeta;
  dados: T[];
}
