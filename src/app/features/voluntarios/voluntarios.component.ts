import { Component, inject, OnInit, signal } from '@angular/core';
import { VoluntarioService } from '../../core/services/voluntario.service';
import { Voluntario } from '../../core/models/voluntario.model';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { CustomPaginatorIntl } from '../../core/i18n/custom-paginator-intl';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { VoluntarioFormComponent } from './components/voluntario-form/voluntario-form.component';
import { CriarLoginComponent } from './components/criar-login/criar-login.component';
import { ButtonComponent } from '../../shared/components/button/button.component';

@Component({
  selector: 'app-voluntarios',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatDialogModule,
    MatSnackBarModule,
    MatChipsModule,
    ButtonComponent,
  ],
  templateUrl: './voluntarios.component.html',
  styleUrl: './voluntarios.component.scss',
  providers: [{ provide: MatPaginatorIntl, useClass: CustomPaginatorIntl }],
})
export class VoluntariosComponent implements OnInit {
  private voluntarioService = inject(VoluntarioService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  voluntarios = signal<Voluntario[]>([]);
  estaCarregando = signal(false);

  // ESTADOS DE PAGINAÇÃO (convertendo entre página UI e skip de API)
  totalItens = signal(0);
  itensPorPagina = signal(10);
  paginaAtual = signal(0); // PageEvent usa 0-indexed

  colunasExibidas: string[] = [
    'nome',
    'tipoVoluntario',
    'formacaoAcademica',
    'acoes',
  ];

  ngOnInit(): void {
    this.carregarVoluntarios();
  }

  carregarVoluntarios() {
    this.estaCarregando.set(true);

    // Converter página 0-indexed para skip
    const skip = this.paginaAtual() * this.itensPorPagina();

    this.voluntarioService.getAll(this.itensPorPagina(), skip).subscribe({
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
  aoMudarPagina(event: PageEvent) {
    this.paginaAtual.set(event.pageIndex);
    this.itensPorPagina.set(event.pageSize);
    this.carregarVoluntarios();
  }

  aoAdicionar() {
    const dialogRef = this.dialog.open(VoluntarioFormComponent, {
      width: '500px',
      data: null,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.paginaAtual.set(0);
        this.carregarVoluntarios();
      } else if (result?.sucesso && result?.voluntario) {
        // Se criou login, abre o modal de criação de login
        this.abrirModalCriarLogin(result.voluntario);
      }
    });
  }

  aoEditar(voluntario: Voluntario) {
    const dialogRef = this.dialog.open(VoluntarioFormComponent, {
      width: '500px',
      data: voluntario,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.carregarVoluntarios();
      }
    });
  }

  aoExcluir(voluntario: Voluntario) {
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

  aoCriarLogin(voluntario: Voluntario) {
    this.abrirModalCriarLogin(voluntario);
  }

  private abrirModalCriarLogin(voluntario: Voluntario) {
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
