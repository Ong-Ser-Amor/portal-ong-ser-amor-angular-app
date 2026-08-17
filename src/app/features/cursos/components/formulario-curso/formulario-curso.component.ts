import { BotaoComponent } from '../../../../shared/components/ui/botao/botao.component';
import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { Curso } from '../../../../core/models/curso.model';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { InputComponent } from '../../../../shared/components/ui/input/input.component';
import { CursoService } from '../../../../core/services/curso.service';
import { NotificacaoService } from '../../../../core/services/notificacao.service';

@Component({
  selector: 'app-formulario-curso',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatProgressBarModule,
    BotaoComponent,
    InputComponent,
  ],
  templateUrl: './formulario-curso.component.html',
  styleUrl: './formulario-curso.component.scss',
})
export class CursoFormComponent {
  private fb = inject(FormBuilder);
  private cursoService = inject(CursoService);
  private dialogRef = inject(MatDialogRef<CursoFormComponent>);
  private notificacao = inject(NotificacaoService);

  data = inject<Curso>(MAT_DIALOG_DATA);

  form!: FormGroup;
  isEditMode = false;

  isSaving = signal(false);

  ngOnInit(): void {
    // Verifica se estamos editando
    this.isEditMode = !!this.data;

    this.form = this.fb.group({
      nome: [
        this.data?.nome || '',
        [Validators.required, Validators.minLength(3)],
      ],
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);

    const dadosCurso = this.form.value;

    const request$ = this.isEditMode
      ? this.cursoService.update(this.data.id, dadosCurso)
      : this.cursoService.create(dadosCurso);

    request$.subscribe({
      next: () => {
        this.notificacao.sucesso(
          this.isEditMode ? 'Curso atualizado com sucesso!' : 'Curso criado com sucesso!'
        );
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error(err);
        this.notificacao.erro('Erro ao salvar curso.');
        this.isSaving.set(false);
      },
    });
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}
