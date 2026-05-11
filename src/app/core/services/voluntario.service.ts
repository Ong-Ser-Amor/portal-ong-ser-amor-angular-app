import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import {
  Voluntario,
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
    take: number = 10,
    skip: number = 0
  ): Observable<PaginacaoResposta<Voluntario>> {
    // A API espera take e skip; calculamos internamente a partir de página
    return this.http.get<PaginacaoResposta<Voluntario>>(this.API_URL, {
      params: {
        take: take.toString(),
        skip: skip.toString(),
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
