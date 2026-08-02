import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CabecalhoPaginaComponent } from '../../../shared/components/cabecalho-pagina/cabecalho-pagina.component';

@Component({
  selector: 'app-cadastro-beneficiario',
  standalone: true,
  imports: [CabecalhoPaginaComponent],
  templateUrl: './cadastro-beneficiario.component.html',
  styleUrl: './cadastro-beneficiario.component.scss',
})
export class CadastroBeneficiarioComponent {
  private router = inject(Router);

  voltar(): void {
    this.router.navigate(['/beneficiarios']);
  }
}
