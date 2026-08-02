import { Component, inject, OnInit, signal } from '@angular/core';
import { Curso } from '../../core/models/curso.model';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { CustomPaginatorIntl } from '../../core/i18n/custom-paginator-intl';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { CursoService } from '../../core/services/curso.service';
import { CursoFormComponent } from './components/formulario-curso/formulario-curso.component';

@Component({
  selector: 'app-cursos',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatDialogModule,
    MatSnackBarModule,
    ButtonComponent,
  ],
  templateUrl: './cursos.component.html',
  styleUrl: './cursos.component.scss',
  providers: [{ provide: MatPaginatorIntl, useClass: CustomPaginatorIntl }],
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
  totalPaginas = signal(0);

  colunasExibidas: string[] = ['nome', 'acoes'];

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
          this.totalPaginas.set(response.meta.totalPaginas);

          this.estaCarregando.set(false);
        },
        error: (err) => {
          console.error('Erro ao carregar cursos:', err);
          this.estaCarregando.set(false);
        },
      });
  }

  aoMudarPagina(event: PageEvent) {
    this.paginaAtual.set(event.pageIndex + 1);
    this.itensPorPagina.set(event.pageSize);

    this.carregarCursos();
  }

  aoAdicionar() {
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

  aoEditar(curso: Curso) {
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

  aoExcluir(curso: Curso) {
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
