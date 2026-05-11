import { MatCheckboxModule } from '@angular/material/checkbox';
import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { VoluntarioService } from '../../../../core/services/voluntario.service';
import { PessoaService } from '../../../../core/services/pessoa.service';
import {
  CriarVoluntarioComNovaPessoaDto,
  CriarVoluntarioComPessoaExistenteDto,
  CriarVoluntarioDto,
  AtualizarVoluntarioDto,
  NivelFormacao,
  TipoVoluntario,
  Voluntario,
} from '../../../../core/models/voluntario.model';
import { PessoaResposta } from '../../../../core/models/pessoa.model';

@Component({
  selector: 'app-voluntario-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCheckboxModule,
    ButtonComponent,
    InputComponent,
  ],
  templateUrl: './voluntario-form.component.html',
  styleUrl: './voluntario-form.component.scss',
})
export class VoluntarioFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private voluntarioService = inject(VoluntarioService);
  private pessoaService = inject(PessoaService);
  private dialogRef = inject(MatDialogRef<VoluntarioFormComponent>);
  private snackBar = inject(MatSnackBar);

  dados = inject<Voluntario | null>(MAT_DIALOG_DATA);

  form!: FormGroup;
  modoEdicao = false;
  estaSalvando = signal(false);
  buscandoPessoa = signal(false);
  pessoaEncontrada = signal<PessoaResposta | null>(null);
  modoPessoaExistente = signal(false);

  tiposVoluntario: TipoVoluntario[] = ['COORDENADOR', 'PROFESSOR', 'GERAL'];
  niveis: NivelFormacao[] = ['COMPLETO', 'CURSANDO', 'INCOMPLETO'];

  ngOnInit(): void {
    this.modoEdicao = !!this.dados;

    this.form = this.fb.group({
      nome: [
        this.dados?.pessoa?.nome || '',
        [Validators.required, Validators.minLength(3)],
      ],
      cpf: [
        this.dados?.pessoa?.cpf || '',
        [Validators.required, Validators.pattern(/^\d{11}$/)],
      ],
      dataNascimento: [
        this.dados?.pessoa?.dataNascimento || '',
        [Validators.required],
      ],
      formacaoAcademica: [
        this.dados?.formacaoAcademica || '',
        [Validators.minLength(2)],
      ],
      statusFormacao: [this.dados?.statusFormacao || '', []],
      tipoVoluntario: [this.dados?.tipoVoluntario || '', [Validators.required]],
      criarLogin: [false],
    });

    if (this.modoEdicao) {
      this.form.get('criarLogin')?.disable();
      // Em modo edição, dados da pessoa são somente leitura
      this.pessoaEncontrada.set(this.dados?.pessoa || null);
      this.modoPessoaExistente.set(true);
      this.form.get('nome')?.disable({ emitEvent: false });
      this.form.get('cpf')?.disable({ emitEvent: false });
      this.form.get('dataNascimento')?.disable({ emitEvent: false });
    }
  }

  buscarPessoaPorCpf() {
    if (this.modoEdicao) {
      return;
    }

    const cpf = `${this.form.get('cpf')?.value || ''}`.replace(/\D/g, '');

    if (cpf.length !== 11) {
      return;
    }

    this.buscandoPessoa.set(true);

    this.pessoaService.buscarPorCpf(cpf).subscribe({
      next: (pessoa) => {
        this.pessoaEncontrada.set(pessoa);
        this.modoPessoaExistente.set(true);

        this.form.patchValue(
          {
            nome: pessoa.nome,
            cpf: pessoa.cpf,
            dataNascimento: pessoa.dataNascimento,
          },
          { emitEvent: false },
        );

        this.form.get('nome')?.clearValidators();
        this.form.get('cpf')?.clearValidators();
        this.form.get('dataNascimento')?.clearValidators();
        this.form.get('nome')?.disable({ emitEvent: false });
        this.form.get('cpf')?.disable({ emitEvent: false });
        this.form.get('dataNascimento')?.disable({ emitEvent: false });
        this.form.get('nome')?.updateValueAndValidity({ emitEvent: false });
        this.form.get('cpf')?.updateValueAndValidity({ emitEvent: false });
        this.form
          .get('dataNascimento')
          ?.updateValueAndValidity({ emitEvent: false });

        this.buscandoPessoa.set(false);
      },
      error: () => {
        this.buscandoPessoa.set(false);
        this.limparPessoaEncontrada();
      },
    });
  }

  aoSubmeter() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.estaSalvando.set(true);

    const valoresForm = this.form.getRawValue();
    const criarLogin = valoresForm.criarLogin;

    const voluntarioPayload: CriarVoluntarioDto = this.modoPessoaExistente()
      ? ({
          pessoaId: this.pessoaEncontrada()?.id || '',
          tipoVoluntario: valoresForm.tipoVoluntario,
          formacaoAcademica: valoresForm.formacaoAcademica || undefined,
          statusFormacao: valoresForm.statusFormacao || undefined,
        } satisfies CriarVoluntarioComPessoaExistenteDto)
      : ({
          nome: valoresForm.nome,
          cpf: `${valoresForm.cpf || ''}`.replace(/\D/g, ''),
          dataNascimento: valoresForm.dataNascimento,
          tipoVoluntario: valoresForm.tipoVoluntario,
          formacaoAcademica: valoresForm.formacaoAcademica || undefined,
          statusFormacao: valoresForm.statusFormacao || undefined,
        } satisfies CriarVoluntarioComNovaPessoaDto);

    const requisicao$ = this.modoEdicao
      ? this.voluntarioService.update(
          this.dados!.id,
          voluntarioPayload as AtualizarVoluntarioDto,
        )
      : this.voluntarioService.create(voluntarioPayload);

    requisicao$.subscribe({
      next: (voluntario) => {
        this.snackBar.open(
          this.modoEdicao ? 'Voluntário atualizado!' : 'Voluntário criado!',
          'Fechar',
          { duration: 3000 },
        );

        if (criarLogin && !this.modoEdicao) {
          this.dialogRef.close({ sucesso: true, voluntario });
        } else {
          this.dialogRef.close(true);
        }
      },
      error: (err) => {
        console.error(err);
        this.snackBar.open('Erro ao salvar voluntário.', 'Fechar');
        this.estaSalvando.set(false);
      },
    });
  }

  aoCancelar() {
    this.dialogRef.close(false);
  }

  formatarCPF(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');

    if (value.length > 11) {
      value = value.slice(0, 11);
    }

    this.form.patchValue({ cpf: value }, { emitEvent: false });
  }

  aoCpfBlur() {
    this.buscarPessoaPorCpf();
  }

  limparPessoaEncontrada() {
    this.pessoaEncontrada.set(null);
    this.modoPessoaExistente.set(false);

    this.form
      .get('nome')
      ?.setValidators([Validators.required, Validators.minLength(3)]);
    this.form
      .get('cpf')
      ?.setValidators([Validators.required, Validators.pattern(/^\d{11}$/)]);
    this.form.get('dataNascimento')?.setValidators([Validators.required]);

    this.form.get('nome')?.enable({ emitEvent: false });
    this.form.get('cpf')?.enable({ emitEvent: false });
    this.form.get('dataNascimento')?.enable({ emitEvent: false });

    this.form.get('nome')?.updateValueAndValidity({ emitEvent: false });
    this.form.get('cpf')?.updateValueAndValidity({ emitEvent: false });
    this.form
      .get('dataNascimento')
      ?.updateValueAndValidity({ emitEvent: false });
  }
}
