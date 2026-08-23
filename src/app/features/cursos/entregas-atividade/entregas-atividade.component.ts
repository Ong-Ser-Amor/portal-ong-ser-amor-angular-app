import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin } from 'rxjs';

import { CardComponent } from '../../../shared/components/ui/card/card.component';
import { BotaoComponent } from '../../../shared/components/ui/botao/botao.component';
import { InputComponent } from '../../../shared/components/ui/input/input.component';
import { SelectComponent } from '../../../shared/components/ui/select/select.component';
import { CabecalhoPaginaComponent } from '../../../shared/components/ui/cabecalho-pagina/cabecalho-pagina.component';
import { SpinnerComponent } from '../../../shared/components/ui/spinner/spinner.component';
import { NotificacaoService } from '../../../core/services/notificacao.service';
import { TurmaService } from '../../../core/services/turma.service';
import { TurmaAtividadeService } from '../../../core/services/turma-atividade.service';
import { Turma } from '../../../core/models/turma.model';
import {
  EntregaAtividadeDto,
  OPCOES_STATUS_ENTREGA,
  RegistrarEntregasLoteDto,
  ROTULOS_STATUS_ENTREGA,
  ROTULOS_TIPO_ATIVIDADE,
  StatusEntregaAtividade,
  TipoAtividade,
  TurmaAtividadeRespostaDto,
} from '../../../core/models/turma-atividade.model';
import { formatarData } from '../../../shared/utils/data.utils';

export interface ItemLinhaEntrega {
  entregaId: string;
  matriculaId: string;
  nomeAluno: string;
  statusEntrega: StatusEntregaAtividade;
  notaObtida: string;
  observacao: string;
}

