import { HttpClient } from '@angular/common/http';
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
    limite: number = 10,
    pagina: number = 0,
  ): Observable<PaginacaoResposta<Beneficiario>> {
    return this.http.get<PaginacaoResposta<Beneficiario>>(this.API_URL, {
      params: {
        limite: limite.toString(),
        pagina: pagina.toString(),
      },
    });
  }
}
