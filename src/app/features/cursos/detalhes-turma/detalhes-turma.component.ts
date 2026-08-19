import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';

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
import {
  ProfessorResumo,
  ROTULOS_CRITERIO_AVALIACAO_TURMA,
  ROTULOS_STATUS_TURMA,
  Turma,
} from '../../../core/models/turma.model';
import { formatarData } from '../../../shared/utils/data.utils';
import { CONFIG_MODAL } from '../../../shared/components/ui/modal/modal.config';
import { ModalConfirmacaoComponent } from '../../../shared/components/ui/modal-confirmacao/modal-confirmacao.component';
import { ModalVincularProfessorComponent } from './components/modal-vincular-professor/modal-vincular-professor.component';

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
  private readonly notificacao = inject(NotificacaoService);

  cursoId = signal<string | null>(null);
  turmaId = signal<string | null>(null);
  turma = signal<Turma | null>(null);
  estaCarregando = signal<boolean>(true);

  colunasProfessores: ColunaTabela<ProfessorResumo>[] = [
    { chave: 'nome', titulo: 'Nome do Professor' },
    { chave: 'acoes', titulo: 'Ações' },
  ];

  readonly rotulosStatus = ROTULOS_STATUS_TURMA;
  readonly rotulosCriterio = ROTULOS_CRITERIO_AVALIACAO_TURMA;
  readonly formatarData = formatarData;

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
          const mensagem = erro?.error?.message || 'Erro ao desvincular professor da turma.';
          this.notificacao.erro(mensagem);
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
