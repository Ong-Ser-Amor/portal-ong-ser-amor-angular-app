import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { PaginacaoResposta } from '../models/api-paginacao-resposta.model';

import { Observable } from 'rxjs';
import {
  AtualizaCursoRequest,
  CriaCursoRequest,
  Curso,
} from '../models/curso.model';

@Injectable({
  providedIn: 'root',
})
export class CursoService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/cursos`;

  getAll(
    pagina: number = 1,
    limite: number = 10,
  ): Observable<PaginacaoResposta<Curso>> {
    const params = new HttpParams()
      .set('pagina', pagina.toString())
      .set('limite', limite.toString());

    return this.http.get<PaginacaoResposta<Curso>>(this.API_URL, { params });
  }

  getById(id: number): Observable<Curso> {
    return this.http.get<Curso>(`${this.API_URL}/${id}`);
  }

  create(payload: CriaCursoRequest): Observable<Curso> {
    return this.http.post<Curso>(this.API_URL, payload);
  }

  update(id: number, payload: AtualizaCursoRequest): Observable<Curso> {
    return this.http.patch<Curso>(`${this.API_URL}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
