import { Component, input, output } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { BotaoComponent } from '../botao/botao.component';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [
    MatDialogModule,
    MatIconModule,
    MatProgressBarModule,
    BotaoComponent,
  ],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss',
})
export class ModalComponent {
  titulo = input<string>('');
  subtitulo = input<string>('');
  icone = input<string>('');
  carregando = input<boolean>(false);

  textoConfirmar = input<string>('Salvar');
  textoCancelar = input<string>('Cancelar');
  exibirConfirmar = input<boolean>(true);
  exibirCancelar = input<boolean>(true);
  confirmarDesabilitado = input<boolean>(false);

  fechar = output<void>();
  salvar = output<void>();
}
