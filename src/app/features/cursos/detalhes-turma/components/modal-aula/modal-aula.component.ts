import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs';

import { ModalComponent } from '../../../../../shared/components/ui/modal/modal.component';
import { InputComponent } from '../../../../../shared/components/ui/input/input.component';
import { SelectComponent } from '../../../../../shared/components/ui/select/select.component';
import { DateInputComponent, DateInputErrorMessages } from '../../../../../shared/components/ui/date-input/date-input.component';
import { AulaService } from '../../../../../core/services/aula.service';
import { NotificacaoService } from '../../../../../core/services/notificacao.service';
import {
  AtualizarAulaDto,
  Aula,
  CriarAulaDto,
  OPCOES_STATUS_EDICAO_AULA,
  StatusAula,
} from '../../../../../core/models/aula.model';
import { OpcaoSelect } from '../../../../../core/models/opcao-select.model';

export interface DadosModalAula {
  turmaId: string;
  dataInicioTurma?: string;
  dataFimTurma?: string;
  aula?: Aula | null;
}

@Component({
  selector: 'app-modal-aula',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalComponent,
    InputComponent,
    SelectComponent,
    DateInputComponent,
  ],
  templateUrl: './modal-aula.component.html',
  styleUrl: './modal-aula.component.scss',
})
export class ModalAulaComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly aulaService = inject(AulaService);
  private readonly dialogRef = inject(MatDialogRef<ModalAulaComponent>);
  private readonly notificacao = inject(NotificacaoService);

  readonly data = inject<DadosModalAula>(MAT_DIALOG_DATA);

  form!: FormGroup;
  ehEdicao = false;
  salvando = signal<boolean>(false);

  get opcoesStatusAula(): OpcaoSelect<StatusAula>[] {
    if (this.data?.aula?.status === 'REALIZADA') {
      return [{ valor: 'REALIZADA', rotulo: 'Realizada' }];
    }
    return OPCOES_STATUS_EDICAO_AULA;
  }

  readonly mensagensErroData: DateInputErrorMessages = {
    matDatepickerMin: 'Data anterior ao início da turma',
    matDatepickerMax: 'Data posterior ao término da turma',
    dataDuplicada: 'Já existe uma aula cadastrada nesta data',
  };

  ngOnInit(): void {
    this.ehEdicao = !!this.data?.aula;
    const aula = this.data?.aula;

    this.form = this.fb.group({
      data: [
        aula?.data ? aula.data.split('T')[0] : '',
        [
          Validators.required,
          this.criarValidadorPeriodoTurma(
            this.data?.dataInicioTurma,
            this.data?.dataFimTurma
          ),
        ],
      ],
      tema: [
        aula?.tema || '',
        [Validators.required, Validators.minLength(3), Validators.maxLength(255)],
      ],
      status: [
        {
          value: aula?.status || 'AGENDADA',
          disabled: aula?.status === 'REALIZADA',
        },
        [Validators.required],
      ],
    });
  }

  private criarValidadorPeriodoTurma(dataInicio?: string, dataFim?: string) {
    const inicioStr = dataInicio ? (dataInicio.includes('T') ? dataInicio.split('T')[0] : dataInicio) : '';
    const fimStr = dataFim ? (dataFim.includes('T') ? dataFim.split('T')[0] : dataFim) : '';

    return (control: AbstractControl): ValidationErrors | null => {
      const valor = control.value;
      if (!valor) return null;

      let dataStr = '';
      if (typeof valor === 'string') {
        dataStr = valor.includes('T') ? valor.split('T')[0] : valor;
      } else if (valor instanceof Date && !isNaN(valor.getTime())) {
        const y = valor.getFullYear();
        const m = String(valor.getMonth() + 1).padStart(2, '0');
        const d = String(valor.getDate()).padStart(2, '0');
        dataStr = `${y}-${m}-${d}`;
      }

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

    const dataFormatada =
      typeof formRaw.data === 'string'
        ? formRaw.data
        : formRaw.data instanceof Date
          ? formRaw.data.toISOString().split('T')[0]
          : '';

    if (this.ehEdicao && this.data.aula) {
      const payload: AtualizarAulaDto = {
        data: dataFormatada,
        tema: formRaw.tema?.trim(),
        status: formRaw.status,
      };

      this.aulaService
        .atualizar(this.data.aula.id, payload)
        .pipe(finalize(() => this.salvando.set(false)))
        .subscribe({
          next: () => {
            this.notificacao.sucesso('Aula atualizada com sucesso!');
            this.dialogRef.close(true);
          },
          error: (erro) => this.tratarErroRequisicao(erro, 'atualizar'),
        });
    } else {
      const payload: CriarAulaDto = {
        turmaId: this.data.turmaId,
        data: dataFormatada,
        tema: formRaw.tema?.trim(),
      };

      this.aulaService
        .criar(payload)
        .pipe(finalize(() => this.salvando.set(false)))
        .subscribe({
          next: () => {
            this.notificacao.sucesso('Aula cadastrada com sucesso!');
            this.dialogRef.close(true);
          },
          error: (erro) => this.tratarErroRequisicao(erro, 'cadastrar'),
        });
    }
  }

  private tratarErroRequisicao(erro: any, acao: 'cadastrar' | 'atualizar'): void {
    console.error(`Erro ao ${acao} aula:`, erro);

    // 409 Conflict - Duplicidade de data na mesma turma
    if (erro?.status === 409) {
      this.form.get('data')?.setErrors({ dataDuplicada: true });
      this.notificacao.erro(
        'Já existe uma aula cadastrada nesta mesma data para esta turma.'
      );
      return;
    }

    // 400 Bad Request - Regras de negócio documentadas da API
    if (erro?.status === 400) {
      const codigo = erro?.error?.codigo;

      if (codigo === 'AULA_COM_CHAMADA_NAO_PODE_AGENDAR') {
        this.notificacao.erro(
          'Esta aula já possui registros de presença lançados e não pode retornar ao status de Agendada. Exclua a lista de chamadas da aula primeiro.'
        );
        return;
      }

      if (codigo === 'AULA_COM_CHAMADA_NAO_PODE_CANCELAR') {
        this.notificacao.erro(
          'Não é possível cancelar uma aula que já possui registros de chamada salvos. Exclua a lista de chamadas da aula antes de cancelá-la.'
        );
        return;
      }

      if (codigo === 'AULA_REALIZADA_SEM_CHAMADA') {
        this.notificacao.erro(
          'Não é possível marcar uma aula como Realizada sem antes registrar a chamada dos alunos.'
        );
        return;
      }

      if (codigo === 'AULA_DATA_ANTERIOR_INICIO_TURMA') {
        this.form.get('data')?.setErrors({ matDatepickerMin: true });
        this.notificacao.erro('A data da aula não pode ser anterior à data de início da turma.');
        return;
      }

      if (codigo === 'AULA_DATA_POSTERIOR_FIM_TURMA') {
        this.form.get('data')?.setErrors({ matDatepickerMax: true });
        this.notificacao.erro('A data da aula não pode ser posterior ao encerramento da turma.');
        return;
      }

      const mensagemApi = erro?.error?.message;
      if (mensagemApi && typeof mensagemApi === 'string') {
        this.notificacao.erro(mensagemApi);
        return;
      }
    }

    this.notificacao.erro(`Erro ao ${acao} a aula. Tente novamente.`);
  }
}
