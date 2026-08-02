import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { PaginacaoResposta } from '../models/api-paginacao-resposta.model';
import { Beneficiario } from '../models/beneficiario.model';

@Injectable({
  providedIn: 'root',
})
export class BeneficiarioService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/beneficiarios`;

  getAll(
    pagina: number = 1,
    itensPorPagina: number = 10,
  ): Observable<PaginacaoResposta<Beneficiario>> {
    const params = new HttpParams()
      .set('pagina', pagina.toString())
      .set('itensPorPagina', itensPorPagina.toString());

    return this.http.get<PaginacaoResposta<Beneficiario>>(this.API_URL, {
      params: params,
    });
  }
}
