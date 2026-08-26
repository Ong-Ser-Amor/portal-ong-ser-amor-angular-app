import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AutorizacaoService } from '../services/autorizacao.service';
import { PerfilAcesso } from '../models/usuario.model';

export const perfilAcessoGuard: CanActivateFn = (route, state) => {
  const autorizacaoService = inject(AutorizacaoService);
  const router = inject(Router);

  const perfisPermitidos = route.data?.['perfis'] as PerfilAcesso[] | undefined;

  // Se a rota não exigir perfis específicos, permite o acesso
  if (!perfisPermitidos || perfisPermitidos.length === 0) {
    return true;
  }

  // Verifica se o usuário autenticado possui ao menos um dos perfis exigidos
  if (autorizacaoService.temPerfilAcesso(perfisPermitidos)) {
    return true;
  }

  // Se o usuário já estava em uma página, apenas cancela a navegação (permanece onde está)
  if (router.navigated && router.url && router.url !== state.url) {
    return false;
  }

  // Se foi acesso direto pela barra de endereço, redireciona para a home
  return router.createUrlTree(['/']);
};
