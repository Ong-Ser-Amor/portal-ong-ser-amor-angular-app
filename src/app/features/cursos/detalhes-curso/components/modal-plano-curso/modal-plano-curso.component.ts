import { Component, inject, OnInit, signal } from '@angular/core';
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
import { PlanoCursoService } from '../../../../../core/services/plano-curso.service';
import { NotificacaoService } from '../../../../../core/services/notificacao.service';
import { PlanoCurso } from '../../../../../core/models/plano-curso.model';

export interface DadosModalPlanoCurso {
  cursoId: string;
  plano?: PlanoCurso | null;
}

@Component({
  selector: 'app-modal-plano-curso',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalComponent,
    InputComponent,
  ],
  templateUrl: './modal-plano-curso.component.html',
  styleUrl: './modal-plano-curso.component.scss',
})
export class ModalPlanoCursoComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly planoCursoService = inject(PlanoCursoService);
  private readonly dialogRef = inject(MatDialogRef<ModalPlanoCursoComponent>);
  private readonly notificacao = inject(NotificacaoService);

  readonly data = inject<DadosModalPlanoCurso>(MAT_DIALOG_DATA);

  form!: FormGroup;
  ehEdicao = false;
  salvando = signal<boolean>(false);

  ngOnInit(): void {
    this.ehEdicao = !!this.data?.plano;

    this.form = this.fb.group({
      nome: [
        this.data?.plano?.nome || '',
        [Validators.required, Validators.minLength(3), Validators.maxLength(100)],
      ],
    });
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.salvando.set(true);
    const nome = this.form.value.nome;

    const request$ = this.ehEdicao && this.data.plano
      ? this.planoCursoService.atualizar(this.data.plano.id, { nome })
      : this.planoCursoService.criar({
          nome,
          cursoId: this.data.cursoId.toString(),
        });

    request$
      .pipe(finalize(() => this.salvando.set(false)))
      .subscribe({
        next: () => {
          this.notificacao.sucesso(
            this.ehEdicao
              ? 'Plano de curso atualizado com sucesso!'
              : 'Plano de curso criado com sucesso!'
          );
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error('Erro ao salvar plano de curso:', err);
          const msg = err?.error?.message || 'Erro ao salvar plano de curso.';
          this.notificacao.erro(msg);
        },
      });
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }
}
