import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin } from 'rxjs';

import { CardComponent } from '../../../shared/components/ui/card/card.component';
import { BotaoComponent } from '../../../shared/components/ui/botao/botao.component';
import { InputComponent } from '../../../shared/components/ui/input/input.component';
import { SelectComponent } from '../../../shared/components/ui/select/select.component';
import { CheckboxComponent } from '../../../shared/components/ui/checkbox/checkbox.component';
import { CabecalhoPaginaComponent } from '../../../shared/components/ui/cabecalho-pagina/cabecalho-pagina.component';
import { SpinnerComponent } from '../../../shared/components/ui/spinner/spinner.component';
import { ModalConfirmacaoComponent } from '../../../shared/components/ui/modal-confirmacao/modal-confirmacao.component';
import { CONFIG_MODAL } from '../../../shared/components/ui/modal/modal.config';
import { NotificacaoService } from '../../../core/services/notificacao.service';
import { AulaService } from '../../../core/services/aula.service';
import { TurmaService } from '../../../core/services/turma.service';
import { TurmaMatriculaService } from '../../../core/services/turma-matricula.service';
import { ChamadaService } from '../../../core/services/chamada.service';
import { Aula, ROTULOS_STATUS_AULA } from '../../../core/models/aula.model';
import { Turma } from '../../../core/models/turma.model';
import {
  CriarChamadaLoteDto,
  MotivoJustificativaFalta,
  OPCOES_MOTIVO_JUSTIFICATIVA_FALTA,
  RegistroPresencaDto,
} from '../../../core/models/chamada.model';
import { formatarData } from '../../../shared/utils/data.utils';

export interface ItemLinhaChamada {
  matriculaId: string;
  nomeAluno: string;
  presente: boolean | null;
  faltaJustificada: boolean;
  motivoJustificativa: MotivoJustificativaFalta | null;
  observacao: string;
}

