import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Curso } from '../../core/models/curso.model';
import { CommonModule } from '@angular/common';
import { PageEvent } from '@angular/material/paginator';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { BotaoComponent } from '../../shared/components/ui/botao/botao.component';
import { CabecalhoPaginaComponent } from '../../shared/components/ui/cabecalho-pagina/cabecalho-pagina.component';
import {
  TabelaComponent,
  ColunaTabela,
} from '../../shared/components/ui/tabela/tabela.component';
import { TabelaCelulaDirective } from '../../shared/components/ui/tabela/directives/tabela-celula.directive';
import { CursoService } from '../../core/services/curso.service';
import { NotificacaoService } from '../../core/services/notificacao.service';
import { ModalCursoComponent } from './components/modal-curso/modal-curso.component';
import { ModalConfirmacaoComponent } from '../../shared/components/ui/modal-confirmacao/modal-confirmacao.component';
import { CONFIG_MODAL } from '../../shared/components/ui/modal/modal.config';

@Component({
  selector: 'app-cursos',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    BotaoComponent,
    CabecalhoPaginaComponent,
    TabelaComponent,
    TabelaCelulaDirective,
  ],
  templateUrl: './cursos.component.html',
})
export class CursosComponent implements OnInit {
  private router = inject(Router);
  private cursoService = inject(CursoService);
  private dialog = inject(MatDialog);
  private notificacao = inject(NotificacaoService);

  cursos = signal<Curso[]>([]);
  estaCarregando = signal(false);

  // ESTADOS DE PAGINAÇÃO
  paginaAtual = signal(1);
  itensPorPagina = signal(5);
  totalItens = signal(0);

  colunas: ColunaTabela<Curso>[] = [
    { chave: 'nome', titulo: 'Nome' },
    { chave: 'acoes', titulo: '' },
  ];

  ngOnInit(): void {
    this.carregarCursos();
  }

  carregarCursos() {
    this.estaCarregando.set(true);

    this.cursoService
      .buscarTodos({
        pagina: this.paginaAtual(),
        itensPorPagina: this.itensPorPagina(),
      })
      .subscribe({
        next: (response) => {
          this.cursos.set(response.dados);

          this.paginaAtual.set(response.meta.paginaAtual);
          this.itensPorPagina.set(response.meta.itensPorPagina);
          this.totalItens.set(response.meta.totalItens);

          this.estaCarregando.set(false);
        },
        error: (err) => {
          console.error('Erro ao carregar cursos:', err);
          this.notificacao.erro('Erro ao carregar cursos.');
          this.estaCarregando.set(false);
        },
      });
  }

  mudarPagina(event: PageEvent) {
    this.paginaAtual.set(event.pageIndex + 1);
    this.itensPorPagina.set(event.pageSize);

    this.carregarCursos();
  }

  adicionar() {
    const dialogRef = this.dialog.open(ModalCursoComponent, {
      ...CONFIG_MODAL.sm,
      data: null,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.carregarCursos();
      }
    });
  }

  editar(curso: Curso) {
    const dialogRef = this.dialog.open(ModalCursoComponent, {
      ...CONFIG_MODAL.sm,
      data: curso,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.carregarCursos();
      }
    });
  }

  excluir(curso: Curso) {
    const dialogRef = this.dialog.open(ModalConfirmacaoComponent, {
      ...CONFIG_MODAL.sm,
      data: {
        titulo: 'Excluir Curso',
        mensagem: `Tem certeza que deseja excluir o curso "${curso.nome}"? Esta ação não poderá ser desfeita.`,
        tipo: 'perigo',
      },
    });

    dialogRef.afterClosed().subscribe((confirmado) => {
      if (!confirmado) return;

      this.estaCarregando.set(true);
      this.cursoService.excluir(curso.id).subscribe({
        next: () => {
          this.notificacao.sucesso('Curso excluído com sucesso!');
          this.carregarCursos();
        },
        error: (err) => {
          console.error(err);
          this.notificacao.erro('Erro ao excluir curso.');
          this.estaCarregando.set(false);
        },
      });
    });
  }

  verDetalhes(curso: Curso): void {
    this.router.navigate(['/cursos', curso.id]);
  }
}
