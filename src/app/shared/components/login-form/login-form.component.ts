import { Component, input, output, inject } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { InputComponent } from '../input/input.component';
import { ButtonComponent } from '../button/button.component';

export interface LoginFormSubmit {
  email: string;
  senha: string;
}

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputComponent, ButtonComponent],
  templateUrl: './login-form.component.html',
  styleUrl: './login-form.component.scss',
})
export class LoginFormComponent {
  private fb = inject(FormBuilder);

  nomePessoa = input.required<string>();
  carregando = input<boolean>(false);

  submitLogin = output<LoginFormSubmit>();
  cancel = output<void>();

  form = this.fb.group(
    {
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(8)]],
      confirmarSenha: ['', [Validators.required]],
    },
    { validators: this.senhasIguaisValidator },
  );

  aoSubmeter(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, senha } = this.form.getRawValue();
    this.submitLogin.emit({ email: email ?? '', senha: senha ?? '' });
  }

  aoCancelar(): void {
    this.cancel.emit();
  }

  senhasIguaisValidator(control: AbstractControl): ValidationErrors | null {
    const senha = control.get('senha')?.value;
    const confirmarSenha = control.get('confirmarSenha')?.value;

    if (senha && confirmarSenha && senha !== confirmarSenha) {
      return { senhasNaoIguais: true };
    }

    return null; // O erro desaparece automaticamente quando as senhas coincidem
  }
}
