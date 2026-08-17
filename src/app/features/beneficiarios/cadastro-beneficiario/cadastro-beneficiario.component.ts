import { Component, ChangeDetectorRef, computed, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatRadioModule } from '@angular/material/radio';
import { CabecalhoPaginaComponent } from '../../../shared/components/ui/cabecalho-pagina/cabecalho-pagina.component';
import { InputComponent } from '../../../shared/components/ui/input/input.component';
import { SelectComponent } from '../../../shared/components/ui/select/select.component';
import { CheckboxComponent } from '../../../shared/components/ui/checkbox/checkbox.component';
import { DateInputComponent } from '../../../shared/components/ui/date-input/date-input.component';
import { BotaoComponent } from '../../../shared/components/ui/botao/botao.component';
import { AlertaComponent } from '../../../shared/components/ui/alerta/alerta.component';
import { FormularioDadosBeneficiarioComponent } from '../../../shared/components/formularios/formulario-dados-beneficiario/formulario-dados-beneficiario.component';
import { FormularioDadosPessoaComponent } from '../../../shared/components/formularios/formulario-dados-pessoa/formulario-dados-pessoa.component';
import { FormularioDadosFamiliaComponent } from '../../../shared/components/formularios/formulario-dados-familia/formulario-dados-familia.component';
import { FormularioEnderecoComponent } from '../../../shared/components/formularios/formulario-endereco/formulario-endereco.component';
import { FormularioContatosComponent } from '../../../shared/components/formularios/formulario-contatos/formulario-contatos.component';
import { FormularioPermissoesMenorComponent } from '../../../shared/components/formularios/formulario-permissoes-menor/formulario-permissoes-menor.component';
import { PessoaFormService } from '../../../core/services/pessoa-form.service';
import { BeneficiarioFormService } from '../../../core/services/beneficiario-form.service';
import { FamiliaFormService } from '../../../core/services/familia-form.service';
import { EnderecoFormService } from '../../../core/services/endereco-form.service';
import { ContatoFormService } from '../../../core/services/contato-form.service';
import { PessoaCadastroFacade } from '../../../core/services/pessoa-cadastro-facade.service';
import { CardSelecaoBeneficiarioComponent } from '../components/card-selecao-beneficiario/card-selecao-beneficiario.component';
import { CardComponent } from '../../../shared/components/ui/card/card.component';
import { Subject, finalize, map, merge, startWith } from 'rxjs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { calcularIdade } from '../../../shared/utils/data.utils';
import { CriarContatoBeneficiarioDto } from '../../../core/models/contato.model';
import {
  CriarBeneficiarioDto,
  BeneficiarioResumo,
} from '../../../core/models/beneficiario.model';
import { Pessoa } from '../../../core/models/pessoa.model';
import { BeneficiarioService } from '../../../core/services/beneficiario.service';

