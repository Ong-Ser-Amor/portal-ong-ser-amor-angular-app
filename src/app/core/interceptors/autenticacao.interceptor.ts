import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';

export const autenticacaoInterceptor: HttpInterceptorFn = (req, next) => {
  const cookieService = inject(CookieService);

  const token = cookieService.get('token');

  if (token) {
    const clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Manda a requisição clonada (com token)
    return next(clonedReq);
  }

  // Se não tiver token, manda a requisição original limpa
  return next(req);
};
