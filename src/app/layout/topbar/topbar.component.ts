import { Component, inject } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AutenticacaoService } from '../../core/services/autenticacao.service';
import { BotaoComponent } from '../../shared/components/ui/botao/botao.component';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [MatToolbarModule, BotaoComponent],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss',
})
export class TopbarComponent {
  autenticacaoService = inject(AutenticacaoService);

  logout() {
    this.autenticacaoService.sair();
  }
}