@Component({
  selector: 'app-entregas-atividade',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    CardComponent,
    BotaoComponent,
    InputComponent,
    SelectComponent,
    CabecalhoPaginaComponent,
    SpinnerComponent,
  ],
  templateUrl: './entregas-atividade.component.html',
  styleUrl: './entregas-atividade.component.scss',
})
export class EntregasAtividadeComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly turmaService = inject(TurmaService);
  private readonly turmaAtividadeService = inject(TurmaAtividadeService);
  private readonly notificacao = inject(NotificacaoService);

  readonly formatarData = formatarData;
  readonly rotulosTipoAtividade = ROTULOS_TIPO_ATIVIDADE;
  readonly rotulosStatusEntrega = ROTULOS_STATUS_ENTREGA;
  readonly opcoesStatusEntrega = OPCOES_STATUS_ENTREGA;

  cursoId = '';
  turmaId = '';
  atividadeId = '';

  estaCarregando = signal<boolean>(true);
  estaSalvando = signal<boolean>(false);

  turma = signal<Turma | null>(null);
  atividade = signal<TurmaAtividadeRespostaDto | null>(null);
  linhas = signal<ItemLinhaEntrega[]>([]);

  readonly totalAlunos = computed(() => this.linhas().length);
  readonly totalEntregues = computed(
    () => this.linhas().filter((l) => l.statusEntrega === 'ENTREGUE').length
  );
  readonly totalComAtraso = computed(
    () => this.linhas().filter((l) => l.statusEntrega === 'ENTREGUE_COM_ATRASO').length
  );
  readonly totalPendentes = computed(
    () => this.linhas().filter((l) => l.statusEntrega === 'PENDENTE').length
  );
  readonly totalNaoEntregues = computed(
    () => this.linhas().filter((l) => l.statusEntrega === 'NAO_ENTREGUE').length
  );

  readonly notaMaximaNumerica = computed<number | null>(() => {
    const notaMax = this.atividade()?.notaMaxima;
    return notaMax ? Number(notaMax) : null;
  });

  obterRotuloTipoAtividade(tipo?: TipoAtividade | null): string {
    if (!tipo) return '—';
    return this.rotulosTipoAtividade[tipo] || tipo;
  }

  obterRotuloStatus(status?: any): string {
    if (!status) return '—';
    return this.rotulosStatusEntrega[status as StatusEntregaAtividade] || status;
  }

  ngOnInit(): void {
    this.cursoId = this.route.snapshot.paramMap.get('cursoId') || '';
    this.turmaId = this.route.snapshot.paramMap.get('turmaId') || '';
    this.atividadeId = this.route.snapshot.paramMap.get('atividadeId') || '';

    if (!this.turmaId || !this.atividadeId) {
      this.notificacao.erro('Identificadores da turma ou da atividade não encontrados.');
      this.voltar();
      return;
    }

    this.carregarDados();
  }

  carregarDados(): void {
    this.estaCarregando.set(true);

    forkJoin({
      turma: this.turmaService.buscarPorId(this.turmaId),
      atividades: this.turmaAtividadeService.buscarPorTurma(this.turmaId),
      entregas: this.turmaAtividadeService.buscarEntregasPorAtividade(this.atividadeId),
    }).subscribe({
      next: ({ turma, atividades, entregas }) => {
        this.turma.set(turma);

        const atividadeEncontrada = (atividades || []).find(
          (a) => a.id === this.atividadeId
        );
        if (atividadeEncontrada) {
          this.atividade.set(atividadeEncontrada);
        } else if (entregas && entregas.length > 0 && entregas[0].atividade) {
          this.atividade.set(entregas[0].atividade);
        }

        if (entregas && entregas.length > 0) {
          const linhasMapeadas: ItemLinhaEntrega[] = entregas.map((item) => ({
            entregaId: item.id,
            matriculaId: item.matriculaId,
            nomeAluno: item.matricula?.nomeAluno || 'Aluno sem nome',
            statusEntrega: (item.statusEntrega || 'PENDENTE') as StatusEntregaAtividade,
            notaObtida:
              this.permiteNota((item.statusEntrega || 'PENDENTE') as StatusEntregaAtividade) &&
              item.notaObtida !== null &&
              item.notaObtida !== undefined
                ? String(item.notaObtida)
                : '',
            observacao: item.observacao || '',
          }));

          this.linhas.set(linhasMapeadas);
        } else {
          this.linhas.set([]);
        }

        this.estaCarregando.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar dados da atividade:', err);
        this.notificacao.erro('Erro ao carregar os dados da atividade e dos alunos.');
        this.estaCarregando.set(false);
      },
    });
  }

  permiteNota(status: StatusEntregaAtividade): boolean {
    return status === 'ENTREGUE' || status === 'ENTREGUE_COM_ATRASO';
  }

  alterarStatus(linha: ItemLinhaEntrega): void {
    if (!this.permiteNota(linha.statusEntrega)) {
      linha.notaObtida = '';
    }
  }

  salvar(): void {
    if (this.estaSalvando()) return;

    const itens = this.linhas();
    if (itens.length === 0) {
      this.notificacao.erro('Não há alunos matriculados nesta turma para lançar notas.');
      return;
    }

    const atividadeAtual = this.atividade();
    const valeNota = atividadeAtual?.valeNota;
    const notaMaxima = atividadeAtual?.notaMaxima ? Number(atividadeAtual.notaMaxima) : null;

    // Validar notas caso a atividade valha nota
    if (valeNota && notaMaxima !== null) {
      for (const item of itens) {
        if (this.permiteNota(item.statusEntrega) && item.notaObtida && item.notaObtida.trim() !== '') {
          const valorNota = Number(item.notaObtida.trim());
          if (isNaN(valorNota) || valorNota < 0 || valorNota > notaMaxima) {
            this.notificacao.erro(
              `A nota do(a) aluno(a) "${item.nomeAluno}" é inválida ou ultrapassa a nota máxima permitida (${notaMaxima}).`
            );
            return;
          }
        }
      }
    }

    this.estaSalvando.set(true);

    const entregasPayload: EntregaAtividadeDto[] = itens.map((item) => ({
      entregaId: item.entregaId,
      statusEntrega: item.statusEntrega,
      notaObtida:
        valeNota &&
        this.permiteNota(item.statusEntrega) &&
        item.notaObtida !== null &&
        item.notaObtida.trim() !== ''
          ? item.notaObtida.trim()
          : null,
      observacao: item.observacao?.trim() || null,
    }));

    const payload: RegistrarEntregasLoteDto = {
      entregas: entregasPayload,
    };

    this.turmaAtividadeService.registrarEntregasEmLote(payload).subscribe({
      next: () => {
        this.notificacao.sucesso('Avaliações da atividade salvas com sucesso!');
        this.estaSalvando.set(false);
        this.voltar();
      },
      error: (err: any) => {
        console.error('Erro ao salvar entregas:', err);
        this.notificacao.erro(
          'Erro ao salvar as avaliações da atividade. Verifique os dados e tente novamente.'
        );
        this.estaSalvando.set(false);
      },
    });
  }

  obterRotaVoltar(): string[] {
    return ['/cursos', this.cursoId, 'turmas', this.turmaId];
  }

  voltar(): void {
    this.router.navigate(this.obterRotaVoltar());
  }
}
