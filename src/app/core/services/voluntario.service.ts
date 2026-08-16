import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import {
  Voluntario,
  VoluntarioResumo,
  CriarVoluntarioDto,
  AtualizarVoluntarioDto,
} from '../models/voluntario.model';
import { PaginacaoResposta } from '../models/api-paginacao-resposta.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class VoluntarioService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/voluntarios`;

  getAll(
    itensPorPagina: number = 10,
    pagina: number = 1,
  ): Observable<PaginacaoResposta<VoluntarioResumo>> {
    return this.http.get<PaginacaoResposta<VoluntarioResumo>>(this.API_URL, {
      params: {
        itensPorPagina: itensPorPagina.toString(),
        pagina: pagina.toString(),
      },
    });
  }

  getById(id: string): Observable<Voluntario> {
    return this.http.get<Voluntario>(`${this.API_URL}/${id}`);
  }

  create(payload: CriarVoluntarioDto): Observable<Voluntario> {
    return this.http.post<Voluntario>(this.API_URL, payload);
  }

  update(id: string, payload: AtualizarVoluntarioDto): Observable<Voluntario> {
    return this.http.patch<Voluntario>(`${this.API_URL}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
