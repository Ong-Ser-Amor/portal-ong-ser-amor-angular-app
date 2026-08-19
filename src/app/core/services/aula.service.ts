import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { PaginacaoResposta } from '../models/api-paginacao-resposta.model';
import { Observable } from 'rxjs';
import { AtualizarAulaDto, Aula, CriarAulaDto, FiltroBuscaAula } from '../models/aula.model';

@Injectable({
  providedIn: 'root',
})
export class AulaService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/aulas`;

  buscarTodas(filtro: FiltroBuscaAula = {}): Observable<PaginacaoResposta<Aula>> {
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

    return this.http.get<PaginacaoResposta<Aula>>(this.API_URL, { params });
  }

  buscarPorId(id: string): Observable<Aula> {
    return this.http.get<Aula>(`${this.API_URL}/${id}`);
  }

  criar(payload: CriarAulaDto): Observable<Aula> {
    return this.http.post<Aula>(this.API_URL, payload);
  }

  atualizar(id: string, payload: AtualizarAulaDto): Observable<Aula> {
    return this.http.patch<Aula>(`${this.API_URL}/${id}`, payload);
  }

  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
