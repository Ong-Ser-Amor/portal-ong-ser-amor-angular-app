import { Component, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AutenticacaoService } from '../../../core/services/autenticacao.service';
import { LoginRequisicao } from '../../../core/models/autenticacao.models';
import { Router } from '@angular/router';
import { BotaoComponent } from '../../../shared/components/ui/botao/botao.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { InputComponent } from '../../../shared/components/ui/input/input.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    MatCardModule,
    ReactiveFormsModule,
    BotaoComponent,
    InputComponent,
    MatFormFieldModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private autenticacaoService = inject(AutenticacaoService);
  private router = inject(Router);
  estaCarregando = false;
  erroLogin = signal(false);

  formularioLogin: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required, Validators.minLength(6)]],
  });

  login() {
    if (this.formularioLogin.invalid) {
      this.formularioLogin.markAllAsTouched();
      return;
    }

    this.estaCarregando = true;
    this.erroLogin.set(false);

    const dadosLogin = this.formularioLogin.value as LoginRequisicao;

    this.autenticacaoService.login(dadosLogin).subscribe({
      next: () => {
        this.estaCarregando = false;
        this.router.navigate(['/']);
      },
      error: (erro) => {
        this.estaCarregando = false;
        this.erroLogin.set(true);
        console.error(erro);
      },
    });
  }
}
