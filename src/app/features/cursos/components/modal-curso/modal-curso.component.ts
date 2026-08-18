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

import { ModalComponent } from '../../../../shared/components/ui/modal/modal.component';
import { InputComponent } from '../../../../shared/components/ui/input/input.component';
import { Curso } from '../../../../core/models/curso.model';
import { CursoService } from '../../../../core/services/curso.service';
import { NotificacaoService } from '../../../../core/services/notificacao.service';

@Component({
  selector: 'app-modal-curso',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalComponent,
    InputComponent,
  ],
  templateUrl: './modal-curso.component.html',
  styleUrl: './modal-curso.component.scss',
})
export class ModalCursoComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly cursoService = inject(CursoService);
  private readonly dialogRef = inject(MatDialogRef<ModalCursoComponent>);
  private readonly notificacao = inject(NotificacaoService);

  readonly data = inject<Curso | null>(MAT_DIALOG_DATA);

  form!: FormGroup;
  ehEdicao = false;
  salvando = signal<boolean>(false);

  ngOnInit(): void {
    this.ehEdicao = !!this.data;

    this.form = this.fb.group({
      nome: [
        this.data?.nome || '',
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
    const dadosCurso = this.form.value;

    const request$ = this.ehEdicao && this.data
      ? this.cursoService.atualizar(this.data.id, dadosCurso)
      : this.cursoService.criar(dadosCurso);

    request$
      .pipe(finalize(() => this.salvando.set(false)))
      .subscribe({
        next: () => {
          this.notificacao.sucesso(
            this.ehEdicao ? 'Curso atualizado com sucesso!' : 'Curso criado com sucesso!'
          );
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error('Erro ao salvar curso:', err);
          const msg = err?.error?.message || 'Erro ao salvar curso.';
          this.notificacao.erro(msg);
        },
      });
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }
}
