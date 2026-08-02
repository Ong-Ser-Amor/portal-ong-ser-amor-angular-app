import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export type VarianteBotao = 'basic' | 'raised' | 'stroked' | 'flat' | 'icon';
export type CorBotao = 'primary' | 'accent' | 'warn';
export type TamanhoBotao = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-botao',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './botao.component.html',
  styleUrl: './botao.component.scss',
  host: {
    '[class.largura-total]': 'larguraTotal()',
    '[class.tamanho-sm]': 'tamanho() === "sm"',
    '[class.tamanho-md]': 'tamanho() === "md"',
    '[class.tamanho-lg]': 'tamanho() === "lg"',
    '[class.eh-botao-icone]': 'variante() === "icon"',
  },
})
export class BotaoComponent {
  label = input<string>();

  carregando = input<boolean>();
  desabilitado = input<boolean>();
  larguraTotal = input<boolean>(false);
  icone = input<string>('');

  tipo = input<'button' | 'submit' | 'reset'>('button');

  variante = input<VarianteBotao>('flat');
  cor = input<CorBotao>();
  tamanho = input<TamanhoBotao>('md');
}
