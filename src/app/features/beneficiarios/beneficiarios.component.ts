import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BotaoComponent } from '../../shared/components/botao/botao.component';
import { CabecalhoPaginaComponent } from '../../shared/components/cabecalho-pagina/cabecalho-pagina.component';
import {
  TabelaComponent,
  ColunaTabela,
} from '../../shared/components/tabela/tabela.component';
import { TabelaCelulaDirective } from '../../shared/components/tabela/directives/tabela-celula.directive';
import { Beneficiario } from '../../core/models/beneficiario.model';
import { PageEvent } from '@angular/material/paginator';
import { BeneficiarioService } from '../../core/services/beneficiario.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-beneficiarios',
  standalone: true,
  imports: [
    RouterLink,
    BotaoComponent,
    CabecalhoPaginaComponent,
    TabelaComponent,
    TabelaCelulaDirective,
  ],
  templateUrl: './beneficiarios.component.html',
})
export class BeneficiariosComponent implements OnInit {
  private beneficiarioService = inject(BeneficiarioService);
  private snackBar = inject(MatSnackBar);

  beneficiarios = signal<Beneficiario[]>([]);
  estaCarregando = signal(false);

  // ESTADOS DE PAGINAÇÃO
  paginaAtual = signal(1);
  itensPorPagina = signal(10);
  totalItens = signal(0);

  colunas: ColunaTabela<Beneficiario>[] = [
    { chave: 'nome', titulo: 'Nome', celula: (b) => b.pessoa.nome },
    { chave: 'cpf', titulo: 'CPF', celula: (b) => b.pessoa.cpf },
    { chave: 'acoes', titulo: '', largura: '120px' },
  ];

  ngOnInit(): void {
    this.carregarBeneficiarios();
  }

  carregarBeneficiarios() {
    this.estaCarregando.set(true);

    this.beneficiarioService
      .getAll(this.paginaAtual(), this.itensPorPagina())
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
