import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { PaginacaoResposta } from '../models/api-paginacao-resposta.model';
import { Observable } from 'rxjs';
import {
  AtualizarTurmaMatriculaDto,
  CriarTurmaMatriculaDto,
  FiltroBuscaTurmaMatricula,
  TurmaMatricula,
} from '../models/turma-matricula.model';

@Injectable({
  providedIn: 'root',
})
export class TurmaMatriculaService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/turmas-matriculas`;

  buscarTodas(filtro: FiltroBuscaTurmaMatricula = {}): Observable<PaginacaoResposta<TurmaMatricula>> {
    let params = new HttpParams();

    if (filtro.pagina) {
      params = params.set('pagina', filtro.pagina.toString());
    }
    if (filtro.itensPorPagina) {
      params = params.set('itensPorPagina', filtro.itensPorPagina.toString());
    }
    if (filtro.turmaId) {
      params = params.set('turmaId', filtro.turmaId.toString());
    }

    return this.http.get<PaginacaoResposta<TurmaMatricula>>(this.API_URL, { params });
  }

  buscarPorId(id: string): Observable<TurmaMatricula> {
    return this.http.get<TurmaMatricula>(`${this.API_URL}/${id}`);
  }

  criar(payload: CriarTurmaMatriculaDto): Observable<TurmaMatricula> {
    return this.http.post<TurmaMatricula>(this.API_URL, payload);
  }

  atualizar(id: string, payload: AtualizarTurmaMatriculaDto): Observable<TurmaMatricula> {
    return this.http.patch<TurmaMatricula>(`${this.API_URL}/${id}`, payload);
  }

  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
