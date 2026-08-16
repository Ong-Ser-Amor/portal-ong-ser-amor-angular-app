import { Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

export type TipoAlerta = 'info' | 'success' | 'warning' | 'error';

@Component({
  selector: 'app-alerta',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './alerta.component.html',
  styleUrl: './alerta.component.scss',
})
export class AlertaComponent {
  /** Tipo visual do alerta */
  tipo = input<TipoAlerta>('info');

  /** Título do alerta (opcional) */
  titulo = input<string>('');

  /** Ícone customizado (se omitido, usa o padrão do tipo) */
  icone = input<string>('');

  readonly iconeEfetivo = computed<string>(() => {
    if (this.icone()) return this.icone();
    switch (this.tipo()) {
      case 'success':
        return 'verified';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      case 'info':
      default:
        return 'info';
    }
  });
}
