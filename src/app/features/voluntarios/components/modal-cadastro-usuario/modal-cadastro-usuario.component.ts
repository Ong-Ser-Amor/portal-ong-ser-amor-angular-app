import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';
import { finalize } from 'rxjs';

import { ModalComponent } from '../../../../shared/components/ui/modal/modal.component';
import { InputComponent } from '../../../../shared/components/ui/input/input.component';
import { SelectComponent } from '../../../../shared/components/ui/select/select.component';
import { Voluntario, VoluntarioResumo } from '../../../../core/models/voluntario.model';
import { OPCOES_PERFIL_ACESSO, PERFIL_ACESSO, PerfilAcesso } from '../../../../core/models/usuario.model';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { NotificacaoService } from '../../../../core/services/notificacao.service';

export interface DadosModalCadastroUsuario {
  voluntario: Voluntario | VoluntarioResumo;
}

@Component({
  selector: 'app-modal-cadastro-usuario',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalComponent,
    InputComponent,
    SelectComponent,
  ],
  templateUrl: './modal-cadastro-usuario.component.html',
  styleUrl: './modal-cadastro-usuario.component.scss',
})
export class ModalCadastroUsuarioComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly usuarioService = inject(UsuarioService);
  private readonly dialogRef = inject(MatDialogRef<ModalCadastroUsuarioComponent>);
  private readonly notificacao = inject(NotificacaoService);

  readonly dados = inject<DadosModalCadastroUsuario>(MAT_DIALOG_DATA);
  readonly opcoesPerfisAcesso = OPCOES_PERFIL_ACESSO;

  form!: FormGroup;
  salvando = signal<boolean>(false);

  ngOnInit(): void {
    this.form = this.fb.group(
      {
        email: ['', [Validators.required, Validators.email]],
        perfisAcesso: [this.obterPerfisIniciais(), [Validators.required]],
        senha: ['', [Validators.required, Validators.minLength(8)]],
        confirmarSenha: ['', [Validators.required]],
      },
      { validators: this.senhasIguaisValidator }
    );
  }

  private obterPerfisIniciais(): PerfilAcesso[] {
    const tipo = this.dados.voluntario?.tipoVoluntario;
    if (tipo === 'COORDENADOR_CURSOS') {
      return [PERFIL_ACESSO.COORDENADOR_CURSOS];
    }
    if (tipo === 'PROFESSOR') {
      return [PERFIL_ACESSO.PROFESSOR];
    }
    return [PERFIL_ACESSO.PROFESSOR];
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.salvando.set(true);

    const { email, senha, perfisAcesso } = this.form.getRawValue();

    this.usuarioService
      .criar({
        voluntarioId: this.dados.voluntario.id,
        email: email ?? '',
        senha: senha ?? '',
        perfisAcesso: perfisAcesso ?? [],
      })
      .pipe(finalize(() => this.salvando.set(false)))
      .subscribe({
        next: () => {
          this.notificacao.sucesso('Usuário criado com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error('Erro ao criar usuário:', err);
          const mensagem =
            err?.error?.message || 'Erro ao criar usuário. Verifique os dados informados.';
          this.notificacao.erro(mensagem);
        },
      });
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }

  private senhasIguaisValidator(control: AbstractControl): ValidationErrors | null {
    const senha = control.get('senha')?.value;
    const confirmarSenha = control.get('confirmarSenha')?.value;

    if (senha && confirmarSenha && senha !== confirmarSenha) {
      return { senhasNaoIguais: true };
    }

    return null;
  }
}
