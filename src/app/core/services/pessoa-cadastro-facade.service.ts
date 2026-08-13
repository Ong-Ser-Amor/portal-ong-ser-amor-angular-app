import { Injectable, signal } from '@angular/core';
import {
  Subject,
  Observable,
  Subscription,
  EMPTY,
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  switchMap,
  tap,
} from 'rxjs';

export interface ConfigBuscaCpf<T extends { cpf?: string }> {
  /**
   * Subject que emite os CPFs limpos a serem buscados.
   */
  cpfSubject: Subject<string>;

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
   * e o CPF retornado corresponde ao CPF atual do input.
   */
  onSucesso: (resultado: T) => void;

  /**
   * Executado quando ocorre algum erro na busca.
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
   * Responsabilidades:
   * - aguardar o usuário terminar de digitar;
   * - evitar buscas duplicadas;
   * - cancelar a busca anterior quando o CPF mudar;
   * - controlar o estado de carregamento;
   * - garantir que a resposta ainda corresponde ao CPF atual.
   */
  iniciarBuscaCpfReativa<T extends { cpf?: string }>(
    config: ConfigBuscaCpf<T>,
  ): {
    subscription: Subscription;
    estaCarregando: ReturnType<typeof signal<boolean>>;
  } {
    const estaCarregando = signal(false);

    const subscription = config.cpfSubject
      .pipe(
        debounceTime(200),

        distinctUntilChanged(),

        tap(() => {
          estaCarregando.set(true);
        }),

        switchMap((cpfLimpo) =>
          config.buscarApiFn(cpfLimpo).pipe(
            catchError((error: unknown) => {
              config.onErro?.(error);

              return EMPTY;
            }),

            /**
             * Executado tanto quando a requisição termina normalmente
             * quanto quando é cancelada pelo switchMap.
             */
            finalize(() => {
              estaCarregando.set(false);
            }),
          ),
        ),
      )
      .subscribe({
        next: (resultado: T) => {
          const cpfAtualNoInput = (
            config.getCpfAtualInput() || ''
          ).replace(/\D/g, '');

          /**
           * Segunda proteção contra respostas que não correspondem
           * mais ao CPF atualmente informado pelo usuário.
           */
          if (
            resultado?.cpf &&
            resultado.cpf.replace(/\D/g, '') === cpfAtualNoInput
          ) {
            config.onSucesso(resultado);
          }
        },
      });

    return {
      subscription,
      estaCarregando,
    };
  }
}
