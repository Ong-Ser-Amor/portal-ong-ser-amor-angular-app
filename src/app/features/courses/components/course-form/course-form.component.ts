import { ButtonComponent } from './../../../../shared/components/button/button.component';
import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { CourseService } from '../../../../core/services/course.service';
import { Course } from '../../../../core/models/course.model';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { InputComponent } from '../../../../shared/components/input/input.component';

@Component({
  selector: 'app-course-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressBarModule,
    ButtonComponent,
    InputComponent,
  ],
  templateUrl: './course-form.component.html',
  styleUrl: './course-form.component.scss',
})
export class CourseFormComponent {
  private fb = inject(FormBuilder);
  private courseService = inject(CourseService);
  private dialogRef = inject(MatDialogRef<CourseFormComponent>);
  private snackBar = inject(MatSnackBar);

  data = inject<Course>(MAT_DIALOG_DATA);

  form!: FormGroup;
  isEditMode = false;

  isSaving = signal(false);

  ngOnInit(): void {
    // Verifica se estamos editando
    this.isEditMode = !!this.data;

    this.form = this.fb.group({
      name: [
        this.data?.name || '',
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

    const courseData = this.form.value;

    const request$ = this.isEditMode
      ? this.courseService.update(this.data.id, courseData)
      : this.courseService.create(courseData);

    request$.subscribe({
      next: () => {
        this.snackBar.open(
          this.isEditMode ? 'Curso atualizado!' : 'Curso criado!',
          'Fechar',
          { duration: 3000 }
        );
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error(err);
        this.snackBar.open('Erro ao salvar.', 'Fechar');

        this.isSaving.set(false);
      },
    });
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}
