import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AutenticacaoService } from '../../core/services/autenticacao.service';
import { ButtonComponent } from '../../shared/components/button/button.component';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [MatToolbarModule, MatButtonModule, ButtonComponent],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss',
})
export class TopbarComponent {
  autenticacaoService = inject(AutenticacaoService);

  logout() {
    this.autenticacaoService.sair();
  }
}
