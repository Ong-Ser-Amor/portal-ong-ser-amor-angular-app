import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { BotaoComponent } from '../../shared/components/botao/botao.component';
import { CabecalhoPaginaComponent } from '../../shared/components/cabecalho-pagina/cabecalho-pagina.component';
import {
  TabelaComponent,
  ColunaTabela,
} from '../../shared/components/tabela/tabela.component';
import { TabelaCelulaDirective } from '../../shared/components/tabela/directives/tabela-celula.directive';
import { BeneficiarioResumo, FiltroBuscaBeneficiario } from '../../core/models/beneficiario.model';
import { PageEvent } from '@angular/material/paginator';
import { BeneficiarioService } from '../../core/services/beneficiario.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ofuscarCpf } from '../../shared/utils/cpf.utils';

import { CardBuscaComponent } from '../../shared/components/card-busca/card-busca.component';

@Component({
  selector: 'app-beneficiarios',
  standalone: true,
  imports: [
    RouterLink,
    BotaoComponent,
    CabecalhoPaginaComponent,
    CardBuscaComponent,
    TabelaComponent,
    TabelaCelulaDirective,
  ],
  templateUrl: './beneficiarios.component.html',
})
export class BeneficiariosComponent implements OnInit {
  private beneficiarioService = inject(BeneficiarioService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  beneficiarios = signal<BeneficiarioResumo[]>([]);
  estaCarregando = signal(false);

  termoBusca = signal('');

  // ESTADOS DE PAGINAÇÃO
  paginaAtual = signal(1);
  itensPorPagina = signal(10);
  totalItens = signal(0);

  colunas: ColunaTabela<BeneficiarioResumo>[] = [
    { chave: 'nome', titulo: 'Nome', celula: (b) => b.pessoa.nome },
    { chave: 'cpf', titulo: 'CPF', celula: (b) => ofuscarCpf(b.pessoa.cpf) },
    { chave: 'acoes', titulo: '' },
  ];

  ngOnInit(): void {
    this.carregarBeneficiarios();
  }

  carregarBeneficiarios() {
    this.estaCarregando.set(true);

    const termo = this.termoBusca().trim();
    const somenteNumeros = termo.replace(/\D/g, '');
    const ehNumerico = somenteNumeros.length > 0 && (somenteNumeros.length === termo.length || termo.includes('.') || termo.includes('-'));

    const filtro: FiltroBuscaBeneficiario = {
      pagina: this.paginaAtual(),
      itensPorPagina: this.itensPorPagina(),
    };

    // 1. Busca por CPF: Exige exatamente 11 dígitos (Segurança & LGPD)
    if (ehNumerico) {
      if (somenteNumeros.length === 11) {
        filtro.cpf = somenteNumeros;
      } else {
        // Se tiver menos de 11 números, não dispara chamada para a API
        this.estaCarregando.set(false);
        return;
      }
    } else if (termo.length > 0) {
      // 2. Busca por Nome: Exige no mínimo 3 caracteres (Performance & UX)
      if (termo.length >= 3) {
        filtro.nome = termo;
      } else {
        // Se tiver menos de 3 caracteres, não dispara chamada para a API
        this.estaCarregando.set(false);
        return;
      }
    }

    this.beneficiarioService
      .buscarTodos(filtro)
      .subscribe({
        next: (resposta) => {
          this.beneficiarios.set(resposta.dados || []);
          this.totalItens.set(resposta.meta?.totalItens ?? (resposta.dados?.length || 0));
          this.itensPorPagina.set(resposta.meta?.itensPorPagina ?? 10);
          this.estaCarregando.set(false);
        },
        error: (erro) => {
          console.error('Erro ao carregar beneficiários:', erro);
          this.snackBar.open('Erro ao carregar beneficiários.', 'Fechar');
          this.estaCarregando.set(false);
        },
      });
  }

  buscar(termo: string): void {
    this.termoBusca.set(termo);
    this.paginaAtual.set(1);
    this.carregarBeneficiarios();
  }

  aoMudarPagina(event: PageEvent) {
    this.paginaAtual.set(event.pageIndex);
    this.itensPorPagina.set(event.pageSize);
    this.carregarBeneficiarios();
  }

  verDetalhes(beneficiario: BeneficiarioResumo): void {
    this.router.navigate(['/beneficiarios', beneficiario.id]);
  }

  editar(beneficiario: BeneficiarioResumo) {
    console.log('Editar beneficiário:', beneficiario);
  }

  excluir(beneficiario: BeneficiarioResumo) {
    console.log('Excluir beneficiário:', beneficiario);
  }
}
