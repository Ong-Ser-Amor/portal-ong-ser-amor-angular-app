import { Component, computed, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { BotaoComponent, CorBotao } from '../botao/botao.component';

export type TipoConfirmacao = 'perigo' | 'aviso' | 'info';

export interface DadosModalConfirmacao {
  titulo: string;
  mensagem: string;
  tipo?: TipoConfirmacao;
  icone?: string;
}

@Component({
  selector: 'app-modal-confirmacao',
  standalone: true,
  imports: [MatDialogModule, MatIconModule, BotaoComponent],
  templateUrl: './modal-confirmacao.component.html',
  styleUrl: './modal-confirmacao.component.scss',
})
export class ModalConfirmacaoComponent {
  private readonly dialogRef = inject(MatDialogRef<ModalConfirmacaoComponent>);
  readonly data: DadosModalConfirmacao = inject(MAT_DIALOG_DATA);

  readonly titulo = this.data.titulo || 'Confirmação';
  readonly mensagem = this.data.mensagem || '';
  readonly tipo = this.data.tipo || 'perigo';

  readonly icone = computed(() => {
    if (this.data.icone) return this.data.icone;
    switch (this.tipo) {
      case 'perigo':
        return 'delete_outline';
      case 'aviso':
        return 'warning_amber';
      case 'info':
      default:
        return 'info_outline';
    }
  });

  readonly corBotaoConfirmar = computed<CorBotao>(() => {
    return this.tipo === 'perigo' ? 'warn' : 'primary';
  });

  cancelar(): void {
    this.dialogRef.close(false);
  }

  confirmar(): void {
    this.dialogRef.close(true);
  }
}
