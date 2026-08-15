import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { AtualizarEnderecoDto, Endereco } from '../models/endereco.model';

@Injectable({
  providedIn: 'root',
})
export class EnderecoService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/enderecos`;

  atualizar(id: string, dto: AtualizarEnderecoDto): Observable<Endereco> {
    return this.http.patch<Endereco>(`${this.API_URL}/${id}`, dto);
  }
}
