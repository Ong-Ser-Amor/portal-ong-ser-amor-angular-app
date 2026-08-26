import { computed, inject, Injectable } from '@angular/core';
import { AutenticacaoService } from './autenticacao.service';
import { PERFIL_ACESSO, PerfilAcesso } from '../models/usuario.model';

@Injectable({
  providedIn: 'root',
})
export class AutorizacaoService {
  private readonly autenticacaoService = inject(AutenticacaoService);

  // Extrai a lista de perfis do usuário atualmente logado.
  private readonly perfisAcesso = computed<PerfilAcesso[]>(() => {
    return this.autenticacaoService.usuarioAtual()?.perfisAcesso ?? [];
  });

  readonly ehAdministrador = computed<boolean>(() =>
    this.temPerfilAcesso(PERFIL_ACESSO.ADMINISTRADOR)
  );
  readonly ehCoordenadorCursos = computed<boolean>(() =>
    this.temPerfilAcesso(PERFIL_ACESSO.COORDENADOR_CURSOS)
  );
  readonly ehProfessor = computed<boolean>(() =>
    this.temPerfilAcesso(PERFIL_ACESSO.PROFESSOR)
  );

  // Permissão para gerenciar cursos, planos de curso, turmas e matrículas
  readonly podeGerenciarCursos = computed<boolean>(
    () => this.ehAdministrador() || this.ehCoordenadorCursos()
  );

  readonly podeGerenciarBeneficiarios = computed<boolean>(() => this.ehAdministrador());

  readonly podeGerenciarVoluntarios = computed<boolean>(() => this.ehAdministrador());

  readonly podeGerenciarUsuarios = computed<boolean>(() => this.ehAdministrador());

  // Verifica se o usuário atual possui pelo menos um dos perfis informados.
  temPerfilAcesso(perfis: PerfilAcesso | PerfilAcesso[]): boolean {
    const perfisRequeridos = Array.isArray(perfis) ? perfis : [perfis];
    const perfisUsuario = this.perfisAcesso();
    return perfisRequeridos.some((perfil) => perfisUsuario.includes(perfil));
  }
}
