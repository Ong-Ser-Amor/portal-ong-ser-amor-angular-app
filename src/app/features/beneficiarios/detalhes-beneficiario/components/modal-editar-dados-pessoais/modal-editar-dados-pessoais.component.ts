import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';

import { BotaoComponent } from '../../../../../shared/components/botao/botao.component';
import { InputComponent } from '../../../../../shared/components/input/input.component';
import { SelectComponent } from '../../../../../shared/components/select/select.component';
import { CheckboxComponent } from '../../../../../shared/components/checkbox/checkbox.component';
import { FormularioDadosPessoaisComponent } from '../../../../../shared/components/formulario-dados-pessoais/formulario-dados-pessoais.component';
import { ModalComponent } from '../../../../../shared/components/modal/modal.component';
import { formatarCpf } from '../../../../../shared/utils/cpf.utils';
import { calcularIdade, converterParaIsoDate } from '../../../../../shared/utils/data.utils';

import { BeneficiarioService } from '../../../../../core/services/beneficiario.service';
import {
  AtualizarBeneficiarioDto,
  Beneficiario,
  EstadoCivil,
  NivelEscolaridade,
  OPCOES_ESTADO_CIVIL,
  OPCOES_NIVEL_ESCOLARIDADE,
  OPCOES_VINCULO_EMPREGATICIO,
  VinculoEmpregaticio,
} from '../../../../../core/models/beneficiario.model';

@Component({
  selector: 'app-modal-editar-dados-pessoais',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatSnackBarModule,
    InputComponent,
    SelectComponent,
    CheckboxComponent,
    FormularioDadosPessoaisComponent,
    ModalComponent,
  ],
  templateUrl: './modal-editar-dados-pessoais.component.html',
  styleUrl: './modal-editar-dados-pessoais.component.scss',
})
export class ModalEditarDadosPessoaisComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<ModalEditarDadosPessoaisComponent>);
  private readonly snackBar = inject(MatSnackBar);
  private readonly beneficiarioService = inject(BeneficiarioService);

  readonly data = inject<{ beneficiario: Beneficiario }>(MAT_DIALOG_DATA);

  readonly niveisEscolaridade = OPCOES_NIVEL_ESCOLARIDADE;
  readonly estadosCivis = OPCOES_ESTADO_CIVIL;
  readonly vinculosEmpregaticios = OPCOES_VINCULO_EMPREGATICIO;

  salvando = signal<boolean>(false);

  form!: FormGroup;

  ngOnInit(): void {
    const b = this.data.beneficiario;
    const dataNascimentoOriginal = b.pessoa.dataNascimento
      ? (b.pessoa.dataNascimento.includes('T') ? b.pessoa.dataNascimento.split('T')[0] : b.pessoa.dataNascimento)
      : '';

    this.form = this.fb.group({
      pessoa: this.fb.group({
        nome: [b.pessoa.nome, [Validators.required]],
        cpf: [formatarCpf(b.pessoa.cpf), [Validators.required]],
        dataNascimento: [dataNascimentoOriginal, [Validators.required]],
      }),
      nivelEscolaridade: [b.nivelEscolaridade as NivelEscolaridade, [Validators.required]],
      estadoCivil: [b.estadoCivil as EstadoCivil || ''],
      vinculoEmpregaticio: [b.vinculoEmpregaticio as VinculoEmpregaticio || ''],
      quantidadeFilhos: [b.quantidadeFilhos ?? null],
      emancipado: [b.pessoa.emancipado ?? false],
      podeSairSozinho: [b.pessoa.podeSairSozinho ?? false],
    });

    this.formPessoa.get('dataNascimento')?.valueChanges.subscribe(() => {
      this.atualizarValidacoesPorIdade();
    });

    this.atualizarValidacoesPorIdade();
  }

  get formPessoa(): FormGroup {
    return this.form.get('pessoa') as FormGroup;
  }

  get idadeAtual(): number | null {
    const dataNasc = this.formPessoa.get('dataNascimento')?.value;
    return calcularIdade(dataNasc);
  }

  get podeSerEmancipado(): boolean {
    const idade = this.idadeAtual;
    return idade !== null && idade >= 16 && idade < 18;
  }

  get ehMenorNaoEmancipado(): boolean {
    const idade = this.idadeAtual;
    const emancipado = !!this.form.get('emancipado')?.value;
    return idade !== null && idade < 18 && !emancipado;
  }

  atualizarValidacoesPorIdade(): void {
    if (!this.podeSerEmancipado) {
      this.form.get('emancipado')?.setValue(false, { emitEvent: false });
    }
  }

  fechar(): void {
    this.dialogRef.close();
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const dadosFormulario = this.form.value;

    const dto: AtualizarBeneficiarioDto = {
      nome: dadosFormulario.pessoa.nome,
      cpf: (dadosFormulario.pessoa.cpf || '').replace(/\D/g, ''),
      dataNascimento: converterParaIsoDate(dadosFormulario.pessoa.dataNascimento),
      nivelEscolaridade: dadosFormulario.nivelEscolaridade,
      estadoCivil: dadosFormulario.estadoCivil || undefined,
      vinculoEmpregaticio: dadosFormulario.vinculoEmpregaticio || undefined,
      quantidadeFilhos: dadosFormulario.quantidadeFilhos !== null && dadosFormulario.quantidadeFilhos !== '' ? Number(dadosFormulario.quantidadeFilhos) : undefined,
      emancipado: dadosFormulario.emancipado ?? undefined,
      podeSairSozinho: this.ehMenorNaoEmancipado ? Boolean(dadosFormulario.podeSairSozinho) : undefined,
    };

    this.salvando.set(true);
    this.beneficiarioService
      .atualizar(this.data.beneficiario.id, dto)
      .pipe(finalize(() => this.salvando.set(false)))
      .subscribe({
        next: (beneficiarioAtualizado) => {
          this.snackBar.open('Dados pessoais atualizados com sucesso!', 'Fechar', { duration: 3000 });
          this.dialogRef.close(beneficiarioAtualizado);
        },
        error: (err) => {
          console.error('Erro ao atualizar dados pessoais:', err);
          const msg = err.error?.message || 'Erro ao atualizar dados pessoais.';
          this.snackBar.open(msg, 'Fechar', { duration: 4000 });
        },
      });
  }
}
