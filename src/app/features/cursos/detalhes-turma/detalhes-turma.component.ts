import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { PageEvent } from '@angular/material/paginator';

import { CabecalhoPaginaComponent } from '../../../shared/components/ui/cabecalho-pagina/cabecalho-pagina.component';
import { CardComponent } from '../../../shared/components/ui/card/card.component';
import { BotaoComponent } from '../../../shared/components/ui/botao/botao.component';
import {
  TabelaComponent,
  ColunaTabela,
} from '../../../shared/components/ui/tabela/tabela.component';
import { TabelaCelulaDirective } from '../../../shared/components/ui/tabela/directives/tabela-celula.directive';
import { SpinnerComponent } from '../../../shared/components/ui/spinner/spinner.component';
import { NotificacaoService } from '../../../core/services/notificacao.service';
import { TurmaService } from '../../../core/services/turma.service';
import { AulaService } from '../../../core/services/aula.service';
import { TurmaMatriculaService } from '../../../core/services/turma-matricula.service';
import {
  ProfessorResumo,
  ROTULOS_CRITERIO_AVALIACAO_TURMA,
  ROTULOS_STATUS_TURMA,
  Turma,
} from '../../../core/models/turma.model';
import {
  Aula,
  ROTULOS_STATUS_AULA,
  StatusAula,
} from '../../../core/models/aula.model';
import {
  ResultadoFinalMatricula,
  ROTULOS_RESULTADO_FINAL_MATRICULA,
  ROTULOS_STATUS_MATRICULA,
  StatusMatricula,
  TurmaMatricula,
} from '../../../core/models/turma-matricula.model';
import { formatarData } from '../../../shared/utils/data.utils';
import { CONFIG_MODAL } from '../../../shared/components/ui/modal/modal.config';
import { ModalConfirmacaoComponent } from '../../../shared/components/ui/modal-confirmacao/modal-confirmacao.component';
import { ModalVincularProfessorComponent } from './components/modal-vincular-professor/modal-vincular-professor.component';
import { ModalAulaComponent } from './components/modal-aula/modal-aula.component';
import { ModalMatriculaComponent } from './components/modal-matricula/modal-matricula.component';

