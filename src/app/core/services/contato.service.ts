import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { AtualizarContatoDto, ContatoResposta, CriarContatoDto } from '../models/contato.model';

@Injectable({
  providedIn: 'root',
})
export class ContatoService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/contatos`;

  criar(dto: CriarContatoDto): Observable<ContatoResposta> {
    return this.http.post<ContatoResposta>(this.API_URL, dto);
  }

  atualizar(id: string, dto: AtualizarContatoDto): Observable<ContatoResposta> {
    return this.http.patch<ContatoResposta>(`${this.API_URL}/${id}`, dto);
  }

  remover(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
