import { Component, ChangeDetectorRef, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatRadioModule } from '@angular/material/radio';
import { CabecalhoPaginaComponent } from '../../../shared/components/cabecalho-pagina/cabecalho-pagina.component';
import { InputComponent, InputType } from '../../../shared/components/input/input.component';
import { SelectComponent } from '../../../shared/components/select/select.component';
import { CheckboxComponent } from '../../../shared/components/checkbox/checkbox.component';
import { DateInputComponent } from '../../../shared/components/date-input/date-input.component';
import { BotaoComponent } from '../../../shared/components/botao/botao.component';
import { FormularioDadosPessoaisComponent } from '../../../shared/components/formulario-dados-pessoais/formulario-dados-pessoais.component';
import { criarFormGroupPessoa } from '../../../shared/components/formulario-dados-pessoais/formulario-dados-pessoais.utils';
import { CardSelecaoBeneficiarioComponent } from '../../../shared/components/card-selecao-beneficiario/card-selecao-beneficiario.component';
import { CardComponent } from '../../../shared/components/card/card.component';
import { Subject, finalize } from 'rxjs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TipoContato, OPCOES_TIPO_CONTATO, CriarContatoBeneficiarioDto } from '../../../core/models/contato.model';
import {
  OPCOES_NIVEL_ESCOLARIDADE,
  OPCOES_ESTADO_CIVIL,
  OPCOES_VINCULO_EMPREGATICIO,
  CriarBeneficiarioDto,
  BeneficiarioResumo,
} from '../../../core/models/beneficiario.model';
import {
  FaixaRenda,
  TipoMoradia,
  OPCOES_FAIXA_RENDA,
  OPCOES_TIPO_MORADIA,
} from '../../../core/models/familia.model';
import { UF, OPCOES_UF } from '../../../core/models/endereco.model';
import { Pessoa } from '../../../core/models/pessoa.model';
import { BeneficiarioService } from '../../../core/services/beneficiario.service';
import { PessoaService } from '../../../core/services/pessoa.service';

