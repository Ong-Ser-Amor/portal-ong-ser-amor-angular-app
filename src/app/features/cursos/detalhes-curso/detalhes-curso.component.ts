import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { PageEvent } from '@angular/material/paginator';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { CabecalhoPaginaComponent } from '../../../shared/components/ui/cabecalho-pagina/cabecalho-pagina.component';
import { BotaoComponent } from '../../../shared/components/ui/botao/botao.component';
import { SpinnerComponent } from '../../../shared/components/ui/spinner/spinner.component';
import {
  TabelaComponent,
  ColunaTabela,
} from '../../../shared/components/ui/tabela/tabela.component';
import { TabelaCelulaDirective } from '../../../shared/components/ui/tabela/directives/tabela-celula.directive';
import { NotificacaoService } from '../../../core/services/notificacao.service';
import { CursoService } from '../../../core/services/curso.service';
import { PlanoCursoService } from '../../../core/services/plano-curso.service';
import { TurmaService } from '../../../core/services/turma.service';
import { Curso } from '../../../core/models/curso.model';
import { PlanoCurso } from '../../../core/models/plano-curso.model';
import { ROTULOS_STATUS_TURMA, Turma, TurmaResumo } from '../../../core/models/turma.model';
import { formatarData } from '../../../shared/utils/data.utils';
import { CONFIG_MODAL } from '../../../shared/components/ui/modal/modal.config';
import { ModalPlanoCursoComponent } from './components/modal-plano-curso/modal-plano-curso.component';
import { ModalTurmaComponent } from './components/modal-turma/modal-turma.component';
import { ModalConfirmacaoComponent } from '../../../shared/components/ui/modal-confirmacao/modal-confirmacao.component';

