import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AutenticacaoService } from '../services/autenticacao.service';

export const autenticacaoGuard: CanActivateFn = (route, state) => {
  const autenticacaoService = inject(AutenticacaoService);
  const router = inject(Router);

  // Verificamos se o usuário está logado olhando o Signal
  const estaAutenticado = !!autenticacaoService.usuarioAtual();

  if (estaAutenticado) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};
