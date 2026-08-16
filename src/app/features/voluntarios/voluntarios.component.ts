import { Component, inject, OnInit, signal } from '@angular/core';
import { VoluntarioService } from '../../core/services/voluntario.service';
import { VoluntarioResumo } from '../../core/models/voluntario.model';
import { CommonModule } from '@angular/common';
import { PageEvent } from '@angular/material/paginator';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { VoluntarioFormComponent } from './components/voluntario-form/voluntario-form.component';
import { BotaoComponent } from '../../shared/components/ui/botao/botao.component';
import { CabecalhoPaginaComponent } from '../../shared/components/ui/cabecalho-pagina/cabecalho-pagina.component';
import {
  TabelaComponent,
  ColunaTabela,
} from '../../shared/components/ui/tabela/tabela.component';
import { TabelaCelulaDirective } from '../../shared/components/ui/tabela/directives/tabela-celula.directive';
import { CriarLoginComponent } from './components/criar-login/criar-login.component';

@Component({
  selector: 'app-voluntarios',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatSnackBarModule,
    BotaoComponent,
    CabecalhoPaginaComponent,
    TabelaComponent,
    TabelaCelulaDirective,
  ],
  templateUrl: './voluntarios.component.html',
  styleUrl: './voluntarios.component.scss',
})
export class VoluntariosComponent implements OnInit {
  private voluntarioService = inject(VoluntarioService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  voluntarios = signal<VoluntarioResumo[]>([]);
  estaCarregando = signal(false);

  // ESTADOS DE PAGINAÇÃO
  totalItens = signal(0);
  paginaAtual = signal(1);
  itensPorPagina = signal(10);

  colunas: ColunaTabela<VoluntarioResumo>[] = [
    { chave: 'nome', titulo: 'Nome', celula: (v) => v.pessoa.nome },
    { chave: 'tipoVoluntario', titulo: 'Tipo' },
    { chave: 'formacaoAcademica', titulo: 'Formação', celula: (v) => v.formacaoAcademica || '—' },
    { chave: 'acoes', titulo: '' },
  ];

  ngOnInit(): void {
    this.carregarVoluntarios();
  }

  carregarVoluntarios() {
    this.estaCarregando.set(true);

    this.voluntarioService
      .buscarTodos({
        pagina: this.paginaAtual(),
        itensPorPagina: this.itensPorPagina(),
      })
      .subscribe({
        next: (response) => {
          this.voluntarios.set(response.dados);
          this.totalItens.set(response.meta.totalItens);
          this.itensPorPagina.set(response.meta.itensPorPagina);
          this.estaCarregando.set(false);
        },
        error: (err) => {
          console.error('Erro ao carregar voluntários:', err);
          this.snackBar.open('Erro ao carregar voluntários.', 'Fechar');
          this.estaCarregando.set(false);
        },
      });
  }

  mudarPagina(event: PageEvent) {
    this.paginaAtual.set(event.pageIndex + 1);
    this.itensPorPagina.set(event.pageSize);
    this.carregarVoluntarios();
  }

  abrirModalCadastroVoluntario() {
    const dialogRef = this.dialog.open(VoluntarioFormComponent, {
      width: '760px',
      maxWidth: '95vw',
      data: null,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.paginaAtual.set(1);
        this.carregarVoluntarios();
      }
    });
  }

  abrirModalEdicaoVoluntario(voluntario: VoluntarioResumo) {
    const dialogRef = this.dialog.open(VoluntarioFormComponent, {
      width: '760px',
      maxWidth: '95vw',
      data: voluntario,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.carregarVoluntarios();
      }
    });
  }

  excluirVoluntario(voluntario: VoluntarioResumo) {
    if (confirm(`Tem certeza que deseja excluir ${voluntario.pessoa.nome}?`)) {
      this.estaCarregando.set(true);

      this.voluntarioService.delete(voluntario.id).subscribe({
        next: () => {
          this.snackBar.open('Voluntário excluído!', 'Fechar', {
            duration: 3000,
          });
          this.carregarVoluntarios();
        },
        error: (err) => {
          console.error(err);
          this.snackBar.open('Erro ao excluir voluntário.', 'Fechar');
          this.estaCarregando.set(false);
        },
      });
    }
  }

  abrirModalCriacaoLogin(voluntario: VoluntarioResumo) {
    const dialogRef = this.dialog.open(CriarLoginComponent, {
      width: '500px',
      data: { voluntario },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.snackBar.open('Login criado com sucesso!', 'Fechar', {
          duration: 3000,
        });
        this.carregarVoluntarios();
      }
    });
  }
}
