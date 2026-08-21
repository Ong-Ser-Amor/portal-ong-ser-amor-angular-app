import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ChamadaRespostaDto, CriarChamadaLoteDto } from '../models/chamada.model';

@Injectable({
  providedIn: 'root',
})
export class ChamadaService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/chamadas`;

  salvarLote(payload: CriarChamadaLoteDto): Observable<ChamadaRespostaDto[]> {
    return this.http.post<ChamadaRespostaDto[]>(`${this.API_URL}/lote`, payload);
  }

  buscarPorAula(aulaId: string): Observable<ChamadaRespostaDto[]> {
    return this.http.get<ChamadaRespostaDto[]>(`${this.API_URL}/aula/${aulaId}`);
  }

  removerPorAula(aulaId: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/aula/${aulaId}`);
  }
}
