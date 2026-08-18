import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { PaginacaoResposta } from '../models/api-paginacao-resposta.model';
import { Observable } from 'rxjs';
import {
  AtualizarCursoDto,
  CriarCursoDto,
  Curso,
  FiltroBuscaCurso,
} from '../models/curso.model';

@Injectable({
  providedIn: 'root',
})
export class CursoService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/cursos`;

  buscarTodos(filtro: FiltroBuscaCurso = {}): Observable<PaginacaoResposta<Curso>> {
    let params = new HttpParams();

    if (filtro.pagina) {
      params = params.set('pagina', filtro.pagina.toString());
    }
    if (filtro.itensPorPagina) {
      params = params.set('itensPorPagina', filtro.itensPorPagina.toString());
    }

    return this.http.get<PaginacaoResposta<Curso>>(this.API_URL, { params });
  }

  buscarPorId(id: number | string): Observable<Curso> {
    return this.http.get<Curso>(`${this.API_URL}/${id}`);
  }

  criar(payload: CriarCursoDto): Observable<Curso> {
    return this.http.post<Curso>(this.API_URL, payload);
  }

  atualizar(id: number | string, payload: AtualizarCursoDto): Observable<Curso> {
    return this.http.patch<Curso>(`${this.API_URL}/${id}`, payload);
  }

  excluir(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
