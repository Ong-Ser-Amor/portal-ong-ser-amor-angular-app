import { Component, inject, OnInit, signal } from '@angular/core';
import { Curso } from '../../core/models/curso.model';
import { CommonModule } from '@angular/common';
import { PageEvent } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BotaoComponent } from '../../shared/components/botao/botao.component';
import { CabecalhoPaginaComponent } from '../../shared/components/cabecalho-pagina/cabecalho-pagina.component';
import {
  TabelaComponent,
  ColunaTabela,
} from '../../shared/components/tabela/tabela.component';
import { TabelaCelulaDirective } from '../../shared/components/tabela/directives/tabela-celula.directive';
import { CursoService } from '../../core/services/curso.service';
import { CursoFormComponent } from './components/formulario-curso/formulario-curso.component';

@Component({
  selector: 'app-cursos',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    BotaoComponent,
    CabecalhoPaginaComponent,
    TabelaComponent,
    TabelaCelulaDirective,
  ],
  templateUrl: './cursos.component.html',
})
export class CursosComponent implements OnInit {
  private cursoService = inject(CursoService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

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
      .getAll(this.paginaAtual(), this.itensPorPagina())
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
    const dialogRef = this.dialog.open(CursoFormComponent, {
      width: '400px',
      data: null,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.carregarCursos();
      }
    });
  }

  editar(curso: Curso) {
    const dialogRef = this.dialog.open(CursoFormComponent, {
      width: '400px',
      data: curso,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.carregarCursos();
      }
    });
  }

  excluir(curso: Curso) {
    if (confirm(`Tem certeza que deseja excluir o curso "${curso.nome}"?`)) {
      this.estaCarregando.set(true);

      this.cursoService.delete(curso.id).subscribe({
        next: () => {
          this.snackBar.open('Curso excluído!', 'Fechar', { duration: 3000 });
          this.carregarCursos();
        },
        error: (err) => {
          console.error(err);
          this.snackBar.open('Erro ao excluir curso.', 'Fechar');
          this.estaCarregando.set(false);
        },
      });
    }
  }
}