@Component({
  selector: 'app-cadastro-beneficiario',
  standalone: true,
  imports: [
    ReactiveFormsModule,
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
    FormularioDadosPessoaisComponent,
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
  private readonly pessoaService = inject(PessoaService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly snackBar = inject(MatSnackBar);

  private readonly buscaResponsavelSubject = new Subject<string>();

  estaCarregando = signal(false);
  responsavelSelecionado = signal<Pessoa | null>(null);
  familiaIdSelecionada = signal<string | null>(null);
  pessoaExistenteId = signal<string | null>(null);

  get tituloCardSelecao(): string {
    return this.ehMenorNaoEmancipado
      ? 'Responsável Legal'
      : 'Vincular a uma Família Existente';
  }

  get subtituloCardSelecao(): string {
    return this.ehMenorNaoEmancipado
      ? 'Obrigatório para menores de 18 anos não emancipados'
      : 'Opcional. Selecione um familiar para herdar os dados da família e endereço';
  }

  get iconeCardSelecao(): string {
    return this.ehMenorNaoEmancipado
      ? 'family_restroom'
      : 'group_add';
  }

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
            this.formFamilia.patchValue({
              faixaRenda: familia.faixaRenda,
              tipoMoradia: familia.tipoMoradia,
              possuiBeneficioSocial: familia.possuiBeneficioSocial,
            });
            if (familia.endereco) {
              this.formEndereco.patchValue({
                cep: familia.endereco.cep || '',
                logradouro: familia.endereco.logradouro || '',
                numero: familia.endereco.numero || '',
                complemento: familia.endereco.complemento || '',
                bairro: familia.endereco.bairro || '',
                cidade: familia.endereco.cidade || '',
                uf: familia.endereco.uf || null,
              });
            }
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
    const familiaGroup = this.formFamilia;
    const enderecoGroup = this.formEndereco;

    const familiaDisabled = familiaGroup.disabled;
    const enderecoDisabled = enderecoGroup.disabled;

    if (familiaDisabled) familiaGroup.enable({ emitEvent: false });
    familiaGroup.reset({
      faixaRenda: null,
      tipoMoradia: null,
      possuiBeneficioSocial: false,
    });
    if (familiaDisabled) familiaGroup.disable({ emitEvent: false });

    if (enderecoDisabled) enderecoGroup.enable({ emitEvent: false });
    enderecoGroup.reset({
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      uf: null,
    });
    if (enderecoDisabled) enderecoGroup.disable({ emitEvent: false });
  }

  limiteContatos = 3;

  tiposContato = OPCOES_TIPO_CONTATO;
  niveisEscolaridade = OPCOES_NIVEL_ESCOLARIDADE;
  estadosCivis = OPCOES_ESTADO_CIVIL;
  vinculosEmpregaticios = OPCOES_VINCULO_EMPREGATICIO;
  faixasRenda = OPCOES_FAIXA_RENDA;
  tiposMoradia = OPCOES_TIPO_MORADIA;
  ufs = OPCOES_UF;

  form: FormGroup = this.fb.group({
    // Sub-grupo de Pessoa (compartilhado com validações centralizadas)
    pessoa: criarFormGroupPessoa(this.fb),

    // Dados específicos de Beneficiário
    nivelEscolaridade: ['', [Validators.required]],
    estadoCivil: [''],
    vinculoEmpregaticio: [''],
    quantidadeFilhos: [null, [Validators.min(0), Validators.max(30), Validators.pattern(/^[0-9]+$/)]],
    emancipado: [false],
    podeSairSozinho: [false],
    responsavelId: [''],

    // Sub-grupo de Família
    familia: this.fb.group({
      faixaRenda: [{ value: null as FaixaRenda | null, disabled: true }, Validators.required],
      tipoMoradia: [{ value: null as TipoMoradia | null, disabled: true }, Validators.required],
      possuiBeneficioSocial: [{ value: false, disabled: true }],
    }),

    // Endereço
    endereco: this.fb.group({
      cep: [{ value: '', disabled: true }, [Validators.required, Validators.pattern(/^(\d{8}|\d{5}-\d{3})$/)]],
      logradouro: [{ value: '', disabled: true }, [Validators.required]],
      numero: [{ value: '', disabled: true }],
      complemento: [{ value: '', disabled: true }],
      bairro: [{ value: '', disabled: true }, [Validators.required]],
      cidade: [{ value: '', disabled: true }, [Validators.required]],
      uf: [{ value: null as UF | null, disabled: true }, [Validators.required]],
    }),

    // Canais de Contato
    contatos: this.fb.array([], [Validators.required, Validators.minLength(1)]),
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

  ngOnInit(): void {
    // Adiciona 1 contato inicial por padrão
    this.adicionarContato();

    // Escuta alterações específicas no sub-grupo pessoa e demais controles sem criar loop infinito
    this.formPessoa.get('dataNascimento')?.valueChanges.subscribe(() => {
      this.atualizarValidacoesPorIdade();
      this.atualizarEstadoControles();
    });

    this.form.get('emancipado')?.valueChanges.subscribe(() => {
      this.atualizarValidacoesPorIdade();
      this.atualizarEstadoControles();
    });

    this.formPessoa.get('cpf')?.valueChanges.subscribe((val) => {
      this.pessoaExistenteId.set(null);
      this.atualizarEstadoCamposPessoa();
      this.atualizarEstadoControles();

      const cpfLimpo = (val || '').replace(/\D/g, '');
      if (cpfLimpo.length === 11) {
        this.buscarDadosPessoa();
      }
    });
    this.formPessoa.get('nome')?.valueChanges.subscribe(() => this.atualizarEstadoControles());
    this.form.get('nivelEscolaridade')?.valueChanges.subscribe(() => this.atualizarEstadoControles());

    // Estado inicial
    this.atualizarEstadoControles();
  }

  atualizarEstadoControles(): void {
    const habilitar = this.dadosPessoaisPreenchidos;
    const familiaGroup = this.formFamilia;
    const enderecoGroup = this.formEndereco;
    const contatosArray = this.contatos;

    if (habilitar) {
      if (familiaGroup.disabled) familiaGroup.enable({ emitEvent: false });
      if (enderecoGroup.disabled) enderecoGroup.enable({ emitEvent: false });
      if (contatosArray?.disabled) contatosArray.enable({ emitEvent: false });
    } else {
      if (familiaGroup.enabled) familiaGroup.disable({ emitEvent: false });
      if (enderecoGroup.enabled) enderecoGroup.disable({ emitEvent: false });
      if (contatosArray?.enabled) contatosArray.disable({ emitEvent: false });
    }
  }

  calcularIdade(dataValue: any): number | null {
    if (!dataValue) return null;
    let data: Date | null = null;

    const anoAtual = new Date().getFullYear();
    const anoMinimo = anoAtual - 150;
    const anoMaximo = anoAtual;

    if (dataValue instanceof Date) {
      data = dataValue;
    } else if (typeof dataValue === 'string') {
      if (dataValue.includes('-')) {
        const parts = dataValue.split('-');
        if (parts.length === 3 && parts[0].length === 4) {
          const ano = Number(parts[0]);
          const mes = Number(parts[1]);
          const dia = Number(parts[2]);
          if (ano >= anoMinimo && ano <= anoMaximo && mes >= 1 && mes <= 12 && dia >= 1 && dia <= 31) {
            data = new Date(ano, mes - 1, dia);
          }
        }
      } else if (dataValue.includes('/')) {
        const parts = dataValue.split('/');
        if (parts.length === 3 && parts[2].length === 4) {
          const dia = Number(parts[0]);
          const mes = Number(parts[1]);
          const ano = Number(parts[2]);
          if (ano >= anoMinimo && ano <= anoMaximo && mes >= 1 && mes <= 12 && dia >= 1 && dia <= 31) {
            data = new Date(ano, mes - 1, dia);
          }
        }
      }
    }
    if (!data || isNaN(data.getTime())) return null;

    const ano = data.getFullYear();
    if (ano < anoMinimo || ano > anoMaximo) return null;

    const hoje = new Date();
    let idade = hoje.getFullYear() - data.getFullYear();
    const m = hoje.getMonth() - data.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < data.getDate())) {
      idade--;
    }
    return idade;
  }

  get idadeAtual(): number | null {
    const dataNasc = this.formPessoa.get('dataNascimento')?.value;
    return this.calcularIdade(dataNasc);
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

  get dadosPessoaisPreenchidos(): boolean {
    return Boolean(
      this.formPessoa.valid &&
      this.form.get('nivelEscolaridade')?.valid
    );
  }

  get podePreencherDemaisSecoes(): boolean {
    if (!this.dadosPessoaisPreenchidos) return false;

    if (this.ehMenorNaoEmancipado) {
      return Boolean(this.responsavelSelecionado());
    }

    return true;
  }

  atualizarValidacoesPorIdade(): void {
    if (!this.podeSerEmancipado) {
      this.form.get('emancipado')?.setValue(false, { emitEvent: false });
    }

    const responsavelCtrl = this.form.get('responsavelId');
    const contatosArray = this.contatos;

    if (this.ehMenorNaoEmancipado) {
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
    const ehPessoaExistente = !!this.pessoaExistenteId();
    const nomeCtrl = this.formPessoa.get('nome');
    const dataNascCtrl = this.formPessoa.get('dataNascimento');

    if (ehPessoaExistente) {
      if (nomeCtrl?.enabled) nomeCtrl.disable({ emitEvent: false });
      if (dataNascCtrl?.enabled) dataNascCtrl.disable({ emitEvent: false });
    } else {
      if (nomeCtrl?.disabled) nomeCtrl.enable({ emitEvent: false });
      if (dataNascCtrl?.disabled) dataNascCtrl.enable({ emitEvent: false });
    }
  }

  buscarDadosPessoa(): void {
    const cpfControl = this.formPessoa.get('cpf');
    const cpfRaw = cpfControl?.value || '';
    const cpfLimpo = cpfRaw.replace(/\D/g, '');

    if (cpfLimpo.length !== 11 || cpfControl?.invalid) {
      this.pessoaExistenteId.set(null);
      this.atualizarEstadoCamposPessoa();
      return;
    }

    this.estaCarregando.set(true);

    this.pessoaService
      .verificarCadastroBeneficiarioPorCpf(cpfLimpo)
      .pipe(finalize(() => this.estaCarregando.set(false)))
      .subscribe({
        next: (pessoa: Pessoa) => {
          this.pessoaExistenteId.set(pessoa.id);
          this.formPessoa.patchValue({
            nome: pessoa.nome,
            dataNascimento: pessoa.dataNascimento,
          });
          this.form.patchValue({
            podeSairSozinho: pessoa.podeSairSozinho,
            emancipado: pessoa.emancipado,
          });
          this.atualizarEstadoCamposPessoa();
          this.atualizarValidacoesPorIdade();
          this.atualizarEstadoControles();
        },
        error: (error) => {
          this.pessoaExistenteId.set(null);
          this.atualizarEstadoCamposPessoa();
          if (error?.status === 409) {
            const mensagem = error.error?.message || 'Esta pessoa já possui um cadastro de beneficiário ativo no sistema.';
            this.snackBar.open(mensagem, 'Fechar', { duration: 5000 });
          } else {
            console.error('Erro ao buscar dados da pessoa:', error);
          }
        },
      });
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open('Por favor, preencha corretamente os campos obrigatórios em destaque.', 'Fechar', {
        duration: 4000,
      });
      return;
    }

    const formValue = this.form.value;
    const pessoaValue = formValue.pessoa;
    const familiaValue = formValue.familia;

    const responsavelId = this.ehMenorNaoEmancipado
      ? (formValue.responsavelId || undefined)
      : undefined;

    const podeSairSozinho = this.ehMenorNaoEmancipado
      ? Boolean(formValue.podeSairSozinho)
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
          emancipado: formValue.emancipado,
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
          emancipado: formValue.emancipado,
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

  adicionarContato(): void {
    if (this.contatos.length < this.limiteContatos) {
      const ehPrimeiro = this.contatos.length === 0;
      const ehObrigatorio = !this.ehMenorNaoEmancipado;

      const grupoContato = this.fb.group({
        tipoContato: ['' as TipoContato, ehObrigatorio ? [Validators.required] : []],
        valor: ['', ehObrigatorio ? [Validators.required, Validators.maxLength(150)] : [Validators.maxLength(150)]],
        ehPrincipal: [ehPrimeiro],
      });

      grupoContato.get('tipoContato')?.valueChanges.subscribe((tipo) => {
        this.atualizarValidadoresValorContato(grupoContato, tipo || '');
      });

      this.contatos.push(grupoContato);
    }
  }

  private atualizarValidadoresValorContato(grupoContato: FormGroup, tipo: TipoContato | string): void {
    const valorControl = grupoContato.get('valor');
    if (!valorControl) return;

    valorControl.setValue('', { emitEvent: false });

    if (!tipo) {
      if (this.ehMenorNaoEmancipado) {
        valorControl.setValidators([Validators.maxLength(150)]);
      } else {
        valorControl.setValidators([Validators.required, Validators.maxLength(150)]);
      }
    } else if (tipo === 'CELULAR') {
      valorControl.setValidators([
        Validators.required,
        Validators.pattern(/^(\d{11}|\(\d{2}\)\s?\d{5}-\d{4})$/),
        Validators.maxLength(15),
      ]);
    } else if (tipo === 'TELEFONE_FIXO') {
      valorControl.setValidators([
        Validators.required,
        Validators.pattern(/^(\d{10}|\(\d{2}\)\s?\d{4}-\d{4})$/),
        Validators.maxLength(14),
      ]);
    } else {
      valorControl.setValidators([
        Validators.required,
        Validators.email,
        Validators.maxLength(150),
      ]);
    }

    valorControl.updateValueAndValidity();
  }

  removerContato(index: number): void {
    const eraPrincipal = this.contatos.at(index).get('ehPrincipal')?.value;
    this.contatos.removeAt(index);
    if (eraPrincipal && this.contatos.length > 0) {
      this.contatos.at(0).get('ehPrincipal')?.setValue(true);
    }
  }

  marcarPrincipal(indexSelecionado: number): void {
    this.contatos.controls.forEach((control, idx) => {
      control.get('ehPrincipal')?.setValue(idx === indexSelecionado);
    });
  }

  obterTipoInputContato(tipo: TipoContato | string): InputType {
    return tipo === 'EMAIL' ? 'email' : 'tel';
  }

  obterPlaceholderContato(tipo: TipoContato | string): string {
    switch (tipo) {
      case 'CELULAR':
        return 'Ex: (11) 99999-9999';
      case 'TELEFONE_FIXO':
        return 'Ex: (11) 3333-4444';
      default:
        return 'exemplo@email.com';
    }
  }

  obterMaxLengthContato(tipo: TipoContato | string): number {
    switch (tipo) {
      case 'CELULAR':
        return 15;
      case 'TELEFONE_FIXO':
        return 14;
      default:
        return 150;
    }
  }

  voltar(): void {
    this.router.navigate(['/beneficiarios']);
  }
}
