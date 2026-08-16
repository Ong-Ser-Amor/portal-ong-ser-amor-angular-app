import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Subject, finalize } from 'rxjs';

import { FormularioDadosBeneficiarioComponent } from '../../../../../shared/components/formularios/formulario-dados-beneficiario/formulario-dados-beneficiario.component';
import { ModalComponent } from '../../../../../shared/components/ui/modal/modal.component';
import { AlertaComponent } from '../../../../../shared/components/ui/alerta/alerta.component';
import { calcularIdade, converterParaIsoDate } from '../../../../../shared/utils/data.utils';
import { formatarCpf } from '../../../../../shared/utils/cpf.utils';

import { PessoaFormService } from '../../../../../core/services/pessoa-form.service';
import { BeneficiarioFormService } from '../../../../../core/services/beneficiario-form.service';
import { BeneficiarioService } from '../../../../../core/services/beneficiario.service';
import { PessoaCadastroFacade } from '../../../../../core/services/pessoa-cadastro-facade.service';
import {
  AtualizarBeneficiarioDto,
  Beneficiario,
  OPCOES_ESTADO_CIVIL,
  OPCOES_NIVEL_ESCOLARIDADE,
  OPCOES_VINCULO_EMPREGATICIO,
} from '../../../../../core/models/beneficiario.model';
import { Pessoa } from '../../../../../core/models/pessoa.model';
import { FormularioDadosPessoaComponent } from '../../../../../shared/components/formularios/formulario-dados-pessoa/formulario-dados-pessoa.component';
import { FormularioPermissoesMenorComponent } from '../../../../../shared/components/formularios/formulario-permissoes-menor/formulario-permissoes-menor.component';

export type TipoConflitoCpfBeneficiario = 'OUTRA_PESSOA' | 'OUTRO_BENEFICIARIO_EDICAO';

export interface ConflitoCpfBeneficiarioInfo {
  tipo: TipoConflitoCpfBeneficiario;
}

