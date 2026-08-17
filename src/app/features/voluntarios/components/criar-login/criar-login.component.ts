import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { Voluntario, VoluntarioResumo } from '../../../../core/models/voluntario.model';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { NotificacaoService } from '../../../../core/services/notificacao.service';
import {
  LoginFormComponent,
  LoginFormSubmit,
} from '../../../../shared/components/formularios/login-form/login-form.component';

interface CreateLoginDialogData {
  voluntario: Voluntario | VoluntarioResumo;
}

@Component({
  selector: 'app-criar-login',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    LoginFormComponent,
  ],
  templateUrl: './criar-login.component.html',
  styleUrl: './criar-login.component.scss',
})
export class CriarLoginComponent {
  private usuarioService = inject(UsuarioService);
  private dialogRef = inject(MatDialogRef<CriarLoginComponent>);
  private notificacao = inject(NotificacaoService);

  dados = inject<CreateLoginDialogData>(MAT_DIALOG_DATA);
  estaSalvando = signal(false);

  aoSubmeter(dadosLogin: LoginFormSubmit): void {
    this.estaSalvando.set(true);

    const payload = {
      voluntarioId: this.dados.voluntario.id,
      email: dadosLogin.email,
      senha: dadosLogin.senha,
    };

    this.usuarioService.create(payload).subscribe({
      next: () => {
        this.notificacao.sucesso('Login criado com sucesso!');
        this.dialogRef.close(true);
      },
      error: (err) => {
        const mensagem =
          err.error?.message || 'Erro ao criar login. Verifique o e-mail.';
        this.notificacao.erro(mensagem);
        this.estaSalvando.set(false);
      },
    });
  }

  aoCancelar(): void {
    this.dialogRef.close(false);
  }
}
