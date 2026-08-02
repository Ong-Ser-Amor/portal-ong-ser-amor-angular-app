import { Component, inject, OnInit, signal } from '@angular/core';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { Beneficiario } from '../../core/models/beneficiario.model';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BeneficiarioService } from '../../core/services/beneficiario.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-beneficiarios',
  standalone: true,
  imports: [
    MatTableModule,
    ButtonComponent,
    MatProgressSpinnerModule,
    MatPaginatorModule,
  ],
  templateUrl: './beneficiarios.component.html',
  styleUrls: ['./beneficiarios.component.scss'],
})
export class BeneficiariosComponent implements OnInit {
  private beneficiarioService = inject(BeneficiarioService);
  private snackBar = inject(MatSnackBar);

  beneficiarios = signal<Beneficiario[]>([]);
  estaCarregando = signal(false);

  // ESTADOS DE PAGINAÇÃO
  totalItens = signal(0);
  itensPorPagina = signal(10);
  paginaAtual = signal(1);

  colunasExibidas: string[] = ['nome', 'cpf', 'acoes'];

  ngOnInit(): void {
    this.carregarBeneficiarios();
  }

  carregarBeneficiarios() {
    this.estaCarregando.set(true);

    this.beneficiarioService
      .getAll(this.itensPorPagina(), this.paginaAtual())
      .subscribe({
        next: (resposta) => {
          this.beneficiarios.set(resposta.dados);
          this.totalItens.set(resposta.meta.totalItens);
          this.itensPorPagina.set(resposta.meta.itensPorPagina);
          this.estaCarregando.set(false);
        },
        error: (erro) => {
          console.error('Erro ao carregar beneficiários:', erro);
          this.snackBar.open('Erro ao carregar voluntários.', 'Fechar');
          this.estaCarregando.set(false);
        },
      });
  }

  mudarPagina(event: PageEvent) {
    this.paginaAtual.set(event.pageIndex);
    this.itensPorPagina.set(event.pageSize);
    this.carregarBeneficiarios();
  }

  editar(beneficiario: Beneficiario) {
    console.log('Editar beneficiário:', beneficiario);
  }

  excluir(beneficiario: Beneficiario) {
    console.log('Excluir beneficiário:', beneficiario);
  }
}
