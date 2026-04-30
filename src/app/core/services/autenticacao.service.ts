import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { LoginRequisicao, LoginResposta } from '../models/autenticacao.models';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';
import { tap } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AutenticacaoService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private cookieService = inject(CookieService);

  private readonly API_URL = environment.apiUrl;

  usuarioAtual = signal<User | null>(null);

  constructor() {
    this.carregarUsuarioDosCookies();
  }

  login(dadosLogin: LoginRequisicao) {
    return this.http
      .post<LoginResposta>(`${this.API_URL}/autenticacao/login`, dadosLogin)
      .pipe(
        tap((resposta) => {
          this.cookieService.set('token', resposta.tokenAcesso, 1, '/');
          this.cookieService.set(
            'user',
            JSON.stringify(resposta.usuario),
            1,
            '/',
          );

          this.usuarioAtual.set(resposta.usuario);
        }),
      );
  }

  sair() {
    this.cookieService.delete('token', '/');
    this.cookieService.delete('user', '/');
    this.usuarioAtual.set(null);
    this.router.navigate(['/login']);
  }

  private carregarUsuarioDosCookies() {
    const tokenAcesso = this.cookieService.get('token');
    const usuarioJson = this.cookieService.get('user');

    if (tokenAcesso && usuarioJson) {
      try {
        const usuario = JSON.parse(usuarioJson) as User;
        this.usuarioAtual.set(usuario);
      } catch {
        this.sair();
      }
    }
  }
}
