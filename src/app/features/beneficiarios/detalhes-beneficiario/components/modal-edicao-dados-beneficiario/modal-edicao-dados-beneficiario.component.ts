import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Subject, finalize } from 'rxjs';

import { FormularioDadosBeneficiarioComponent } from '../../../../../shared/components/formularios/formulario-dados-beneficiario/formulario-dados-beneficiario.component';
import { ModalComponent } from '../../../../../shared/components/ui/modal/modal.component';
import { AlertaComponent } from '../../../../../shared/components/ui/alerta/alerta.component';
import { calcularIdade, converterParaIsoDate } from '../../../../../shared/utils/data.utils';
import { formatarCpf, limparCpf } from '../../../../../shared/utils/cpf.utils';

import { PessoaFormService } from '../../../../../core/services/pessoa-form.service';
import { BeneficiarioFormService } from '../../../../../core/services/beneficiario-form.service';
import { BeneficiarioService } from '../../../../../core/services/beneficiario.service';
import { PessoaCadastroFacade } from '../../../../../core/services/pessoa-cadastro-facade.service';
import { NotificacaoService } from '../../../../../core/services/notificacao.service';
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
  private readonly notificacao = inject(NotificacaoService);
  private readonly beneficiarioService = inject(BeneficiarioService);
  private readonly pessoaFormService = inject(PessoaFormService);
  private readonly beneficiarioFormService = inject(BeneficiarioFormService);
  private readonly pessoaCadastroFacade = inject(PessoaCadastroFacade);
  private readonly destroyRef = inject(DestroyRef);

  readonly data = inject<{ beneficiario: Beneficiario }>(MAT_DIALOG_DATA);

  readonly niveisEscolaridade = OPCOES_NIVEL_ESCOLARIDADE;
  readonly estadosCivis = OPCOES_ESTADO_CIVIL;
  readonly vinculosEmpregaticios = OPCOES_VINCULO_EMPREGATICIO;

  private readonly buscaCpfSubject = new Subject<string | null>();

  salvando = signal<boolean>(false);
  buscandoCpf = signal<boolean>(false);
  cpfOriginal = signal<string>(limparCpf(this.data.beneficiario.pessoa.cpf));
  conflitoCpf = signal<ConflitoCpfBeneficiarioInfo | null>(null);

  form!: FormGroup;

  ngOnInit(): void {
    const beneficiario = this.data.beneficiario;

    this.form = this.fb.group({
      pessoa: this.pessoaFormService.criarForm(beneficiario.pessoa),
      ...this.beneficiarioFormService.criarControles(beneficiario),
    });

    this.configurarBuscaCpfReativa();

    this.formPessoa.get('cpf')?.addValidators(() => {
      const conflito = this.conflitoCpf();
      if (conflito?.tipo === 'OUTRA_PESSOA' || conflito?.tipo === 'OUTRO_BENEFICIARIO_EDICAO') {
        return { cpfEmUso: true };
      }
      return null;
    });

    this.formPessoa
      .get('dataNascimento')
      ?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.atualizarValidacoesPorIdade();
      });

    this.formPessoa
      .get('emancipado')
      ?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.atualizarValidacoesPorIdade();
      });

    this.atualizarValidacoesPorIdade();
  }

  private setConflitoCpf(conflito: ConflitoCpfBeneficiarioInfo | null): void {
    this.conflitoCpf.set(conflito);
    this.formPessoa.get('cpf')?.updateValueAndValidity({ emitEvent: false });
  }

  private configurarBuscaCpfReativa(): void {
    this.formPessoa
      .get('cpf')
      ?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((val) => {
        const cpfLimpo = limparCpf(val);

        if (cpfLimpo === this.cpfOriginal()) {
          this.setConflitoCpf(null);
          this.buscaCpfSubject.next(null);
          return;
        }

        if (cpfLimpo.length !== 11) {
          this.setConflitoCpf(null);
          this.buscaCpfSubject.next(null);
          return;
        }

        this.buscarDadosPessoa();
      });

    const { estaCarregando } = this.pessoaCadastroFacade.iniciarBuscaCpfReativa<Pessoa>(
      {
        cpfSubject: this.buscaCpfSubject,
        buscarApiFn: (cpfLimpo) => this.beneficiarioService.verificarCadastroPorCpf(cpfLimpo),
        getCpfAtualInput: () => this.formPessoa.get('cpf')?.value || '',
        onSucesso: (pessoa) => this.tratarSucessoBuscaPessoa(pessoa),
        onErro: (error) => this.tratarErroBuscaPessoa(error),
      },
      this.destroyRef,
    );
    this.buscandoCpf = estaCarregando;
  }

  private tratarSucessoBuscaPessoa(pessoa: Pessoa): void {
    // Na edição, se encontrou outra pessoa com esse CPF, bloqueia a alteração
    this.setConflitoCpf({ tipo: 'OUTRA_PESSOA' });
  }

  private tratarErroBuscaPessoa(error: unknown): void {
    const err = error as any;
    if (err?.status === 409) {
      this.setConflitoCpf({ tipo: 'OUTRO_BENEFICIARIO_EDICAO' });
    } else {
      // 404: CPF livre para alteração
      this.setConflitoCpf(null);
    }
  }

  buscarDadosPessoa(): void {
    const cpfControl = this.formPessoa.get('cpf');
    const cpfRaw = cpfControl?.value || '';
    const cpfLimpo = limparCpf(cpfRaw);

    if (cpfLimpo.length !== 11) {
      this.setConflitoCpf(null);
      this.buscaCpfSubject.next(null);
      return;
    }

    if (cpfLimpo === this.cpfOriginal()) {
      this.setConflitoCpf(null);
      this.buscaCpfSubject.next(null);
      return;
    }

    this.buscaCpfSubject.next(cpfLimpo);
  }

  restaurarCpfOriginal(): void {
    if (this.cpfOriginal()) {
      this.formPessoa.get('cpf')?.setValue(formatarCpf(this.cpfOriginal()));
      this.setConflitoCpf(null);
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
      cpf: limparCpf(pessoaValue.cpf),
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
          this.notificacao.sucesso('Dados pessoais atualizados com sucesso!');
          this.dialogRef.close(beneficiarioAtualizado);
        },
        error: (err) => {
          console.error('Erro ao atualizar dados pessoais:', err);
          this.notificacao.erro('Erro ao atualizar os dados pessoais. Tente novamente.');
        },
      });
  }
}
