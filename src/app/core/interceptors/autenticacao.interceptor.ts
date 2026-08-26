import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { catchError, throwError } from 'rxjs';
import { NotificacaoService } from '../services/notificacao.service';

export const autenticacaoInterceptor: HttpInterceptorFn = (req, next) => {
  const cookieService = inject(CookieService);
  const notificacaoService = inject(NotificacaoService);

  const token = cookieService.get('token');

  const authReq = token
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 403) {
        const mensagem =
          error.error?.message ||
          'Você não possui permissão para realizar esta operação.';
        notificacaoService.erro(mensagem);
      }

      return throwError(() => error);
    })
  );
};

