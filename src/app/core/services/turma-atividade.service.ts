import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AtualizarTurmaAtividadeDto,
  CriarTurmaAtividadeDto,
  RegistrarEntregasLoteDto,
  TurmaAtividadeEntregaRespostaDto,
  TurmaAtividadeRespostaDto,
} from '../models/turma-atividade.model';

@Injectable({
  providedIn: 'root',
})
export class TurmaAtividadeService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/turmas-atividades`;

  criar(payload: CriarTurmaAtividadeDto): Observable<TurmaAtividadeRespostaDto> {
    return this.http.post<TurmaAtividadeRespostaDto>(this.API_URL, payload);
  }

  buscarPorTurma(turmaId: string): Observable<TurmaAtividadeRespostaDto[]> {
    return this.http.get<TurmaAtividadeRespostaDto[]>(`${this.API_URL}/turmas/${turmaId}`);
  }

  buscarEntregasPorAtividade(atividadeId: string): Observable<TurmaAtividadeEntregaRespostaDto[]> {
    return this.http.get<TurmaAtividadeEntregaRespostaDto[]>(
      `${this.API_URL}/${atividadeId}/entregas`
    );
  }

  registrarEntregasEmLote(payload: RegistrarEntregasLoteDto): Observable<void> {
    return this.http.patch<void>(`${this.API_URL}/entregas/lote`, payload);
  }

  atualizar(id: string, payload: AtualizarTurmaAtividadeDto): Observable<TurmaAtividadeRespostaDto> {
    return this.http.patch<TurmaAtividadeRespostaDto>(`${this.API_URL}/${id}`, payload);
  }
}