@Component({
  selector: 'app-detalhes-curso',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatDialogModule,
    CabecalhoPaginaComponent,
    BotaoComponent,
    SpinnerComponent,
    TabelaComponent,
    TabelaCelulaDirective,
  ],
  templateUrl: './detalhes-curso.component.html',
  styleUrl: './detalhes-curso.component.scss',
})
export class DetalhesCursoComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly cursoService = inject(CursoService);
  private readonly planoCursoService = inject(PlanoCursoService);
  private readonly turmaService = inject(TurmaService);
  private readonly notificacao = inject(NotificacaoService);

  cursoId = signal<string | null>(null);
  curso = signal<Curso | null>(null);
  estaCarregando = signal<boolean>(true);

  // Estados de listagem de planos de curso
  planos = signal<PlanoCurso[]>([]);
  estaCarregandoPlanos = signal<boolean>(false);
  paginaAtualPlanos = signal<number>(1);
  itensPorPaginaPlanos = signal<number>(10);
  totalItensPlanos = signal<number>(0);

  colunasPlanos: ColunaTabela<PlanoCurso>[] = [
    { chave: 'nome', titulo: 'Nome do Plano de Curso' },
    { chave: 'acoes', titulo: 'Ações' },
  ];

  // Estados de listagem de turmas
  turmas = signal<TurmaResumo[]>([]);
  estaCarregandoTurmas = signal<boolean>(false);
  paginaAtualTurmas = signal<number>(1);
  itensPorPaginaTurmas = signal<number>(10);
  totalItensTurmas = signal<number>(0);

  colunasTurmas: ColunaTabela<TurmaResumo>[] = [
    { chave: 'nome', titulo: 'Nome da Turma' },
    { chave: 'planoCurso', titulo: 'Plano de Curso', celula: (turma) => turma.planoCurso?.nome || '—' },
    { chave: 'dataInicio', titulo: 'Início', celula: (turma) => formatarData(turma.dataInicio) },
    { chave: 'dataFim', titulo: 'Fim', celula: (turma) => formatarData(turma.dataFim) },
    { chave: 'status', titulo: 'Status', celula: (turma) => ROTULOS_STATUS_TURMA[turma.status] || turma.status },
    { chave: 'acoes', titulo: 'Ações' },
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.notificacao.erro('Curso não encontrado.');
      this.voltar();
      return;
    }

    this.cursoId.set(id);
    this.carregarCurso(id);
    this.carregarPlanosCurso(id);
    this.carregarTurmas(id);
  }

  carregarCurso(id: string): void {
    this.estaCarregando.set(true);

    this.cursoService
      .buscarPorId(id)
      .pipe(finalize(() => this.estaCarregando.set(false)))
      .subscribe({
        next: (curso) => {
          this.curso.set(curso);
        },
        error: (erro) => {
          console.error('Erro ao carregar curso:', erro);
          this.notificacao.erro('Erro ao carregar dados do curso.');
          this.voltar();
        },
      });
  }

  carregarPlanosCurso(cursoId?: string): void {
    const id = cursoId || this.cursoId();
    if (!id) return;

    this.estaCarregandoPlanos.set(true);

    this.planoCursoService
      .buscarTodos({
        cursoId: id,
        pagina: this.paginaAtualPlanos(),
        itensPorPagina: this.itensPorPaginaPlanos(),
      })
      .pipe(finalize(() => this.estaCarregandoPlanos.set(false)))
      .subscribe({
        next: (resposta) => {
          this.planos.set(resposta.dados || []);
          this.totalItensPlanos.set(resposta.meta?.totalItens ?? (resposta.dados?.length || 0));
          this.itensPorPaginaPlanos.set(resposta.meta?.itensPorPagina ?? 10);
        },
        error: (erro) => {
          console.error('Erro ao carregar planos de curso:', erro);
          this.notificacao.erro('Erro ao carregar planos de curso.');
        },
      });
  }

  adicionarPlanoCurso(): void {
    if (!this.cursoId()) return;

    const dialogRef = this.dialog.open(ModalPlanoCursoComponent, {
      ...CONFIG_MODAL.sm,
      data: {
        cursoId: this.cursoId()!,
        plano: null,
      },
    });

    dialogRef.afterClosed().subscribe((sucesso) => {
      if (sucesso) {
        this.carregarPlanosCurso();
      }
    });
  }

  editarPlanoCurso(plano: PlanoCurso): void {
    if (!this.cursoId()) return;

    const dialogRef = this.dialog.open(ModalPlanoCursoComponent, {
      ...CONFIG_MODAL.sm,
      data: {
        cursoId: this.cursoId()!,
        plano,
      },
    });

    dialogRef.afterClosed().subscribe((sucesso) => {
      if (sucesso) {
        this.carregarPlanosCurso();
      }
    });
  }

  excluirPlanoCurso(plano: PlanoCurso): void {
    const dialogRef = this.dialog.open(ModalConfirmacaoComponent, {
      ...CONFIG_MODAL.sm,
      data: {
        titulo: 'Excluir Plano de Curso',
        mensagem: `Tem certeza que deseja excluir o plano de curso "${plano.nome}"? Esta ação não poderá ser desfeita.`,
        tipo: 'perigo',
      },
    });

    dialogRef.afterClosed().subscribe((confirmado) => {
      if (!confirmado) return;

      this.estaCarregandoPlanos.set(true);
      this.planoCursoService.excluir(plano.id).subscribe({
        next: () => {
          this.notificacao.sucesso('Plano de curso excluído com sucesso!');
          this.carregarPlanosCurso();
        },
        error: (erro) => {
          console.error('Erro ao excluir plano de curso:', erro);
          this.notificacao.erro('Erro ao excluir o plano de curso. Tente novamente.');
          this.estaCarregandoPlanos.set(false);
        },
      });
    });
  }

  adicionarTurma(): void {
    if (!this.cursoId()) return;

    const dialogRef = this.dialog.open(ModalTurmaComponent, {
      ...CONFIG_MODAL.md,
      data: {
        cursoId: this.cursoId()!,
        planos: this.planos(),
        turma: null,
      },
    });

    dialogRef.afterClosed().subscribe((sucesso) => {
      if (sucesso) {
        this.carregarTurmas(this.cursoId()!);
      }
    });
  }

  editarTurma(turma: TurmaResumo): void {
    if (!this.cursoId()) return;

    const dialogRef = this.dialog.open(ModalTurmaComponent, {
      ...CONFIG_MODAL.md,
      data: {
        cursoId: this.cursoId()!,
        planos: this.planos(),
        turma,
      },
    });

    dialogRef.afterClosed().subscribe((sucesso) => {
      if (sucesso) {
        this.carregarTurmas(this.cursoId()!);
      }
    });
  }

  verDetalhesTurma(turma: TurmaResumo): void {
    if (!this.cursoId()) return;
    this.router.navigate(['/cursos', this.cursoId()!, 'turmas', turma.id]);
  }

  excluirTurma(turma: TurmaResumo): void {
    const dialogRef = this.dialog.open(ModalConfirmacaoComponent, {
      ...CONFIG_MODAL.sm,
      data: {
        titulo: 'Excluir Turma',
        mensagem: `Tem certeza que deseja excluir a turma "${turma.nome}"? Esta ação não poderá ser desfeita.`,
        tipo: 'perigo',
      },
    });

    dialogRef.afterClosed().subscribe((confirmado) => {
      if (!confirmado) return;

      this.estaCarregandoTurmas.set(true);
      this.turmaService.excluir(turma.id).subscribe({
        next: () => {
          this.notificacao.sucesso('Turma excluída com sucesso!');
          if (this.cursoId()) {
            this.carregarTurmas(this.cursoId()!);
          }
        },
        error: (erro) => {
          console.error('Erro ao excluir turma:', erro);
          this.notificacao.erro('Erro ao excluir a turma. Tente novamente.');
          this.estaCarregandoTurmas.set(false);
        },
      });
    });
  }

  carregarTurmas(cursoId: string): void {
    this.estaCarregandoTurmas.set(true);

    this.turmaService
      .buscarTodos({
        cursoId: cursoId,
        pagina: this.paginaAtualTurmas(),
        itensPorPagina: this.itensPorPaginaTurmas(),
      })
      .pipe(finalize(() => this.estaCarregandoTurmas.set(false)))
      .subscribe({
        next: (resposta) => {
          this.turmas.set(resposta.dados || []);
          this.totalItensTurmas.set(resposta.meta?.totalItens ?? (resposta.dados?.length || 0));
          this.itensPorPaginaTurmas.set(resposta.meta?.itensPorPagina ?? 10);
        },
        error: (erro) => {
          console.error('Erro ao carregar turmas:', erro);
          this.notificacao.erro('Erro ao carregar turmas do curso.');
        },
      });
  }

  mudarPaginaPlanos(event: PageEvent): void {
    this.paginaAtualPlanos.set(event.pageIndex + 1);
    this.itensPorPaginaPlanos.set(event.pageSize);
    this.carregarPlanosCurso();
  }

  mudarPaginaTurmas(event: PageEvent): void {
    this.paginaAtualTurmas.set(event.pageIndex + 1);
    this.itensPorPaginaTurmas.set(event.pageSize);
    if (this.cursoId()) {
      this.carregarTurmas(this.cursoId()!);
    }
  }

  voltar(): void {
    this.router.navigate(['/cursos']);
  }
}
