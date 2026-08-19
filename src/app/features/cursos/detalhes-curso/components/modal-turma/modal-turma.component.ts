import { Component, inject, OnInit, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ModalComponent } from '../../../../../shared/components/ui/modal/modal.component';
import { InputComponent } from '../../../../../shared/components/ui/input/input.component';
import { SelectComponent } from '../../../../../shared/components/ui/select/select.component';
import { DateInputComponent } from '../../../../../shared/components/ui/date-input/date-input.component';
import { TurmaService } from '../../../../../core/services/turma.service';
import { NotificacaoService } from '../../../../../core/services/notificacao.service';
import { PlanoCurso } from '../../../../../core/models/plano-curso.model';
import {
  AtualizarTurmaDto,
  CriarTurmaDto,
  CriterioAvaliacaoTurma,
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
  private readonly destroyRef = inject(DestroyRef);

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

  get frequenciaObrigatoria(): boolean {
    const criterio = this.form?.get('criterioAvaliacao')?.value;
    return criterio === 'POR_PARTICIPACAO' || criterio === 'POR_NOTA_PRESENCA';
  }

  get notaObrigatoria(): boolean {
    const criterio = this.form?.get('criterioAvaliacao')?.value;
    return criterio === 'POR_NOTA_PRESENCA';
  }

  ngOnInit(): void {
    this.ehEdicao = !!this.data?.turma;
    const turma = this.data?.turma;

    this.form = this.fb.group(
      {
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
        ],
        notaMinima: [
          turma?.notaMinima ?? '',
        ],
      },
      {
        validators: [this.validadorPeriodoLetivo],
      }
    );

    const criterioInicial = this.form.get('criterioAvaliacao')?.value as CriterioAvaliacaoTurma;
    this.atualizarRegrasCriterioAvaliacao(criterioInicial, false);

    this.form
      .get('criterioAvaliacao')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((novoCriterio: CriterioAvaliacaoTurma) => {
        this.atualizarRegrasCriterioAvaliacao(novoCriterio, true);
      });
  }

  validadorPeriodoLetivo(control: AbstractControl): ValidationErrors | null {
    const form = control as FormGroup;
    const dataInicio = form.get('dataInicio')?.value;
    const dataFim = form.get('dataFim')?.value;

    if (!dataInicio || !dataFim) {
      return null;
    }

    const inicioStr = typeof dataInicio === 'string' ? dataInicio : dataInicio instanceof Date ? dataInicio.toISOString().split('T')[0] : '';
    const fimStr = typeof dataFim === 'string' ? dataFim : dataFim instanceof Date ? dataFim.toISOString().split('T')[0] : '';

    if (inicioStr && fimStr && fimStr < inicioStr) {
      return { periodoInvalido: true };
    }

    return null;
  }

  atualizarRegrasCriterioAvaliacao(criterio: CriterioAvaliacaoTurma, limparValores: boolean): void {
    const frequenciaControl = this.form.get('frequenciaMinima');
    const notaControl = this.form.get('notaMinima');

    if (!frequenciaControl || !notaControl) return;

    switch (criterio) {
      case 'SEM_CONTROLE':
        if (limparValores) {
          frequenciaControl.setValue(null);
          notaControl.setValue('');
        }
        frequenciaControl.disable();
        notaControl.disable();
        frequenciaControl.clearValidators();
        notaControl.clearValidators();
        break;

      case 'POR_PARTICIPACAO':
        if (limparValores) {
          notaControl.setValue('');
        }
        frequenciaControl.enable();
        notaControl.disable();
        frequenciaControl.setValidators([Validators.required, Validators.min(0), Validators.max(100)]);
        notaControl.clearValidators();
        break;

      case 'POR_NOTA_PRESENCA':
        frequenciaControl.enable();
        notaControl.enable();
        frequenciaControl.setValidators([Validators.required, Validators.min(0), Validators.max(100)]);
        notaControl.setValidators([
          Validators.required,
          Validators.pattern(/^\d{1,5}(\.\d{1,2})?$/),
        ]);
        break;

      case 'QUALITATIVA':
        if (limparValores) {
          notaControl.setValue('');
        }
        frequenciaControl.enable();
        notaControl.disable();
        frequenciaControl.setValidators([Validators.min(0), Validators.max(100)]);
        notaControl.clearValidators();
        break;
    }

    frequenciaControl.updateValueAndValidity();
    notaControl.updateValueAndValidity();
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      if (this.form.errors?.['periodoInvalido']) {
        this.notificacao.erro('A data de término não pode ser anterior à data de início.');
      }
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

    const criterio = formRaw.criterioAvaliacao as CriterioAvaliacaoTurma;

    // Sanitização estrita do payload conforme o critério de avaliação
    let frequenciaMinimaSanitizada: number | null = null;
    let notaMinimaSanitizada: string | null = null;

    if (criterio === 'POR_PARTICIPACAO' || criterio === 'POR_NOTA_PRESENCA' || criterio === 'QUALITATIVA') {
      if (formRaw.frequenciaMinima !== null && formRaw.frequenciaMinima !== undefined && formRaw.frequenciaMinima !== '') {
        frequenciaMinimaSanitizada = Number(formRaw.frequenciaMinima);
      }
    }

    if (criterio === 'POR_NOTA_PRESENCA') {
      if (formRaw.notaMinima) {
        notaMinimaSanitizada = formRaw.notaMinima.toString().trim();
      }
    }

    const payloadCriar: CriarTurmaDto = {
      planoCursoId: formRaw.planoCursoId.toString(),
      nome: formRaw.nome?.trim(),
      cargaHoraria: Number(formRaw.cargaHoraria),
      dataInicio: dataInicioFormatada,
      dataFim: dataFimFormatada,
      status: formRaw.status,
      criterioAvaliacao: criterio,
      frequenciaMinima: frequenciaMinimaSanitizada,
      notaMinima: notaMinimaSanitizada,
    };

    const payloadAtualizar: AtualizarTurmaDto = {
      nome: payloadCriar.nome,
      cargaHoraria: payloadCriar.cargaHoraria,
      dataInicio: payloadCriar.dataInicio,
      dataFim: payloadCriar.dataFim,
      status: payloadCriar.status,
      criterioAvaliacao: payloadCriar.criterioAvaliacao,
      frequenciaMinima: payloadCriar.frequenciaMinima,
      notaMinima: payloadCriar.notaMinima,
    };

    const request$ = this.ehEdicao && this.data.turma
      ? this.turmaService.atualizar(this.data.turma.id, payloadAtualizar)
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
          this.notificacao.erro('Erro ao salvar a turma. Tente novamente.');
        },
      });
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }
}
