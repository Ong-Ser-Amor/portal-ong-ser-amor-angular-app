import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';
import { finalize } from 'rxjs';

import { ModalComponent } from '../../../../../shared/components/ui/modal/modal.component';
import { InputComponent } from '../../../../../shared/components/ui/input/input.component';
import { SelectComponent } from '../../../../../shared/components/ui/select/select.component';
import { DateInputComponent } from '../../../../../shared/components/ui/date-input/date-input.component';
import { TurmaService } from '../../../../../core/services/turma.service';
import { NotificacaoService } from '../../../../../core/services/notificacao.service';
import { PlanoCurso } from '../../../../../core/models/plano-curso.model';
import {
  OPCOES_CRITERIO_AVALIACAO_TURMA,
  OPCOES_STATUS_TURMA,
  TurmaResumo,
} from '../../../../../core/models/turma.model';
import { OpcaoSelect } from '../../../../../core/models/opcao-select.model';

export interface DadosModalTurma {
  cursoId: string;
  planos: PlanoCurso[];
  turma?: TurmaResumo | null;
}

@Component({
  selector: 'app-modal-turma',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalComponent,
    InputComponent,
    SelectComponent,
    DateInputComponent,
  ],
  templateUrl: './modal-turma.component.html',
  styleUrl: './modal-turma.component.scss',
})
export class ModalTurmaComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly turmaService = inject(TurmaService);
  private readonly dialogRef = inject(MatDialogRef<ModalTurmaComponent>);
  private readonly notificacao = inject(NotificacaoService);

  readonly data = inject<DadosModalTurma>(MAT_DIALOG_DATA);

  form!: FormGroup;
  ehEdicao = false;
  salvando = signal<boolean>(false);

  readonly opcoesStatusTurma: OpcaoSelect<string>[] = OPCOES_STATUS_TURMA.map((opcao) => ({
    valor: opcao.valor,
    rotulo: opcao.rotulo,
  }));

  readonly opcoesCriterioAvaliacao: OpcaoSelect<string>[] = OPCOES_CRITERIO_AVALIACAO_TURMA.map((opcao) => ({
    valor: opcao.valor,
    rotulo: opcao.rotulo,
  }));

  readonly opcoesPlanosCurso = computed<OpcaoSelect<string>[]>(() =>
    (this.data?.planos || []).map((plano) => ({
      valor: plano.id,
      rotulo: plano.nome,
    }))
  );

  ngOnInit(): void {
    this.ehEdicao = !!this.data?.turma;
    const turma = this.data?.turma;

    this.form = this.fb.group({
      planoCursoId: [
        {
          value: turma?.planoCurso?.id || '',
          disabled: this.ehEdicao,
        },
        [Validators.required],
      ],
      nome: [
        turma?.nome || '',
        [Validators.required, Validators.minLength(3), Validators.maxLength(100)],
      ],
      cargaHoraria: [
        turma?.cargaHoraria ?? '',
        [Validators.required, Validators.min(1)],
      ],
      dataInicio: [
        turma?.dataInicio ? turma.dataInicio.split('T')[0] : '',
        [Validators.required],
      ],
      dataFim: [
        turma?.dataFim ? turma.dataFim.split('T')[0] : '',
        [Validators.required],
      ],
      status: [
        turma?.status || 'EM_FORMACAO',
        [Validators.required],
      ],
      criterioAvaliacao: [
        turma?.criterioAvaliacao || 'SEM_CONTROLE',
        [Validators.required],
      ],
      frequenciaMinima: [
        turma?.frequenciaMinima ?? null,
        [Validators.min(0), Validators.max(100)],
      ],
      notaMinima: [
        turma?.notaMinima ?? '',
      ],
    });
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.salvando.set(true);
    const formRaw = this.form.getRawValue();

    const dataInicioFormatada = typeof formRaw.dataInicio === 'string'
      ? formRaw.dataInicio
      : formRaw.dataInicio instanceof Date
        ? formRaw.dataInicio.toISOString().split('T')[0]
        : '';

    const dataFimFormatada = typeof formRaw.dataFim === 'string'
      ? formRaw.dataFim
      : formRaw.dataFim instanceof Date
        ? formRaw.dataFim.toISOString().split('T')[0]
        : '';

    const payloadCriar = {
      planoCursoId: formRaw.planoCursoId.toString(),
      nome: formRaw.nome,
      cargaHoraria: Number(formRaw.cargaHoraria),
      dataInicio: dataInicioFormatada,
      dataFim: dataFimFormatada,
      status: formRaw.status,
      criterioAvaliacao: formRaw.criterioAvaliacao,
      frequenciaMinima: formRaw.frequenciaMinima !== null && formRaw.frequenciaMinima !== ''
        ? Number(formRaw.frequenciaMinima)
        : null,
      notaMinima: formRaw.notaMinima ? formRaw.notaMinima.toString() : null,
    };

    const request$ = this.ehEdicao && this.data.turma
      ? this.turmaService.atualizar(this.data.turma.id, {
          nome: payloadCriar.nome,
          cargaHoraria: payloadCriar.cargaHoraria,
          dataInicio: payloadCriar.dataInicio,
          dataFim: payloadCriar.dataFim,
          status: payloadCriar.status,
          criterioAvaliacao: payloadCriar.criterioAvaliacao,
          frequenciaMinima: payloadCriar.frequenciaMinima,
          notaMinima: payloadCriar.notaMinima,
        })
      : this.turmaService.criar(payloadCriar);

    request$
      .pipe(finalize(() => this.salvando.set(false)))
      .subscribe({
        next: () => {
          this.notificacao.sucesso(
            this.ehEdicao ? 'Turma atualizada com sucesso!' : 'Turma criada com sucesso!'
          );
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error('Erro ao salvar turma:', err);
          const msg = err?.error?.message || 'Erro ao salvar turma.';
          this.notificacao.erro(msg);
        },
      });
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }
}
