import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
})
export class CardComponent {
  titulo = input<string>('');
  subtitulo = input<string>('');
  icone = input<string>('');

  /** Se true, remove o padding interno do corpo do card (útil para tabelas coladas nas bordas) */
  semPadding = input<boolean>(false);

  /** Se true, exibe a borda separadora abaixo do cabeçalho */
  bordaCabecalho = input<boolean>(true);
}
