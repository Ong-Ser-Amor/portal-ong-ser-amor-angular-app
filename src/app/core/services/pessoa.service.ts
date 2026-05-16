import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AtualizarPessoaRequest,
  PessoaResposta,
} from '../models/pessoa.model';

@Injectable({
  providedIn: 'root',
})
export class PessoaService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/pessoas`;

  verificarCadastroVoluntarioPorCpf(cpf: string): Observable<PessoaResposta> {
    return this.http.get<PessoaResposta>(
      `${this.API_URL}/verificar-cadastro/voluntario/cpf/${cpf}`,
    );
  }

  atualizar(
    id: string,
    payload: AtualizarPessoaRequest,
  ): Observable<PessoaResposta> {
    return this.http.patch<PessoaResposta>(`${this.API_URL}/${id}`, payload);
  }
}