@Component({
  selector: 'app-modal-edicao-dados-beneficiario',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatIconModule,
    MatProgressBarModule,
    AlertaComponent,
    FormularioDadosPessoaComponent,
    FormularioDadosBeneficiarioComponent,
    FormularioPermissoesMenorComponent,
    ModalComponent,
  ],
  templateUrl: './modal-edicao-dados-beneficiario.component.html',
  styleUrl: './modal-edicao-dados-beneficiario.component.scss',
})
export class ModalEdicaoDadosBeneficiarioComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<ModalEdicaoDadosBeneficiarioComponent>);
  private readonly snackBar = inject(MatSnackBar);
  private readonly beneficiarioService = inject(BeneficiarioService);
  private readonly pessoaFormService = inject(PessoaFormService);
  private readonly beneficiarioFormService = inject(BeneficiarioFormService);
  private readonly pessoaCadastroFacade = inject(PessoaCadastroFacade);

  readonly data = inject<{ beneficiario: Beneficiario }>(MAT_DIALOG_DATA);

  readonly niveisEscolaridade = OPCOES_NIVEL_ESCOLARIDADE;
  readonly estadosCivis = OPCOES_ESTADO_CIVIL;
  readonly vinculosEmpregaticios = OPCOES_VINCULO_EMPREGATICIO;

  private readonly buscaCpfSubject = new Subject<string>();

  salvando = signal<boolean>(false);
  buscandoCpf = signal<boolean>(false);
  cpfOriginal = signal<string>((this.data.beneficiario.pessoa.cpf || '').replace(/\D/g, ''));
  conflitoCpf = signal<ConflitoCpfBeneficiarioInfo | null>(null);

  form!: FormGroup;

  ngOnInit(): void {
    const beneficiario = this.data.beneficiario;

    this.form = this.fb.group({
      pessoa: this.pessoaFormService.criarForm(beneficiario.pessoa),
      ...this.beneficiarioFormService.criarControles(beneficiario),
    });

    this.configurarBuscaCpfReativa();

    this.formPessoa.get('dataNascimento')?.valueChanges.subscribe(() => {
      this.atualizarValidacoesPorIdade();
    });

    this.formPessoa.get('emancipado')?.valueChanges.subscribe(() => {
      this.atualizarValidacoesPorIdade();
    });

    this.atualizarValidacoesPorIdade();
  }

  private configurarBuscaCpfReativa(): void {
    this.formPessoa.get('cpf')?.valueChanges.subscribe((val) => {
      const cpfLimpo = (val || '').replace(/\D/g, '');

      if (cpfLimpo === this.cpfOriginal()) {
        this.conflitoCpf.set(null);
        this.limparErrosConflitoCpf();
        return;
      }

      if (cpfLimpo.length !== 11) {
        this.conflitoCpf.set(null);
        this.limparErrosConflitoCpf();
        return;
      }

      this.buscarDadosPessoa();
    });

    const { estaCarregando } = this.pessoaCadastroFacade.iniciarBuscaCpfReativa({
      cpfSubject: this.buscaCpfSubject,
      buscarApiFn: (cpfLimpo) => this.beneficiarioService.verificarCadastroPorCpf(cpfLimpo),
      getCpfAtualInput: () => this.formPessoa.get('cpf')?.value || '',
      onSucesso: (pessoa) => this.tratarSucessoBuscaPessoa(pessoa),
      onErro: (error) => this.tratarErroBuscaPessoa(error),
    });
    this.buscandoCpf = estaCarregando;
  }

  private adicionarErroCpf(chave: string): void {
    const cpfControl = this.formPessoa.get('cpf');
    cpfControl?.setErrors({
      ...cpfControl.errors,
      [chave]: true,
    });
  }

  private limparErrosConflitoCpf(): void {
    const cpfControl = this.formPessoa.get('cpf');
    if (!cpfControl?.errors) return;

    const errors = { ...cpfControl.errors };
    delete errors['cpfEmUso'];
    delete errors['beneficiarioAtivo'];
    delete errors['voluntarioAtivo'];

    cpfControl.setErrors(Object.keys(errors).length > 0 ? errors : null);
  }

  private tratarSucessoBuscaPessoa(pessoa: Pessoa): void {
    // Na edição, se encontrou outra pessoa com esse CPF, bloqueia a alteração
    this.conflitoCpf.set({ tipo: 'OUTRA_PESSOA' });
    this.adicionarErroCpf('cpfEmUso');
  }

  private tratarErroBuscaPessoa(error: unknown): void {
    const err = error as any;
    if (err?.status === 409) {
      this.conflitoCpf.set({ tipo: 'OUTRO_BENEFICIARIO_EDICAO' });
      this.adicionarErroCpf('cpfEmUso');
    } else {
      // 404: CPF livre para alteração
      this.conflitoCpf.set(null);
      this.limparErrosConflitoCpf();
    }
  }

  buscarDadosPessoa(): void {
    const cpfControl = this.formPessoa.get('cpf');
    const cpfRaw = cpfControl?.value || '';
    const cpfLimpo = cpfRaw.replace(/\D/g, '');

    if (cpfLimpo.length !== 11) {
      this.conflitoCpf.set(null);
      this.limparErrosConflitoCpf();
      return;
    }

    if (cpfLimpo === this.cpfOriginal()) {
      this.conflitoCpf.set(null);
      this.limparErrosConflitoCpf();
      return;
    }

    this.buscaCpfSubject.next(cpfLimpo);
  }

  restaurarCpfOriginal(): void {
    if (this.cpfOriginal()) {
      this.formPessoa.get('cpf')?.setValue(formatarCpf(this.cpfOriginal()));
      this.conflitoCpf.set(null);
      this.limparErrosConflitoCpf();
    }
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
    const emancipado = !!this.formPessoa.get('emancipado')?.value;
    return idade !== null && idade < 18 && !emancipado;
  }

  atualizarValidacoesPorIdade(): void {
    if (!this.podeSerEmancipado) {
      this.formPessoa.get('emancipado')?.setValue(false, { emitEvent: false });
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
    const pessoaValue = dadosFormulario.pessoa;

    const dto: AtualizarBeneficiarioDto = {
      nome: pessoaValue.nome,
      cpf: (pessoaValue.cpf || '').replace(/\D/g, ''),
      dataNascimento: converterParaIsoDate(pessoaValue.dataNascimento),
      nivelEscolaridade: dadosFormulario.nivelEscolaridade,
      estadoCivil: dadosFormulario.estadoCivil || undefined,
      vinculoEmpregaticio: dadosFormulario.vinculoEmpregaticio || undefined,
      quantidadeFilhos:
        dadosFormulario.quantidadeFilhos !== null && dadosFormulario.quantidadeFilhos !== ''
          ? Number(dadosFormulario.quantidadeFilhos)
          : undefined,
      emancipado: pessoaValue.emancipado ?? undefined,
      podeSairSozinho: this.ehMenorNaoEmancipado ? Boolean(pessoaValue.podeSairSozinho) : undefined,
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
          this.snackBar.open('Erro ao atualizar os dados pessoais. Tente novamente.', 'Fechar', { duration: 4000 });
        },
      });
  }
}
