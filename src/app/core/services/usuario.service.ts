import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { CreateUsuarioRequest, UsuarioResposta } from '../models/usuario.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UsuarioService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/usuarios`;

  create(payload: CreateUsuarioRequest): Observable<UsuarioResposta> {
    return this.http.post<UsuarioResposta>(this.API_URL, payload);
  }
}
