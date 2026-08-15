import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { AtualizarFamiliaDto, Familia } from '../models/familia.model';

@Injectable({
  providedIn: 'root',
})
export class FamiliaService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/familias`;

  atualizar(id: string, dto: AtualizarFamiliaDto): Observable<Familia> {
    return this.http.patch<Familia>(`${this.API_URL}/${id}`, dto);
  }
}
