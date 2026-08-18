import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { PaginacaoResposta } from '../models/api-paginacao-resposta.model';
import { Observable } from 'rxjs';
import {
  AtualizarPlanoCursoDto,
  CriarPlanoCursoDto,
  FiltroBuscaPlanoCurso,
  PlanoCurso,
} from '../models/plano-curso.model';

@Injectable({
  providedIn: 'root',
})
export class PlanoCursoService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/planos-curso`;

  buscarTodos(filtro: FiltroBuscaPlanoCurso = {}): Observable<PaginacaoResposta<PlanoCurso>> {
    let params = new HttpParams();

    if (filtro.pagina) {
      params = params.set('pagina', filtro.pagina.toString());
    }
    if (filtro.itensPorPagina) {
      params = params.set('itensPorPagina', filtro.itensPorPagina.toString());
    }

    return this.http.get<PaginacaoResposta<PlanoCurso>>(this.API_URL, { params });
  }

  buscarPorId(id: string): Observable<PlanoCurso> {
    return this.http.get<PlanoCurso>(`${this.API_URL}/${id}`);
  }

  criar(payload: CriarPlanoCursoDto): Observable<PlanoCurso> {
    return this.http.post<PlanoCurso>(this.API_URL, payload);
  }

  atualizar(id: string, payload: AtualizarPlanoCursoDto): Observable<PlanoCurso> {
    return this.http.patch<PlanoCurso>(`${this.API_URL}/${id}`, payload);
  }
}
