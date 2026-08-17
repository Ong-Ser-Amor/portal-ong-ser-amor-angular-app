import { inject, Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class NotificacaoService {
  private readonly snackBar = inject(MatSnackBar);

  private readonly configPadrao: MatSnackBarConfig = {
    horizontalPosition: 'center',
    verticalPosition: 'bottom',
  };

  /**
   * Exibe notificação de sucesso (verde/positivo).
   */
  sucesso(mensagem: string, acao: string = 'Fechar', duracao: number = 4000): void {
    this.snackBar.open(mensagem, acao, {
      ...this.configPadrao,
      duration: duracao,
      panelClass: ['snackbar-sucesso'],
    });
  }

  /**
   * Exibe notificação de erro (vermelho/destaque).
   */
  erro(mensagem: string, acao: string = 'Fechar', duracao: number = 5000): void {
    this.snackBar.open(mensagem, acao, {
      ...this.configPadrao,
      duration: duracao,
      panelClass: ['snackbar-erro'],
    });
  }

  /**
   * Exibe notificação de aviso/alerta (amarelo/laranja).
   */
  aviso(mensagem: string, acao: string = 'Fechar', duracao: number = 4000): void {
    this.snackBar.open(mensagem, acao, {
      ...this.configPadrao,
      duration: duracao,
      panelClass: ['snackbar-aviso'],
    });
  }

  /**
   * Exibe notificação informativa neutra (azul/cinza).
   */
  info(mensagem: string, acao: string = 'Fechar', duracao: number = 4000): void {
    this.snackBar.open(mensagem, acao, {
      ...this.configPadrao,
      duration: duracao,
      panelClass: ['snackbar-info'],
    });
  }
}
