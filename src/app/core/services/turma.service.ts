import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { PaginacaoResposta } from '../models/api-paginacao-resposta.model';
import { Observable } from 'rxjs';
import { FiltroBuscaTurma, Turma } from '../models/turma.model';

@Injectable({
  providedIn: 'root',
})
export class TurmaService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/turmas`;

  buscarTodos(filtro: FiltroBuscaTurma = {}): Observable<PaginacaoResposta<Turma>> {
    let params = new HttpParams();

    if (filtro.pagina) {
      params = params.set('pagina', filtro.pagina.toString());
    }
    if (filtro.itensPorPagina) {
      params = params.set('itensPorPagina', filtro.itensPorPagina.toString());
    }
    if (filtro.cursoId) {
      params = params.set('cursoId', filtro.cursoId.toString());
    }
    if (filtro.planoCursoId) {
      params = params.set('planoCursoId', filtro.planoCursoId.toString());
    }

    return this.http.get<PaginacaoResposta<Turma>>(this.API_URL, { params });
  }
}
