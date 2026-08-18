import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { CriarUsuarioDto, Usuario } from '../models/usuario.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/usuarios`;

  criar(payload: CriarUsuarioDto): Observable<Usuario> {
    return this.http.post<Usuario>(this.API_URL, payload);
  }
}
