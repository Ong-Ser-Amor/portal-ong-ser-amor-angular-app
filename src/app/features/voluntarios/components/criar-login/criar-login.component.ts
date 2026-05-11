import { Component, inject, OnInit, signal } from '@angular/core';
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
import { UsuarioService } from '../../../../core/services/usuario.service';
import { Voluntario } from '../../../../core/models/voluntario.model';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CommonModule } from '@angular/common';
import { InputComponent } from '../../../../shared/components/input/input.component';

interface CreateLoginDialogData {
  voluntario: Voluntario;
}

@Component({
  selector: 'app-criar-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressBarModule,
    ButtonComponent,
    InputComponent,
  ],
  templateUrl: './criar-login.component.html',
  styleUrl: './criar-login.component.scss',
})
export class CriarLoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private usuarioService = inject(UsuarioService);
  private dialogRef = inject(MatDialogRef<CriarLoginComponent>);
  private snackBar = inject(MatSnackBar);

  dados = inject<CreateLoginDialogData>(MAT_DIALOG_DATA);

  form!: FormGroup;
  estaSalvando = signal(false);

  ngOnInit(): void {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(8)]],
      confirmarSenha: ['', [Validators.required]],
    }, { validators: this.senhasIguaisValidator });
  }

  senhasIguaisValidator(group: FormGroup) {
    const senha = group.get('senha')?.value;
    const confirmarSenha = group.get('confirmarSenha')?.value;

    if (senha && confirmarSenha && senha !== confirmarSenha) {
      group.get('confirmarSenha')?.setErrors({ senhasNaoIguais: true });
      return { senhasNaoIguais: true };
    }

    if (confirmarSenha) {
      group.get('confirmarSenha')?.setErrors(null);
    }

    return null;
  }

  aoSubmeter() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.estaSalvando.set(true);

    const formValue = this.form.value;
    const payload = {
      voluntarioId: this.dados.voluntario.id,
      email: formValue.email,
      senha: formValue.senha,
    };

    this.usuarioService.create(payload).subscribe({
      next: () => {
        this.snackBar.open('Login criado com sucesso!', 'Fechar', {
          duration: 3000,
        });
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error(err);
        const mensagem =
          err.error?.message || 'Erro ao criar login. Verifique o e-mail.';
        this.snackBar.open(mensagem, 'Fechar');
        this.estaSalvando.set(false);
      },
    });
  }

  aoCancelar() {
    this.dialogRef.close(false);
  }
}
