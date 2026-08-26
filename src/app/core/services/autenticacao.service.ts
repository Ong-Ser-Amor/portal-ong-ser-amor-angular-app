import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { LoginRequisicao, LoginResposta } from '../models/autenticacao.models';
import { environment } from '../../../environments/environment';
import { UsuarioAutenticado } from '../models/usuario-autenticado.model';
import { PerfilAcesso } from '../models/usuario.model';
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

  private readonly _usuarioAtual = signal<UsuarioAutenticado | null>(null);
  readonly usuarioAtual = this._usuarioAtual.asReadonly();

  constructor() {
    this.carregarUsuarioDosCookies();
  }

  login(dadosLogin: LoginRequisicao) {
    return this.http
      .post<LoginResposta>(`${this.API_URL}/autenticacao/login`, dadosLogin)
      .pipe(
        tap((resposta) => {
          const perfis =
            resposta.usuario?.perfisAcesso && resposta.usuario.perfisAcesso.length > 0
              ? resposta.usuario.perfisAcesso
              : this.extrairPerfisDoToken(resposta.tokenAcesso);

          const usuarioCompleto: UsuarioAutenticado = {
            ...resposta.usuario,
            perfisAcesso: perfis,
          };

          this.cookieService.set('token', resposta.tokenAcesso, 1, '/');
          this.cookieService.set(
            'user',
            JSON.stringify(usuarioCompleto),
            1,
            '/',
          );

          this._usuarioAtual.set(usuarioCompleto);
        }),
      );
  }

  sair() {
    this.cookieService.delete('token', '/');
    this.cookieService.delete('user', '/');
    this._usuarioAtual.set(null);
    this.router.navigate(['/login']);
  }

  private carregarUsuarioDosCookies() {
    const tokenAcesso = this.cookieService.get('token');
    const usuarioJson = this.cookieService.get('user');

    if (tokenAcesso && usuarioJson) {
      try {
        const usuario = JSON.parse(usuarioJson) as UsuarioAutenticado;
        if (!usuario.perfisAcesso || usuario.perfisAcesso.length === 0) {
          usuario.perfisAcesso = this.extrairPerfisDoToken(tokenAcesso);
        }
        this._usuarioAtual.set(usuario);
      } catch {
        this.sair();
      }
    }
  }

  private extrairPerfisDoToken(token: string): PerfilAcesso[] {
    try {
      const partes = token.split('.');
      if (partes.length < 2) return [];
      const payloadBase64 = partes[1].replace(/-/g, '+').replace(/_/g, '/');
      const jsonStr = decodeURIComponent(
        atob(payloadBase64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(jsonStr);
      return payload.perfisAcesso || payload.perfis || payload.roles || [];
    } catch {
      return [];
    }
  }
}
