import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs';

import { ModalComponent } from '../../../../../shared/components/ui/modal/modal.component';
import { InputComponent } from '../../../../../shared/components/ui/input/input.component';
import { SelectComponent } from '../../../../../shared/components/ui/select/select.component';
import { DateInputComponent } from '../../../../../shared/components/ui/date-input/date-input.component';
import { AulaService } from '../../../../../core/services/aula.service';
import { NotificacaoService } from '../../../../../core/services/notificacao.service';
import {
  AtualizarAulaDto,
  Aula,
  CriarAulaDto,
  OPCOES_STATUS_AULA,
} from '../../../../../core/models/aula.model';

export interface DadosModalAula {
  turmaId: string;
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

  readonly opcoesStatusAula = OPCOES_STATUS_AULA;

  ngOnInit(): void {
    this.ehEdicao = !!this.data?.aula;
    const aula = this.data?.aula;

    this.form = this.fb.group({
      data: [
        aula?.data ? aula.data.split('T')[0] : '',
        [Validators.required],
      ],
      tema: [
        aula?.tema || '',
        [Validators.required, Validators.minLength(3), Validators.maxLength(255)],
      ],
      status: [
        aula?.status || 'AGENDADA',
        [Validators.required],
      ],
    });
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
          error: (erro) => {
            console.error('Erro ao atualizar aula:', erro);
            this.notificacao.erro('Erro ao atualizar a aula. Tente novamente.');
          },
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
          error: (erro) => {
            console.error('Erro ao cadastrar aula:', erro);
            this.notificacao.erro('Erro ao cadastrar a aula. Tente novamente.');
          },
        });
    }
  }
}
