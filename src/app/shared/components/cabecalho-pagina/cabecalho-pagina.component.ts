import { Component, input, output, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Location } from '@angular/common';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-cabecalho-pagina',
  standalone: true,
  imports: [RouterLink, ButtonComponent],
  templateUrl: './cabecalho-pagina.component.html',
  styleUrl: './cabecalho-pagina.component.scss',
})
export class CabecalhoPaginaComponent {
  private location = inject(Location);

  titulo = input.required<string>();
  exibirBotaoVoltar = input<boolean>(false);
  textoVoltar = input<string>('Voltar');
  rotaVoltar = input<string | any[]>();

  voltar = output<void>();

  clicarVoltar(event: MouseEvent): void {
    this.voltar.emit();
    if (!this.rotaVoltar()) {
      this.location.back();
    }
  }
}
