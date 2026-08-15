import {
  Component,
  ContentChildren,
  QueryList,
  TemplateRef,
  input,
  output,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { TabelaCelulaDirective } from './directives/tabela-celula.directive';
import { SpinnerComponent } from '../spinner/spinner.component';
import { CustomPaginatorIntl } from '../../../../core/i18n/custom-paginator-intl';

export interface ColunaTabela<T> {
  chave: string;
  titulo: string;
  largura?: string;
  celula?: (row: T) => any;
}

@Component({
  selector: 'app-tabela',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    SpinnerComponent,
    TabelaCelulaDirective,
  ],
  providers: [{ provide: MatPaginatorIntl, useClass: CustomPaginatorIntl }],
  templateUrl: './tabela.component.html',
  styleUrl: './tabela.component.scss',
})
export class TabelaComponent<T> {
  dados = input.required<T[]>();
  colunas = input.required<ColunaTabela<T>[]>();
  carregando = input<boolean>(false);
  clicavel = input<boolean>(false);
  textoSemDados = input<string>('Nenhum registro encontrado.');

  // Paginação
  totalItens = input<number>(0);
  paginaAtual = input<number>(1);
  itensPorPagina = input<number>(10);
  opcoesItensPorPagina = input<number[]>([5, 10, 25, 50]);

  paginaAlterada = output<PageEvent>();
  linhaClicada = output<T>();

  @ContentChildren(TabelaCelulaDirective)
  celulasCustomizadas!: QueryList<TabelaCelulaDirective<T>>;

  chavesColunas = computed(() => this.colunas().map((c) => c.chave));

  aoClicarNaLinha(linha: T): void {
    if (this.clicavel()) {
      this.linhaClicada.emit(linha);
    }
  }

  obterTemplateCelula(nomeColuna: string): TemplateRef<any> | null {
    const celula = this.celulasCustomizadas?.find(
      (item) => item.nomeColuna === nomeColuna
    );
    return celula ? celula.templateRef : null;
  }
}
