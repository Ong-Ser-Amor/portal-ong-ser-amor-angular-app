import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { PaginacaoResposta } from '../models/api-paginacao-resposta.model';
import { Beneficiario, BeneficiarioResumo, FiltroBuscaBeneficiario, CriarBeneficiarioDto, AtualizarBeneficiarioDto } from '../models/beneficiario.model';

@Injectable({
  providedIn: 'root',
})
export class BeneficiarioService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/beneficiarios`;

  buscarTodos(filtros?: FiltroBuscaBeneficiario): Observable<PaginacaoResposta<BeneficiarioResumo>> {
    let parametros = new HttpParams()
      .set('pagina', (filtros?.pagina ?? 1).toString())
      .set('itensPorPagina', (filtros?.itensPorPagina ?? 10).toString());

    if (filtros?.nome) {
      parametros = parametros.set('nome', filtros.nome);
    }
    if (filtros?.cpf) {
      parametros = parametros.set('cpf', filtros.cpf);
    }
    if (filtros?.familiaId) {
      parametros = parametros.set('familiaId', filtros.familiaId);
    }
    if (filtros?.ignorarId) {
      parametros = parametros.set('ignorarId', filtros.ignorarId);
    }

    return this.http.get<PaginacaoResposta<BeneficiarioResumo>>(this.API_URL, {
      params: parametros,
    });
  }

  criar(criarBeneficiarioDto: CriarBeneficiarioDto): Observable<Beneficiario> {
    return this.http.post<Beneficiario>(this.API_URL, criarBeneficiarioDto);
  }

  buscarPorId(id: number | string): Observable<Beneficiario> {
    return this.http.get<Beneficiario>(`${this.API_URL}/${id}`);
  }

  atualizar(id: string, dto: AtualizarBeneficiarioDto): Observable<Beneficiario> {
    return this.http.patch<Beneficiario>(`${this.API_URL}/${id}`, dto);
  }
}
