import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs';

import { ModalComponent } from '../../../../../shared/components/ui/modal/modal.component';
import { InputComponent } from '../../../../../shared/components/ui/input/input.component';
import { SelectComponent } from '../../../../../shared/components/ui/select/select.component';
import { CheckboxComponent } from '../../../../../shared/components/ui/checkbox/checkbox.component';
import {
  DateInputComponent,
  DateInputErrorMessages,
} from '../../../../../shared/components/ui/date-input/date-input.component';
import { TurmaAtividadeService } from '../../../../../core/services/turma-atividade.service';
import { NotificacaoService } from '../../../../../core/services/notificacao.service';
import {
  AtualizarTurmaAtividadeDto,
  CriarTurmaAtividadeDto,
  OPCOES_TIPO_ATIVIDADE,
  TurmaAtividadeRespostaDto,
} from '../../../../../core/models/turma-atividade.model';
import { CriterioAvaliacaoTurma } from '../../../../../core/models/turma.model';
import { converterParaIsoDate } from '../../../../../shared/utils/data.utils';

export interface DadosModalAtividade {
  turmaId: string;
  criterioAvaliacao?: CriterioAvaliacaoTurma;
  dataInicioTurma?: string;
  dataFimTurma?: string;
  atividade?: TurmaAtividadeRespostaDto | null;
}