@Component({
  selector: 'app-cadastro-beneficiario',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatRadioModule,
    MatProgressBarModule,
    MatIconModule,
    MatSnackBarModule,
    CabecalhoPaginaComponent,
    InputComponent,
    SelectComponent,
    CheckboxComponent,
    DateInputComponent,
    BotaoComponent,
    AlertaComponent,
    FormularioDadosPessoaComponent,
    FormularioDadosBeneficiarioComponent,
    FormularioDadosFamiliaComponent,
    FormularioEnderecoComponent,
    FormularioContatosComponent,
    FormularioPermissoesMenorComponent,
    CardSelecaoBeneficiarioComponent,
    CardComponent,
  ],
  templateUrl: './cadastro-beneficiario.component.html',
  styleUrl: './cadastro-beneficiario.component.scss',
})
export class CadastroBeneficiarioComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly beneficiarioService = inject(BeneficiarioService);
  private readonly pessoaFormService = inject(PessoaFormService);
  private readonly beneficiarioFormService = inject(BeneficiarioFormService);
  private readonly familiaFormService = inject(FamiliaFormService);
  private readonly enderecoFormService = inject(EnderecoFormService);
  private readonly contatoFormService = inject(ContatoFormService);
  private readonly pessoaCadastroFacade = inject(PessoaCadastroFacade);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly snackBar = inject(MatSnackBar);

  private readonly buscaResponsavelSubject = new Subject<string>();
  private readonly buscaCpfSubject = new Subject<string>();

  estaCarregando = signal(false);
  responsavelSelecionado = signal<Pessoa | null>(null);
  familiaIdSelecionada = signal<string | null>(null);
  pessoaExistenteId = signal<string | null>(null);
  conflitoCpf = signal(false);

  limiteContatos = 3;

  form: FormGroup = this.fb.group({
    // Sub-grupo de Pessoa (compartilhado via PessoaFormService)
    pessoa: this.pessoaFormService.criarForm(),

    // Dados específicos de Beneficiário (compartilhado via BeneficiarioFormService)
    ...this.beneficiarioFormService.criarControles(),
    responsavelId: [''],

    // Sub-grupo de Família (compartilhado via FamiliaFormService)
    familia: this.familiaFormService.criarForm(undefined, true),

    // Endereço (compartilhado via EnderecoFormService)
    endereco: this.enderecoFormService.criarForm(undefined, true),

    // Canais de Contato (compartilhado via ContatoFormService)
    contatos: this.contatoFormService.criarArrayContatos(),
  });

  get formPessoa(): FormGroup {
    return this.form.get('pessoa') as FormGroup;
  }

  get formFamilia(): FormGroup {
    return this.form.get('familia') as FormGroup;
  }

  get formEndereco(): FormGroup {
    return this.form.get('endereco') as FormGroup;
  }

  // --- SIGNALS REATIVOS & DERIVADOS ---
  readonly dataNascimento = toSignal(
    this.formPessoa.get('dataNascimento')!.valueChanges,
    { initialValue: this.formPessoa.get('dataNascimento')?.value ?? null }
  );

  readonly emancipado = toSignal(
    this.formPessoa.get('emancipado')!.valueChanges,
    { initialValue: !!this.formPessoa.get('emancipado')?.value }
  );

  readonly dadosPessoaisPreenchidos = toSignal(
    merge(
      this.formPessoa.statusChanges,
      this.formPessoa.valueChanges,
      this.form.get('nivelEscolaridade')!.statusChanges,
      this.form.get('nivelEscolaridade')!.valueChanges
    ).pipe(
      map(() => Boolean(this.formPessoa.valid && this.form.get('nivelEscolaridade')?.valid)),
      startWith(Boolean(this.formPessoa.valid && this.form.get('nivelEscolaridade')?.valid))
    ),
    { initialValue: false }
  );

  readonly idadeAtual = computed(() => {
    const dataNasc = this.dataNascimento();
    return calcularIdade(dataNasc);
  });

  readonly podeSerEmancipado = computed(() => {
    const idade = this.idadeAtual();
    return idade !== null && idade >= 16 && idade < 18;
  });

  readonly ehMenorNaoEmancipado = computed(() => {
    const idade = this.idadeAtual();
    return idade !== null && idade < 18 && !this.emancipado();
  });

  readonly podePreencherDemaisSecoes = computed(() => {
    if (!this.dadosPessoaisPreenchidos()) return false;
    if (this.ehMenorNaoEmancipado()) {
      return Boolean(this.responsavelSelecionado());
    }
    return true;
  });

  readonly tituloCardSelecao = computed(() =>
    this.ehMenorNaoEmancipado() ? 'Responsável Legal' : 'Vincular a uma Família Existente'
  );

  readonly subtituloCardSelecao = computed(() =>
    this.ehMenorNaoEmancipado()
      ? 'Obrigatório para menores de 18 anos não emancipados'
      : 'Opcional. Selecione um familiar para herdar os dados da família e endereço'
  );

  readonly iconeCardSelecao = computed(() =>
    this.ehMenorNaoEmancipado() ? 'supervisor_account' : 'group_add'
  );

  solicitarBuscaResponsavel(termo: string): void {
    this.buscaResponsavelSubject.next(termo);
  }

  definirResponsavel(beneficiario: BeneficiarioResumo): void {
    this.responsavelSelecionado.set(beneficiario.pessoa);
    this.form.get('responsavelId')?.setValue(beneficiario.pessoa.id);

    this.atualizarValidacoesPorIdade();
    this.atualizarEstadoControles();

    if (beneficiario.familiaId) {
      this.familiaIdSelecionada.set(beneficiario.familiaId);
      this.carregarDadosFamiliaEResponsavel(beneficiario.id);
    } else {
      this.familiaIdSelecionada.set(null);
    }
  }

  private carregarDadosFamiliaEResponsavel(beneficiarioId: string): void {
    this.estaCarregando.set(true);
    this.beneficiarioService
      .buscarPorId(beneficiarioId)
      .pipe(finalize(() => this.estaCarregando.set(false)))
      .subscribe({
        next: (dadosCompleto) => {
          const familia = dadosCompleto.familia;
          if (familia) {
            this.familiaFormService.preencherForm(this.formFamilia, familia);
            if (familia.endereco) {
              this.enderecoFormService.preencherForm(this.formEndereco, familia.endereco);
            }
            this.atualizarEstadoControles();
          }
        },
        error: (erro) => {
          console.error('Erro ao carregar detalhes da família do responsável:', erro);
        },
      });
  }

  limparResponsavel(): void {
    this.responsavelSelecionado.set(null);
    this.familiaIdSelecionada.set(null);
    this.form.get('responsavelId')?.setValue('', { emitEvent: false });

    this.atualizarValidacoesPorIdade();
    this.atualizarEstadoControles();

    // 2. Reseta os valores DEPOIS do enable/disable estar no estado final
    this.resetarCamposFamilia();
    this.cdr.detectChanges();
  }

  private resetarCamposFamilia(): void {
    this.familiaFormService.resetarForm(this.formFamilia);
    this.enderecoFormService.resetarForm(this.formEndereco);
  }

  ngOnInit(): void {
    this.formPessoa.get('cpf')?.addValidators(() => {
      return this.conflitoCpf() ? { beneficiarioAtivo: true } : null;
    });

    // Escuta alterações na Data de Nascimento e Emancipação para atualizar validações condicionais
    this.formPessoa.get('dataNascimento')?.valueChanges.subscribe(() => {
      this.atualizarValidacoesPorIdade();
    });

    this.formPessoa.get('emancipado')?.valueChanges.subscribe(() => {
      this.atualizarValidacoesPorIdade();
    });

    // Escuta CPF para busca reativa
    this.formPessoa.get('cpf')?.valueChanges.subscribe((val) => {
      this.setConflitoCpf(false);
      this.pessoaExistenteId.set(null);
      this.atualizarEstadoCamposPessoa();

      const cpfLimpo = (val || '').replace(/\D/g, '');
      if (cpfLimpo.length === 11) {
        this.buscarDadosPessoa();
      } else {
        this.buscaCpfSubject.next('');
      }
    });

    // Escuta alterações em qualquer campo dos Dados Pessoais (Pessoa + Escolaridade) para desbloquear os demais cards
    merge(
      this.formPessoa.valueChanges,
      this.form.get('nivelEscolaridade')!.valueChanges
    ).subscribe(() => {
      this.atualizarEstadoControles();
    });

    const { estaCarregando } = this.pessoaCadastroFacade.iniciarBuscaCpfReativa({
      cpfSubject: this.buscaCpfSubject,
      buscarApiFn: (cpfLimpo) => this.beneficiarioService.verificarCadastroPorCpf(cpfLimpo),
      getCpfAtualInput: () => this.formPessoa.get('cpf')?.value || '',
      onSucesso: (pessoa) => this.tratarSucessoBuscaPessoa(pessoa),
      onErro: (error) => this.tratarErroBuscaPessoa(error),
    });
    this.estaCarregando = estaCarregando;

    // Estado inicial
    this.atualizarEstadoControles();
  }

  atualizarEstadoControles(): void {
    const habilitar = this.podePreencherDemaisSecoes();
    const familiaGroup = this.formFamilia;
    const enderecoGroup = this.formEndereco;
    const contatosArray = this.contatos;

    if (habilitar) {
      if (this.familiaIdSelecionada()) {
        // Se uma família existente foi vinculada, os dados de família e endereço são herdados (readonly)
        if (familiaGroup.enabled) familiaGroup.disable({ emitEvent: false });
        if (enderecoGroup.enabled) enderecoGroup.disable({ emitEvent: false });
      } else {
        if (familiaGroup.disabled) familiaGroup.enable({ emitEvent: false });
        if (enderecoGroup.disabled) enderecoGroup.enable({ emitEvent: false });
      }
      if (contatosArray?.disabled) contatosArray.enable({ emitEvent: false });
    } else {
      if (familiaGroup.enabled) familiaGroup.disable({ emitEvent: false });
      if (enderecoGroup.enabled) enderecoGroup.disable({ emitEvent: false });
      if (contatosArray?.enabled) contatosArray.disable({ emitEvent: false });
    }
  }

  atualizarValidacoesPorIdade(): void {
    if (!this.podeSerEmancipado()) {
      this.formPessoa.get('emancipado')?.setValue(false, { emitEvent: false });
    }

    const responsavelCtrl = this.form.get('responsavelId');
    const contatosArray = this.contatos;

    if (this.ehMenorNaoEmancipado()) {
      responsavelCtrl?.setValidators([Validators.required]);
      contatosArray?.clearValidators();

      contatosArray?.controls.forEach((group) => {
        const tipoCtrl = group.get('tipoContato');
        const valorCtrl = group.get('valor');

        if (!tipoCtrl?.value && !valorCtrl?.value) {
          tipoCtrl?.clearValidators();
          valorCtrl?.clearValidators();
          tipoCtrl?.updateValueAndValidity({ emitEvent: false });
          valorCtrl?.updateValueAndValidity({ emitEvent: false });
        }
      });
    } else {
      responsavelCtrl?.clearValidators();
      responsavelCtrl?.setValue('', { emitEvent: false });
      contatosArray?.setValidators([Validators.required, Validators.minLength(1)]);

      contatosArray?.controls.forEach((group) => {
        const tipoCtrl = group.get('tipoContato');
        const valorCtrl = group.get('valor');

        if (!tipoCtrl?.value) {
          tipoCtrl?.setValidators([Validators.required]);
          tipoCtrl?.updateValueAndValidity({ emitEvent: false });
        }
        if (!valorCtrl?.value) {
          valorCtrl?.setValidators([Validators.required]);
          valorCtrl?.updateValueAndValidity({ emitEvent: false });
        }
      });
    }

    responsavelCtrl?.updateValueAndValidity({ emitEvent: false });
    contatosArray?.updateValueAndValidity({ emitEvent: false });
  }

  private atualizarEstadoCamposPessoa(): void {
    if (this.pessoaExistenteId()) {
      this.pessoaFormService.bloquearCamposEdicao(this.formPessoa);
    } else {
      this.pessoaFormService.desbloquearCamposEdicao(this.formPessoa);
    }
  }

  private setConflitoCpf(conflito: boolean): void {
    this.conflitoCpf.set(conflito);
    this.formPessoa.get('cpf')?.updateValueAndValidity({ emitEvent: false });
  }

  private tratarSucessoBuscaPessoa(pessoa: Pessoa): void {
    this.setConflitoCpf(false);
    this.pessoaExistenteId.set(pessoa.id);
    this.pessoaFormService.preencherForm(this.formPessoa, pessoa);
    this.atualizarEstadoCamposPessoa();
    this.atualizarValidacoesPorIdade();
    this.atualizarEstadoControles();
    this.snackBar.open(
      'Pessoa identificada no sistema! Dados pessoais preenchidos automaticamente.',
      'Fechar',
      { duration: 4000 }
    );
  }

  private tratarErroBuscaPessoa(error: unknown): void {
    this.pessoaExistenteId.set(null);
    this.atualizarEstadoCamposPessoa();
    const err = error as any;
    if (err?.status === 409) {
      this.setConflitoCpf(true);
    } else {
      this.setConflitoCpf(false);
      console.error('Erro ao buscar dados da pessoa:', error);
    }
  }

  buscarDadosPessoa(): void {
    const cpfControl = this.formPessoa.get('cpf');
    const cpfRaw = cpfControl?.value || '';
    const cpfLimpo = cpfRaw.replace(/\D/g, '');

    if (cpfLimpo.length !== 11) {
      this.setConflitoCpf(false);
      this.pessoaExistenteId.set(null);
      this.atualizarEstadoCamposPessoa();
      this.buscaCpfSubject.next('');
      return;
    }

    this.buscaCpfSubject.next(cpfLimpo);
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.value;
    const pessoaValue = formValue.pessoa;
    const familiaValue = formValue.familia;

    const responsavelId = this.ehMenorNaoEmancipado()
      ? (formValue.responsavelId || undefined)
      : undefined;

    const podeSairSozinho = this.ehMenorNaoEmancipado()
      ? Boolean(pessoaValue.podeSairSozinho)
      : undefined;

    const contatosMapeados: CriarContatoBeneficiarioDto[] = (formValue.contatos || [])
      .filter((contato: CriarContatoBeneficiarioDto) => contato.valor && contato.valor.trim() !== '')
      .map((contato: CriarContatoBeneficiarioDto) => ({
        tipoContato: contato.tipoContato,
        valor: contato.tipoContato === 'EMAIL' ? contato.valor.trim() : (contato.valor || '').replace(/\D/g, ''),
        ehPrincipal: !!contato.ehPrincipal,
      }));

    const contatos = contatosMapeados.length > 0 ? contatosMapeados : undefined;
    const familiaIdExistente = this.familiaIdSelecionada();
    const pessoaId = this.pessoaExistenteId();

    let beneficiario: CriarBeneficiarioDto;

    if (pessoaId) {
      if (familiaIdExistente) {
        beneficiario = {
          pessoaId,
          familiaId: familiaIdExistente,
          nivelEscolaridade: formValue.nivelEscolaridade,
          estadoCivil: formValue.estadoCivil || undefined,
          vinculoEmpregaticio: formValue.vinculoEmpregaticio || undefined,
          quantidadeFilhos: formValue.quantidadeFilhos || undefined,
          contatos,
        };
      } else {
        beneficiario = {
          pessoaId,
          novaFamilia: {
            faixaRenda: familiaValue.faixaRenda,
            tipoMoradia: familiaValue.tipoMoradia,
            possuiBeneficioSocial: familiaValue.possuiBeneficioSocial,
            endereco: {
              logradouro: formValue.endereco.logradouro,
              numero: formValue.endereco.numero || undefined,
              complemento: formValue.endereco.complemento || undefined,
              bairro: formValue.endereco.bairro,
              cep: (formValue.endereco.cep || '').replace(/\D/g, ''),
              cidade: formValue.endereco.cidade,
              uf: formValue.endereco.uf,
            },
          },
          nivelEscolaridade: formValue.nivelEscolaridade,
          estadoCivil: formValue.estadoCivil || undefined,
          vinculoEmpregaticio: formValue.vinculoEmpregaticio || undefined,
          quantidadeFilhos: formValue.quantidadeFilhos || undefined,
          contatos,
        };
      }
    } else {
      if (familiaIdExistente) {
        beneficiario = {
          nome: pessoaValue.nome,
          cpf: (pessoaValue.cpf || '').replace(/\D/g, ''),
          dataNascimento: pessoaValue.dataNascimento,
          emancipado: pessoaValue.emancipado,
          podeSairSozinho,
          responsavelId,
          quantidadeFilhos: formValue.quantidadeFilhos || undefined,
          nivelEscolaridade: formValue.nivelEscolaridade,
          estadoCivil: formValue.estadoCivil || undefined,
          vinculoEmpregaticio: formValue.vinculoEmpregaticio || undefined,
          familiaId: familiaIdExistente,
          contatos,
        };
      } else {
        beneficiario = {
          nome: pessoaValue.nome,
          cpf: (pessoaValue.cpf || '').replace(/\D/g, ''),
          dataNascimento: pessoaValue.dataNascimento,
          emancipado: pessoaValue.emancipado,
          podeSairSozinho,
          responsavelId,
          quantidadeFilhos: formValue.quantidadeFilhos || undefined,
          nivelEscolaridade: formValue.nivelEscolaridade,
          estadoCivil: formValue.estadoCivil || undefined,
          vinculoEmpregaticio: formValue.vinculoEmpregaticio || undefined,
          novaFamilia: {
            faixaRenda: familiaValue.faixaRenda,
            tipoMoradia: familiaValue.tipoMoradia,
            possuiBeneficioSocial: familiaValue.possuiBeneficioSocial,
            endereco: {
              logradouro: formValue.endereco.logradouro,
              numero: formValue.endereco.numero || undefined,
              complemento: formValue.endereco.complemento || undefined,
              bairro: formValue.endereco.bairro,
              cep: (formValue.endereco.cep || '').replace(/\D/g, ''),
              cidade: formValue.endereco.cidade,
              uf: formValue.endereco.uf,
            },
          },
          contatos,
        };
      }
    }

    this.estaCarregando.set(true);

    this.beneficiarioService
      .criar(beneficiario)
      .pipe(finalize(() => this.estaCarregando.set(false)))
      .subscribe({
        next: () => {
          this.snackBar.open('Beneficiário cadastrado com sucesso!', 'Fechar', {
            duration: 3000,
          });
          this.router.navigate(['/beneficiarios']);
        },
        error: (error) => {
          console.error('Erro ao criar beneficiário:', error);
          const mensagem = error.error?.message || 'Erro ao realizar o cadastro do beneficiário. Tente novamente.';
          this.snackBar.open(mensagem, 'Fechar', { duration: 5000 });
        },
      });
  }

  get contatos(): FormArray {
    return this.form.get('contatos') as FormArray;
  }

  voltar(): void {
    this.router.navigate(['/beneficiarios']);
  }
}
