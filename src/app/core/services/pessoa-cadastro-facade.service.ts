import { DestroyRef, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Subject,
  Observable,
  EMPTY,
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  switchMap,
  tap,
} from 'rxjs';
import { limparCpf } from '../../shared/utils/cpf.utils';

export interface ConfigBuscaCpf<T> {
  /**
   * Subject que emite os CPFs limpos a serem buscados, ou null para cancelar/limpar.
   */
  cpfSubject: Subject<string | null>;

  /**
   * Função responsável por chamar a API específica.
   * Ex.: buscar beneficiário ou buscar voluntário.
   */
  buscarApiFn: (cpfLimpo: string) => Observable<T>;

  /**
   * Retorna o CPF que está atualmente no input.
   * Usado para garantir que a resposta ainda corresponde
   * ao valor atual da tela.
   */
  getCpfAtualInput: () => string;

  /**
   * Executado somente quando a API retorna sucesso
   * e o CPF pesquisado ainda corresponde ao CPF atual do input.
   */
  onSucesso: (resultado: T) => void;

  /**
   * Executado quando ocorre algum erro na busca
   * e o CPF pesquisado ainda corresponde ao CPF atual do input.
   */
  onErro?: (error: unknown) => void;
}

@Injectable({
  providedIn: 'root',
})
export class PessoaCadastroFacade {
  /**
   * Inicia e gerencia o fluxo reativo de busca por CPF.
   *
   * Protocolo de Emissão:
   * - "12345678901" (string): Inicia a busca com debounce e ativa o loading.
   * - null: Cancela a busca em andamento e desliga o loading imediatamente.
   */
  iniciarBuscaCpfReativa<T>(
    config: ConfigBuscaCpf<T>,
    destroyRef: DestroyRef,
  ): {
    estaCarregando: ReturnType<typeof signal<boolean>>;
  } {
    const estaCarregando = signal(false);

    const cpfAindaEhAtual = (cpfConsultado: string): boolean => {
      const cpfAtual = limparCpf(config.getCpfAtualInput());
      return cpfConsultado === cpfAtual;
    };

    config.cpfSubject
      .pipe(
        debounceTime(200),
        distinctUntilChanged(),
        tap((cpfConsultado) => {
          if (cpfConsultado === null) {
            estaCarregando.set(false);
          } else {
            estaCarregando.set(true);
          }
        }),
        switchMap((cpfConsultado) => {
          if (cpfConsultado === null) {
            return EMPTY;
          }

          return config.buscarApiFn(cpfConsultado).pipe(
            tap({
              next: (resultado) => {
                if (cpfAindaEhAtual(cpfConsultado)) {
                  config.onSucesso(resultado);
                }
              },
              error: (error: unknown) => {
                if (cpfAindaEhAtual(cpfConsultado)) {
                  config.onErro?.(error);
                }
              },
            }),
            catchError(() => EMPTY),
            finalize(() => {
              if (cpfAindaEhAtual(cpfConsultado)) {
                estaCarregando.set(false);
              }
            }),
          );
        }),
        takeUntilDestroyed(destroyRef),
      )
      .subscribe();

    return {
      estaCarregando,
    };
  }
}