@Component({
  selector: 'app-chamada-aula',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    CardComponent,
    BotaoComponent,
    InputComponent,
    SelectComponent,
    CheckboxComponent,
    CabecalhoPaginaComponent,
    SpinnerComponent,
  ],
  templateUrl: './chamada-aula.component.html',
  styleUrl: './chamada-aula.component.scss',
})
export class ChamadaAulaComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly aulaService = inject(AulaService);
  private readonly turmaService = inject(TurmaService);
  private readonly turmaMatriculaService = inject(TurmaMatriculaService);
  private readonly chamadaService = inject(ChamadaService);
  private readonly notificacao = inject(NotificacaoService);

  readonly formatarData = formatarData;
  readonly rotulosStatusAula = ROTULOS_STATUS_AULA;
  readonly opcoesMotivo = OPCOES_MOTIVO_JUSTIFICATIVA_FALTA;

  cursoId = '';
  turmaId = '';
  aulaId = '';

  estaCarregando = signal<boolean>(true);
  estaSalvando = signal<boolean>(false);
  estaExcluindo = signal<boolean>(false);

  aula = signal<Aula | null>(null);
  turma = signal<Turma | null>(null);
  chamadaExistente = signal<boolean>(false);
  linhas = signal<ItemLinhaChamada[]>([]);

  readonly totalAlunos = computed(() => this.linhas().length);
  readonly totalPresentes = computed(() => this.linhas().filter((l) => l.presente === true).length);
  readonly totalFaltas = computed(() => this.linhas().filter((l) => l.presente === false).length);
  readonly totalJustificadas = computed(
    () => this.linhas().filter((l) => l.presente === false && l.faltaJustificada).length
  );

  ngOnInit(): void {
    this.cursoId = this.route.snapshot.paramMap.get('cursoId') || '';
    this.turmaId = this.route.snapshot.paramMap.get('turmaId') || '';
    this.aulaId = this.route.snapshot.paramMap.get('aulaId') || '';

    if (!this.turmaId || !this.aulaId) {
      this.notificacao.erro('Identificadores da turma ou da aula não encontrados.');
      this.voltar();
      return;
    }

    this.carregarDados();
  }

  carregarDados(): void {
    this.estaCarregando.set(true);

    forkJoin({
      aula: this.aulaService.buscarPorId(this.aulaId),
      turma: this.turmaService.buscarPorId(this.turmaId),
      matriculas: this.turmaMatriculaService.buscarTodas({
        turmaId: this.turmaId,
        itensPorPagina: 100,
      }),
    }).subscribe({
      next: ({ aula, turma, matriculas }) => {
        this.aula.set(aula);
        this.turma.set(turma);

        const listaMatriculas = matriculas.dados || [];

        // Buscar chamada existente
        this.chamadaService.buscarPorAula(this.aulaId).subscribe({
          next: (chamadasSalvas) => {
            if (chamadasSalvas && chamadasSalvas.length > 0) {
              this.chamadaExistente.set(true);

              const mapaChamadas = new Map(
                chamadasSalvas.map((c) => [c.matriculaId, c])
              );

              const linhasMontadas: ItemLinhaChamada[] = listaMatriculas.map((mat) => {
                const salva = mapaChamadas.get(mat.id);
                return {
                  matriculaId: mat.id,
                  nomeAluno: mat.beneficiario?.nome || 'Aluno sem nome',
                  presente: salva ? salva.presente : null,
                  faltaJustificada: salva ? salva.faltaJustificada : false,
                  motivoJustificativa: salva ? salva.motivoJustificativa : null,
                  observacao: salva?.observacao || '',
                };
              });

              this.linhas.set(linhasMontadas);
            } else {
              this.inicializarLinhasPadrao(listaMatriculas);
            }
            this.estaCarregando.set(false);
          },
          error: () => {
            // Se 404 ou erro ao buscar chamadas, inicializa lista padrão
            this.chamadaExistente.set(false);
            this.inicializarLinhasPadrao(listaMatriculas);
            this.estaCarregando.set(false);
          },
        });
      },
      error: (err) => {
        console.error('Erro ao carregar dados da aula:', err);
        this.notificacao.erro('Erro ao carregar os dados da aula e da turma.');
        this.estaCarregando.set(false);
      },
    });
  }

  private inicializarLinhasPadrao(matriculas: any[]): void {
    const linhasPadrao: ItemLinhaChamada[] = matriculas.map((mat) => ({
      matriculaId: mat.id,
      nomeAluno: mat.beneficiario?.nome || 'Aluno sem nome',
      presente: null,
      faltaJustificada: false,
      motivoJustificativa: null,
      observacao: '',
    }));

    this.linhas.set(linhasPadrao);
  }

  limparSelecoes(): void {
    this.linhas.update((itens) =>
      itens.map((item) => ({
        ...item,
        presente: null,
        faltaJustificada: false,
        motivoJustificativa: null,
      }))
    );
  }

  definirPresenca(item: ItemLinhaChamada, presente: boolean): void {
    item.presente = presente;
    if (presente) {
      item.faltaJustificada = false;
      item.motivoJustificativa = null;
    }
  }

  aoMudarFaltaJustificada(item: ItemLinhaChamada): void {
    if (!item.faltaJustificada) {
      item.motivoJustificativa = null;
    } else if (!item.motivoJustificativa) {
      item.motivoJustificativa = 'SAUDE';
    }
  }

  salvar(): void {
    if (this.estaSalvando()) return;

    const itens = this.linhas();
    if (itens.length === 0) {
      this.notificacao.erro('Não há alunos matriculados nesta turma para registrar chamada.');
      return;
    }

    // Validar se há alunos sem marcação
    const temNaoMarcados = itens.some((item) => item.presente === null);
    if (temNaoMarcados) {
      this.notificacao.erro(
        'Por favor, defina a presença ou falta de todos os alunos antes de salvar a lista.'
      );
      return;
    }

    // Validar justificativas obrigatórias
    const itemIncompleto = itens.find(
      (item) => item.presente === false && item.faltaJustificada && !item.motivoJustificativa
    );

    if (itemIncompleto) {
      this.notificacao.erro(
        `Selecione o motivo da falta justificada para o(a) aluno(a) "${itemIncompleto.nomeAluno}".`
      );
      return;
    }

    this.estaSalvando.set(true);

    const registros: RegistroPresencaDto[] = itens.map((item) => ({
      matriculaId: item.matriculaId,
      presente: item.presente === true,
      faltaJustificada: item.presente === false && item.faltaJustificada,
      motivoJustificativa:
        item.presente === false && item.faltaJustificada ? item.motivoJustificativa : null,
      observacao: item.observacao?.trim() || null,
    }));

    const payload: CriarChamadaLoteDto = {
      aulaId: this.aulaId,
      registros,
    };

    this.chamadaService.salvarLote(payload).subscribe({
      next: () => {
        this.notificacao.sucesso('Lista de presença salva com sucesso!');
        this.estaSalvando.set(false);
        this.voltar();
      },
      error: (err) => {
        console.error('Erro ao salvar chamada:', err);
        this.notificacao.erro('Erro ao salvar a lista de chamada. Verifique os dados e tente novamente.');
        this.estaSalvando.set(false);
      },
    });
  }

  excluirChamada(): void {
    const dialogRef = this.dialog.open(ModalConfirmacaoComponent, {
      ...CONFIG_MODAL.sm,
      data: {
        titulo: 'Excluir Lista de Presença',
        mensagem:
          'Tem certeza que deseja excluir as presenças desta aula? O status da aula será revertido para AGENDADA.',
        tipo: 'perigo',
      },
    });

    dialogRef.afterClosed().subscribe((confirmado) => {
      if (!confirmado) return;

      this.estaExcluindo.set(true);
      this.chamadaService.removerPorAula(this.aulaId).subscribe({
        next: () => {
          this.notificacao.sucesso('Lista de presença removida com sucesso!');
          this.estaExcluindo.set(false);
          this.voltar();
        },
        error: (err) => {
          console.error('Erro ao excluir chamada:', err);
          this.notificacao.erro('Erro ao excluir a lista de presença. Tente novamente.');
          this.estaExcluindo.set(false);
        },
      });
    });
  }

  obterRotaVoltar(): string[] {
    return ['/cursos', this.cursoId, 'turmas', this.turmaId];
  }

  voltar(): void {
    this.router.navigate(this.obterRotaVoltar());
  }
}