@Component({
  selector: 'app-modal-atividade',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalComponent,
    InputComponent,
    SelectComponent,
    CheckboxComponent,
    DateInputComponent,
  ],
  templateUrl: './modal-atividade.component.html',
  styleUrl: './modal-atividade.component.scss',
})
export class ModalAtividadeComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly atividadeService = inject(TurmaAtividadeService);
  private readonly dialogRef = inject(MatDialogRef<ModalAtividadeComponent>);
  private readonly notificacao = inject(NotificacaoService);

  readonly data = inject<DadosModalAtividade>(MAT_DIALOG_DATA);

  form!: FormGroup;
  ehEdicao = false;
  salvando = signal<boolean>(false);

  readonly opcoesTipoAtividade = OPCOES_TIPO_ATIVIDADE;

  readonly mensagensErroData: DateInputErrorMessages = {
    matDatepickerMin: 'Data anterior ao início da turma',
    matDatepickerMax: 'Data posterior ao término da turma',
  };

  get permiteNota(): boolean {
    return this.data?.criterioAvaliacao === 'POR_NOTA_PRESENCA';
  }

  ngOnInit(): void {
    this.ehEdicao = !!this.data?.atividade;
    const atividade = this.data?.atividade;

    this.form = this.fb.group(
      {
        titulo: [
          atividade?.titulo || '',
          [Validators.required, Validators.minLength(3), Validators.maxLength(150)],
        ],
        descricao: [atividade?.descricao || ''],
        tipoAtividade: [atividade?.tipoAtividade || 'EXERCICIO', [Validators.required]],
        dataAtribuicao: [
          converterParaIsoDate(atividade?.dataAtribuicao),
          [
            Validators.required,
            this.criarValidadorPeriodoTurma(
              this.data?.dataInicioTurma,
              this.data?.dataFimTurma
            ),
          ],
        ],
        prazoEntrega: [
          converterParaIsoDate(atividade?.prazoEntrega),
          [
            Validators.required,
            this.criarValidadorPeriodoTurma(
              this.data?.dataInicioTurma,
              this.data?.dataFimTurma
            ),
          ],
        ],
        valeNota: [
          {
            value: this.permiteNota ? (atividade?.valeNota ?? false) : false,
            disabled: !this.permiteNota,
          },
        ],
        notaMaxima: [
          atividade?.notaMaxima || '',
          [Validators.pattern(/^\d{1,5}(\.\d{1,2})?$/)],
        ],
      },
      {
        validators: [this.validadorDatasAtividade, this.validadorNotaMaxima],
      }
    );

    // Ajustar obrigatoriedade de notaMaxima ao alterar valeNota
    this.form.get('valeNota')?.valueChanges.subscribe((valeNota) => {
      const notaControl = this.form.get('notaMaxima');
      if (valeNota) {
        notaControl?.setValidators([
          Validators.required,
          Validators.pattern(/^\d{1,5}(\.\d{1,2})?$/),
        ]);
      } else {
        notaControl?.clearValidators();
        notaControl?.setValue('');
      }
      notaControl?.updateValueAndValidity();
    });

    if (atividade?.valeNota) {
      this.form
        .get('notaMaxima')
        ?.setValidators([
          Validators.required,
          Validators.pattern(/^\d{1,5}(\.\d{1,2})?$/),
        ]);
      this.form.get('notaMaxima')?.updateValueAndValidity();
    }
  }

  private validadorDatasAtividade(form: AbstractControl): ValidationErrors | null {
    const dataAtribuicao = form.get('dataAtribuicao')?.value;
    const prazoEntrega = form.get('prazoEntrega')?.value;

    if (!dataAtribuicao || !prazoEntrega) return null;

    const dataAtribStr = converterParaIsoDate(dataAtribuicao);
    const prazoStr = converterParaIsoDate(prazoEntrega);

    if (dataAtribStr && prazoStr && prazoStr < dataAtribStr) {
      return { prazoAnteriorAtribuicao: true };
    }

    return null;
  }

  private validadorNotaMaxima(form: AbstractControl): ValidationErrors | null {
    const valeNota = form.get('valeNota')?.value;
    const notaMaxima = form.get('notaMaxima')?.value;

    if (valeNota) {
      if (!notaMaxima || Number(notaMaxima) <= 0) {
        return { notaMaximaInvalida: true };
      }
    }

    return null;
  }

  private criarValidadorPeriodoTurma(dataInicio?: string, dataFim?: string) {
    const inicioStr = converterParaIsoDate(dataInicio);
    const fimStr = converterParaIsoDate(dataFim);

    return (control: AbstractControl): ValidationErrors | null => {
      const valor = control.value;
      if (!valor) return null;

      const dataStr = converterParaIsoDate(valor);
      if (!dataStr) return null;

      if (inicioStr && dataStr < inicioStr) {
        return { matDatepickerMin: true };
      }

      if (fimStr && dataStr > fimStr) {
        return { matDatepickerMax: true };
      }

      return null;
    };
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.salvando.set(true);
    const formRaw = this.form.getRawValue();

    const dataAtribuicaoFormatada = converterParaIsoDate(formRaw.dataAtribuicao);
    const prazoEntregaFormatado = converterParaIsoDate(formRaw.prazoEntrega);

    const valeNota = this.permiteNota ? !!formRaw.valeNota : false;
    const notaMaxima = valeNota && formRaw.notaMaxima ? String(formRaw.notaMaxima) : null;

    if (this.ehEdicao && this.data.atividade) {
      const payload: AtualizarTurmaAtividadeDto = {
        titulo: formRaw.titulo?.trim(),
        descricao: formRaw.descricao?.trim() || null,
        tipoAtividade: formRaw.tipoAtividade,
        dataAtribuicao: dataAtribuicaoFormatada,
        prazoEntrega: prazoEntregaFormatado,
        valeNota,
        notaMaxima,
      };

      this.atividadeService
        .atualizar(this.data.atividade.id, payload)
        .pipe(finalize(() => this.salvando.set(false)))
        .subscribe({
          next: () => {
            this.notificacao.sucesso('Atividade atualizada com sucesso!');
            this.dialogRef.close(true);
          },
          error: (erro) => this.tratarErroRequisicao(erro, 'atualizar'),
        });
    } else {
      const payload: CriarTurmaAtividadeDto = {
        turmaId: this.data.turmaId,
        titulo: formRaw.titulo?.trim(),
        descricao: formRaw.descricao?.trim() || null,
        tipoAtividade: formRaw.tipoAtividade,
        dataAtribuicao: dataAtribuicaoFormatada,
        prazoEntrega: prazoEntregaFormatado,
        valeNota,
        notaMaxima,
      };

      this.atividadeService
        .criar(payload)
        .pipe(finalize(() => this.salvando.set(false)))
        .subscribe({
          next: () => {
            this.notificacao.sucesso('Atividade cadastrada com sucesso!');
            this.dialogRef.close(true);
          },
          error: (erro) => this.tratarErroRequisicao(erro, 'cadastrar'),
        });
    }
  }

  private tratarErroRequisicao(erro: any, acao: 'cadastrar' | 'atualizar'): void {
    console.error(`Erro ao ${acao} atividade:`, erro);

    if (erro?.status === 400) {
      this.notificacao.erro(
        'Inconsistência nos dados da atividade. Verifique as datas e os critérios de nota e tente novamente.'
      );
      return;
    }

    this.notificacao.erro(`Erro ao ${acao} a atividade. Tente novamente.`);
  }
}