@Component({
  selector: 'app-detalhes-turma',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatDialogModule,
    MatProgressBarModule,
    CabecalhoPaginaComponent,
    CardComponent,
    BotaoComponent,
    SpinnerComponent,
    TabelaComponent,
    TabelaCelulaDirective,
  ],
  templateUrl: './detalhes-turma.component.html',
  styleUrl: './detalhes-turma.component.scss',
})
export class DetalhesTurmaComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly turmaService = inject(TurmaService);
  private readonly aulaService = inject(AulaService);
  private readonly turmaMatriculaService = inject(TurmaMatriculaService);
  private readonly notificacao = inject(NotificacaoService);

  cursoId = signal<string | null>(null);
  turmaId = signal<string | null>(null);
  turma = signal<Turma | null>(null);
  estaCarregando = signal<boolean>(true);

  // Aulas
  aulas = signal<Aula[]>([]);
  estaCarregandoAulas = signal<boolean>(false);
  paginaAtualAulas = signal<number>(1);
  itensPorPaginaAulas = signal<number>(10);
  totalItensAulas = signal<number>(0);

  colunasAulas: ColunaTabela<Aula>[] = [
    { chave: 'data', titulo: 'Data' },
    { chave: 'tema', titulo: 'Tema / Conteúdo' },
    { chave: 'status', titulo: 'Status' },
    { chave: 'acoes', titulo: 'Ações' },
  ];

  // Professores
  colunasProfessores: ColunaTabela<ProfessorResumo>[] = [
    { chave: 'nome', titulo: 'Nome do Professor' },
    { chave: 'acoes', titulo: 'Ações' },
  ];

  // Alunos / Matrículas
  matriculas = signal<TurmaMatricula[]>([]);
  estaCarregandoMatriculas = signal<boolean>(false);
  paginaAtualMatriculas = signal<number>(1);
  itensPorPaginaMatriculas = signal<number>(10);
  totalItensMatriculas = signal<number>(0);

  colunasMatriculas: ColunaTabela<TurmaMatricula>[] = [
    { chave: 'nomeAluno', titulo: 'Nome do Aluno' },
    { chave: 'status', titulo: 'Status da Matrícula' },
    { chave: 'resultadoFinal', titulo: 'Resultado Final' },
    { chave: 'notaFinal', titulo: 'Nota / XP' },
    { chave: 'acoes', titulo: 'Ações' },
  ];

  readonly rotulosStatus = ROTULOS_STATUS_TURMA;
  readonly rotulosCriterio = ROTULOS_CRITERIO_AVALIACAO_TURMA;
  readonly rotulosStatusAula = ROTULOS_STATUS_AULA;
  readonly rotulosStatusMatricula = ROTULOS_STATUS_MATRICULA;
  readonly rotulosResultadoFinal = ROTULOS_RESULTADO_FINAL_MATRICULA;
  readonly formatarData = formatarData;

  obterRotuloStatusAula(status: string): string {
    return this.rotulosStatusAula[status as StatusAula] || status;
  }

  obterRotuloStatusMatricula(status: string): string {
    return this.rotulosStatusMatricula[status as StatusMatricula] || status;
  }

  obterRotuloResultadoFinal(resultado: string | null | undefined): string {
    if (!resultado) return '—';
    return this.rotulosResultadoFinal[resultado as ResultadoFinalMatricula] || resultado;
  }

  ngOnInit(): void {
    const cursoId = this.route.snapshot.paramMap.get('cursoId');
    const turmaId = this.route.snapshot.paramMap.get('turmaId');

    if (!turmaId) {
      this.notificacao.erro('Turma não encontrada.');
      this.voltar();
      return;
    }

    this.cursoId.set(cursoId);
    this.turmaId.set(turmaId);
    this.carregarTurma(turmaId);
    this.carregarAulas(turmaId);
    this.carregarMatriculas(turmaId);
  }

  carregarTurma(turmaId: string): void {
    this.estaCarregando.set(true);

    this.turmaService
      .buscarPorId(turmaId)
      .pipe(finalize(() => this.estaCarregando.set(false)))
      .subscribe({
        next: (turma) => {
          this.turma.set(turma);
        },
        error: (erro) => {
          console.error('Erro ao carregar turma:', erro);
          this.notificacao.erro('Erro ao carregar dados da turma.');
          this.voltar();
        },
      });
  }

  // --- Aulas ---
  carregarAulas(turmaId?: string): void {
    const id = turmaId || this.turmaId();
    if (!id) return;

    this.estaCarregandoAulas.set(true);

    this.aulaService
      .buscarTodas({
        turmaId: id,
        pagina: this.paginaAtualAulas(),
        itensPorPagina: this.itensPorPaginaAulas(),
      })
      .pipe(finalize(() => this.estaCarregandoAulas.set(false)))
      .subscribe({
        next: (resposta) => {
          this.aulas.set(resposta.dados || []);
          this.totalItensAulas.set(resposta.meta?.totalItens ?? (resposta.dados?.length || 0));
          this.itensPorPaginaAulas.set(resposta.meta?.itensPorPagina ?? 10);
        },
        error: (erro) => {
          console.error('Erro ao carregar aulas:', erro);
          this.notificacao.erro('Erro ao carregar aulas da turma.');
        },
      });
  }

  mudarPaginaAulas(event: PageEvent): void {
    this.paginaAtualAulas.set(event.pageIndex + 1);
    this.itensPorPaginaAulas.set(event.pageSize);
    this.carregarAulas();
  }

  adicionarAula(): void {
    if (!this.turmaId()) return;

    const dialogRef = this.dialog.open(ModalAulaComponent, {
      ...CONFIG_MODAL.sm,
      data: {
        turmaId: this.turmaId()!,
        aula: null,
      },
    });

    dialogRef.afterClosed().subscribe((sucesso) => {
      if (sucesso) {
        this.carregarAulas();
      }
    });
  }

  editarAula(aula: Aula): void {
    if (!this.turmaId()) return;

    const dialogRef = this.dialog.open(ModalAulaComponent, {
      ...CONFIG_MODAL.sm,
      data: {
        turmaId: this.turmaId()!,
        aula,
      },
    });

    dialogRef.afterClosed().subscribe((sucesso) => {
      if (sucesso) {
        this.carregarAulas();
      }
    });
  }

  excluirAula(aula: Aula): void {
    const dialogRef = this.dialog.open(ModalConfirmacaoComponent, {
      ...CONFIG_MODAL.sm,
      data: {
        titulo: 'Excluir Aula',
        mensagem: `Tem certeza que deseja excluir a aula de ${formatarData(aula.data)} ("${aula.tema}")?`,
        tipo: 'perigo',
      },
    });

    dialogRef.afterClosed().subscribe((confirmado) => {
      if (!confirmado) return;

      this.estaCarregandoAulas.set(true);
      this.aulaService.excluir(aula.id).subscribe({
        next: () => {
          this.notificacao.sucesso('Aula excluída com sucesso!');
          this.carregarAulas();
        },
        error: (erro) => {
          console.error('Erro ao excluir aula:', erro);
          this.notificacao.erro('Erro ao excluir a aula. Tente novamente.');
          this.estaCarregandoAulas.set(false);
        },
      });
    });
  }

  // --- Professores ---
  abrirModalVincularProfessor(): void {
    if (!this.turmaId()) return;

    const professoresJaVinculadosIds = (this.turma()?.professores || []).map(
      (professor) => professor.id
    );

    const dialogRef = this.dialog.open(ModalVincularProfessorComponent, {
      ...CONFIG_MODAL.sm,
      data: {
        turmaId: this.turmaId()!,
        professoresJaVinculadosIds,
      },
    });

    dialogRef.afterClosed().subscribe((sucesso) => {
      if (sucesso && this.turmaId()) {
        this.carregarTurma(this.turmaId()!);
      }
    });
  }

  desvincularProfessor(professor: ProfessorResumo): void {
    if (!this.turmaId()) return;

    const dialogRef = this.dialog.open(ModalConfirmacaoComponent, {
      ...CONFIG_MODAL.sm,
      data: {
        titulo: 'Desvincular Professor',
        mensagem: `Tem certeza que deseja desvincular o professor "${professor.nome}" desta turma?`,
        tipo: 'perigo',
      },
    });

    dialogRef.afterClosed().subscribe((confirmado) => {
      if (!confirmado || !this.turmaId()) return;

      this.turmaService.desvincularProfessor(this.turmaId()!, professor.id).subscribe({
        next: () => {
          this.notificacao.sucesso('Professor desvinculado com sucesso!');
          this.carregarTurma(this.turmaId()!);
        },
        error: (erro) => {
          console.error('Erro ao desvincular professor:', erro);
          this.notificacao.erro('Erro ao desvincular o professor. Tente novamente.');
        },
      });
    });
  }

  // --- Alunos / Matrículas ---
  carregarMatriculas(turmaId?: string): void {
    const id = turmaId || this.turmaId();
    if (!id) return;

    this.estaCarregandoMatriculas.set(true);

    this.turmaMatriculaService
      .buscarTodas({
        turmaId: id,
        pagina: this.paginaAtualMatriculas(),
        itensPorPagina: this.itensPorPaginaMatriculas(),
      })
      .pipe(finalize(() => this.estaCarregandoMatriculas.set(false)))
      .subscribe({
        next: (resposta) => {
          this.matriculas.set(resposta.dados || []);
          this.totalItensMatriculas.set(resposta.meta?.totalItens ?? (resposta.dados?.length || 0));
          this.itensPorPaginaMatriculas.set(resposta.meta?.itensPorPagina ?? 10);
        },
        error: (erro) => {
          console.error('Erro ao carregar matrículas:', erro);
          this.notificacao.erro('Erro ao carregar lista de alunos matriculados.');
        },
      });
  }

  mudarPaginaMatriculas(event: PageEvent): void {
    this.paginaAtualMatriculas.set(event.pageIndex + 1);
    this.itensPorPaginaMatriculas.set(event.pageSize);
    this.carregarMatriculas();
  }

  adicionarMatricula(): void {
    if (!this.turmaId()) return;

    const matriculadosJaIds = this.matriculas().map(
      (matricula) => matricula.beneficiario.id
    );

    const dialogRef = this.dialog.open(ModalMatriculaComponent, {
      ...CONFIG_MODAL.sm,
      data: {
        turmaId: this.turmaId()!,
        matricula: null,
        matriculadosJaIds,
      },
    });

    dialogRef.afterClosed().subscribe((sucesso) => {
      if (sucesso) {
        this.carregarMatriculas();
      }
    });
  }

  editarMatricula(matricula: TurmaMatricula): void {
    if (!this.turmaId()) return;

    const dialogRef = this.dialog.open(ModalMatriculaComponent, {
      ...CONFIG_MODAL.sm,
      data: {
        turmaId: this.turmaId()!,
        matricula,
      },
    });

    dialogRef.afterClosed().subscribe((sucesso) => {
      if (sucesso) {
        this.carregarMatriculas();
      }
    });
  }

  excluirMatricula(matricula: TurmaMatricula): void {
    const dialogRef = this.dialog.open(ModalConfirmacaoComponent, {
      ...CONFIG_MODAL.sm,
      data: {
        titulo: 'Remover Matrícula',
        mensagem: `Tem certeza que deseja remover a matrícula do aluno "${matricula.beneficiario?.nome}" desta turma?`,
        tipo: 'perigo',
      },
    });

    dialogRef.afterClosed().subscribe((confirmado) => {
      if (!confirmado) return;

      this.estaCarregandoMatriculas.set(true);
      this.turmaMatriculaService.excluir(matricula.id).subscribe({
        next: () => {
          this.notificacao.sucesso('Matrícula removida com sucesso!');
          this.carregarMatriculas();
        },
        error: (erro) => {
          console.error('Erro ao remover matrícula:', erro);
          this.notificacao.erro('Erro ao remover a matrícula. Tente novamente.');
          this.estaCarregandoMatriculas.set(false);
        },
      });
    });
  }

  obterRotaVoltar(): string {
    const cursoId = this.cursoId() || this.turma()?.planoCurso?.cursoId;
    return cursoId ? `/cursos/${cursoId}` : '/cursos';
  }

  voltar(): void {
    this.router.navigateByUrl(this.obterRotaVoltar());
  }
}
