import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AtualizarPessoaRequest,
  Pessoa,
} from '../models/pessoa.model';

@Injectable({
  providedIn: 'root',
})
export class PessoaService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/pessoas`;

  verificarCadastroVoluntarioPorCpf(cpf: string): Observable<Pessoa> {
    return this.http.get<Pessoa>(
      `${this.API_URL}/verificar-cadastro/voluntario/cpf/${cpf}`,
    );
  }

  verificarCadastroBeneficiarioPorCpf(cpf: string): Observable<Pessoa> {
    return this.http.get<Pessoa>(
      `${this.API_URL}/verificar-cadastro/beneficiario/cpf/${cpf}`,
    );
  }

  atualizar(
    id: string,
    payload: AtualizarPessoaRequest,
  ): Observable<Pessoa> {
    return this.http.patch<Pessoa>(`${this.API_URL}/${id}`, payload);
  }
}