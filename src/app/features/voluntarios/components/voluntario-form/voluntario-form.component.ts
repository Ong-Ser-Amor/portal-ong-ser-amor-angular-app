import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ViewChild,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { finalize } from 'rxjs';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { VoluntarioService } from '../../../../core/services/voluntario.service';
import { PessoaService } from '../../../../core/services/pessoa.service';
import { UsuarioService } from '../../../../core/services/usuario.service';
import {
  CriarVoluntarioComNovaPessoaDto,
  CriarVoluntarioComPessoaExistenteDto,
  CriarVoluntarioDto,
  AtualizarVoluntarioDto,
  NivelFormacao,
  TipoVoluntario,
  Voluntario,
} from '../../../../core/models/voluntario.model';
import {
  AtualizarPessoaRequest,
  PessoaResposta,
} from '../../../../core/models/pessoa.model';
import { CreateUsuarioRequest } from '../../../../core/models/usuario.model';

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
    MatStepperModule,
    MatButtonModule,
    ButtonComponent,
    InputComponent,
  ],
  templateUrl: './voluntario-form.component.html',
  styleUrl: './voluntario-form.component.scss',
})
export class VoluntarioFormComponent implements OnInit, AfterViewInit {
  @ViewChild(MatStepper) private stepper?: MatStepper;

  private fb = inject(FormBuilder);
  private voluntarioService = inject(VoluntarioService);
  private pessoaService = inject(PessoaService);
  private usuarioService = inject(UsuarioService);
  private dialogRef = inject(MatDialogRef<VoluntarioFormComponent>);
  private snackBar = inject(MatSnackBar);

  dados = inject<Voluntario | null>(MAT_DIALOG_DATA);

  verificacaoCpfForm!: FormGroup;
  dadosPessoaisForm!: FormGroup;
  dadosVoluntarioForm!: FormGroup;
  dadosLoginForm!: FormGroup;

  modoEdicao = false;
  estaProcessando = signal(false);
  buscandoCpf = signal(false);
  pessoaEncontrada = signal<PessoaResposta | null>(null);
  modoPessoaExistente = signal(false);
  mostrarBannerPessoa = signal(false);
  cpfVerificado = signal(false);
  pessoaConfirmada = signal(false);
  querCriarLogin = signal<boolean | null>(null);
  voluntarioSalvo = signal<Voluntario | null>(null);

  private pessoaOriginal: PessoaResposta | null = null;
  private dadosPessoaConfirmados: {
    nome: string;
    cpf: string;
    dataNascimento: string;
  } | null = null;

  tiposVoluntario: TipoVoluntario[] = ['COORDENADOR', 'PROFESSOR', 'GERAL'];
  niveis: NivelFormacao[] = ['COMPLETO', 'CURSANDO', 'INCOMPLETO'];

  ngOnInit(): void {
    this.modoEdicao = !!this.dados;
    this.criarFormularios();
    this.preencherFluxoInicial();
  }

  ngAfterViewInit(): void {
    if (this.modoEdicao) {
      queueMicrotask(() => {
        if (this.stepper) {
          this.stepper.selectedIndex = 0;
        }
      });
    }
  }

  verificarCpf() {
    if (this.modoEdicao) {
      this.avancarStep();
      return;
    }

    if (this.verificacaoCpfForm.invalid) {
      this.verificacaoCpfForm.markAllAsTouched();
      return;
    }

    const cpf = this.normalizarCpf(
      this.verificacaoCpfForm.getRawValue().cpf || '',
    );

    if (cpf.length !== 11) {
      this.snackBar.open('CPF deve conter 11 dígitos.', 'Fechar', {
        duration: 3000,
      });
      return;
    }

    this.buscandoCpf.set(true);

    this.pessoaService
      .verificarCadastroVoluntarioPorCpf(cpf)
      .pipe(finalize(() => this.buscandoCpf.set(false)))
      .subscribe({
        next: (pessoa) => {
          // marca o CPF como verificado (pessoa encontrada)
          this.cpfVerificado.set(true);
          this.configurarPessoaEncontrada(pessoa);
          this.avancarStep();
        },
        error: (error) => {
          if (error?.status === 404) {
            // CPF verificado: pessoa não encontrada
            this.cpfVerificado.set(true);
            this.configurarNovaPessoa(cpf);
            this.avancarStep();
            return;
          }

          if (error?.status === 400) {
            this.snackBar.open('CPF inválido.', 'Fechar', {
              duration: 4000,
            });
            return;
          }

          if (error?.status === 409) {
            this.snackBar.open(
              'A pessoa já possui um cadastro de voluntário ativo.',
              'Fechar',
              { duration: 5000 },
            );
            return;
          }

          this.snackBar.open(
            'Erro interno ao verificar cadastro do voluntário.',
            'Fechar',
          );
        },
      });
  }

  continuarDadosPessoais() {
    if (this.dadosPessoaisForm.invalid) {
      this.dadosPessoaisForm.markAllAsTouched();
      return;
    }
    // Se a pessoa existir e os valores do formulário diferirem do último
    // snapshot confirmado, enviar um PATCH para atualizar a pessoa antes de
    // avançar.
    if (this.pessoaOriginal && this.deveAtualizarPessoa()) {
      this.estaProcessando.set(true);
      this.pessoaService
        .atualizar(this.pessoaOriginal.id, this.obterPayloadAtualizacaoPessoa())
        .pipe(finalize(() => this.estaProcessando.set(false)))
        .subscribe({
          next: (pessoa) => {
            this.pessoaOriginal = pessoa;
            this.pessoaEncontrada.set(pessoa);
            // Atualiza o snapshot confirmado com os valores normalizados
            // retornados pela API, de forma que comparações subsequentes sejam
            // realizadas contra o estado confirmado mais recente.
            this.dadosPessoaConfirmados = this.normalizarDadosPessoa(pessoa);
            this.snackBar.open('Dados da pessoa atualizados!', 'Fechar', {
              duration: 3000,
            });
            this.pessoaConfirmada.set(true);
            this.avancarStep();
          },
          error: (error: unknown) => {
            console.error(error);
            this.snackBar.open(
              'Erro ao atualizar os dados da pessoa.',
              'Fechar',
            );
          },
        });
      return;
    }

    this.pessoaConfirmada.set(true);
    this.avancarStep();
  }

  salvarVoluntario() {
    if (this.dadosPessoaisForm.invalid || this.dadosVoluntarioForm.invalid) {
      this.dadosPessoaisForm.markAllAsTouched();
      this.dadosVoluntarioForm.markAllAsTouched();
      return;
    }

    this.estaProcessando.set(true);

    const salvarVoluntarioDepois = () => {
      if (this.modoEdicao) {
        this.voluntarioService
          .update(this.dados!.id, this.obterPayloadAtualizacaoVoluntario())
          .pipe(finalize(() => this.estaProcessando.set(false)))
          .subscribe({
            next: (voluntario: Voluntario) => {
              this.voluntarioSalvo.set(voluntario);
              this.snackBar.open('Voluntário atualizado!', 'Fechar', {
                duration: 3000,
              });
              this.dialogRef.close(true);
            },
            error: (error: unknown) => {
              console.error(error);
              this.snackBar.open('Erro ao salvar voluntário.', 'Fechar');
            },
          });
        return;
      }

      this.voluntarioService
        .create(this.obterPayloadCriacaoVoluntario())
        .pipe(finalize(() => this.estaProcessando.set(false)))
        .subscribe({
          next: (voluntario: Voluntario) => {
            this.voluntarioSalvo.set(voluntario);

            this.snackBar.open('Voluntário criado!', 'Fechar', {
              duration: 3000,
            });

            this.querCriarLogin.set(null);
            this.avancarStep();
          },
          error: (error: unknown) => {
            console.error(error);
            this.snackBar.open('Erro ao salvar voluntário.', 'Fechar');
          },
        });
    };

    salvarVoluntarioDepois();
  }

  perguntarCriarLogin(resposta: boolean) {
    if (!resposta) {
      this.dialogRef.close(true);
      return;
    }

    this.querCriarLogin.set(true);
  }

  salvarLogin() {
    if (this.dadosLoginForm.invalid) {
      this.dadosLoginForm.markAllAsTouched();
      return;
    }

    const voluntario = this.voluntarioSalvo();

    if (!voluntario) {
      this.snackBar.open(
        'Salve o voluntário antes de criar o login.',
        'Fechar',
      );
      return;
    }

    this.estaProcessando.set(true);

    const payload: CreateUsuarioRequest = {
      voluntarioId: voluntario.id,
      email: this.dadosLoginForm.getRawValue().email,
      senha: this.dadosLoginForm.getRawValue().senha,
    };

    this.usuarioService
      .create(payload)
      .pipe(finalize(() => this.estaProcessando.set(false)))
      .subscribe({
        next: () => {
          this.snackBar.open('Login criado com sucesso!', 'Fechar', {
            duration: 3000,
          });
          this.dialogRef.close(true);
        },
        error: (error) => {
          console.error(error);
          const mensagem =
            error?.error?.message || 'Erro ao criar login. Verifique o e-mail.';
          this.snackBar.open(mensagem, 'Fechar');
        },
      });
  }

  aoCancelar() {
    this.dialogRef.close(false);
  }

  formatarCpfVerificacao(event: Event) {
    const input = event.target as HTMLInputElement;
    this.verificacaoCpfForm.patchValue(
      { cpf: this.normalizarCpf(input.value) },
      { emitEvent: false },
    );
  }

  formatarCpfPessoa(event: Event) {
    const input = event.target as HTMLInputElement;
    this.dadosPessoaisForm.patchValue(
      { cpf: this.normalizarCpf(input.value) },
      { emitEvent: false },
    );
  }

  private criarFormularios() {
    const cpfInicial = this.dados?.pessoa?.cpf || '';
    const nomeInicial = this.dados?.pessoa?.nome || '';
    const nascimentoInicial = this.dados?.pessoa?.dataNascimento || '';

    this.verificacaoCpfForm = this.fb.group({
      cpf: [cpfInicial, [Validators.required, Validators.pattern(/^\d{11}$/)]],
    });

    this.dadosPessoaisForm = this.fb.group({
      nome: [nomeInicial, [Validators.required, Validators.minLength(3)]],
      cpf: [
        { value: cpfInicial, disabled: true },
        [Validators.required, Validators.pattern(/^\d{11}$/)],
      ],
      dataNascimento: [nascimentoInicial, [Validators.required]],
    });

    this.dadosVoluntarioForm = this.fb.group({
      formacaoAcademica: [
        this.dados?.formacaoAcademica || '',
        [Validators.minLength(2)],
      ],
      statusFormacao: [this.dados?.statusFormacao || ''],
      tipoVoluntario: [this.dados?.tipoVoluntario || '', [Validators.required]],
    });

    this.dadosLoginForm = this.fb.group(
      {
        email: ['', [Validators.required, Validators.email]],
        senha: ['', [Validators.required, Validators.minLength(8)]],
        confirmarSenha: ['', [Validators.required]],
      },
      { validators: (group) => this.senhasIguaisValidator(group) },
    );

    if (this.modoEdicao) {
      this.pessoaEncontrada.set(this.dados?.pessoa || null);
      this.pessoaOriginal = this.dados?.pessoa || null;
      // Inicializa o snapshot confirmado a partir dos dados existentes da
      // pessoa para que comparações subsequentes sejam feitas contra essa
      // base normalizada.
      this.dadosPessoaConfirmados = this.normalizarDadosPessoa(
        this.dados?.pessoa || null,
      );
      this.modoPessoaExistente.set(true);
      this.mostrarBannerPessoa.set(true);
      // Em modo de edição o CPF já é considerado verificado.
      this.cpfVerificado.set(true);
      this.verificacaoCpfForm.disable({ emitEvent: false });
    }
  }

  aoMudarSelecaoStepper(event: StepperSelectionEvent) {
    // Permitir navegação regressiva por padrão.
    // Regra especial: impedir retornar do passo de Login (índice 3) quando
    // não estiver em modo de edição.
    if (event.previouslySelectedIndex > event.selectedIndex) {
      // Se estamos vindo do passo de login (índice 3 quando presente), bloqueia voltar
      if (!this.modoEdicao && event.previouslySelectedIndex === 3) {
        this.bloquearSelecaoAnterior(
          event.previouslySelectedIndex,
          event.selectedIndex,
          'Não é possível voltar do passo de Login.',
        );
        return;
      }

      this.resetarFormularioPosteriorSeVazio(event.previouslySelectedIndex);
      return;
    }
    // Regras para navegação para frente (exemplos):
    // - Passo 0 -> 1: exige verificação do CPF (cpfVerificado === true)
    // - Passo 1 -> 2: exige confirmação dos dados da pessoa
    //   (pessoaConfirmada === true)
    if (event.previouslySelectedIndex === 0 && event.selectedIndex === 1) {
      if (!this.cpfVerificado()) {
        this.bloquearSelecaoAnterior(
          event.previouslySelectedIndex,
          event.selectedIndex,
          'Verifique o CPF antes de prosseguir.',
        );
      }
      return;
    }

    // 1 -> 2: somente permitir se o usuário já confirmou os dados da pessoa
    // (clicou em "Continuar").
    if (event.previouslySelectedIndex === 1 && event.selectedIndex === 2) {
      if (!this.pessoaConfirmada()) {
        this.bloquearSelecaoAnterior(
          event.previouslySelectedIndex,
          event.selectedIndex,
          'Confirme os dados da pessoa clicando em "Continuar".',
        );
      }
      return;
    }
  }

  private bloquearSelecaoAnterior(
    prevIndex: number,
    _selectedIndex: number,
    mensagem?: string,
  ) {
    // Reverte a seleção para o índice anterior e mostra mensagem opcional
    queueMicrotask(() => {
      if (this.stepper) {
        this.stepper.selectedIndex = prevIndex;
      }
      if (mensagem) {
        this.snackBar.open(mensagem, 'Fechar', { duration: 3500 });
      }
    });
  }

  // Se o formulário correspondente ao índice informado estiver vazio
  // (ignorando controles desabilitados), resetá-lo e limpar estados de
  // interação para que mensagens de erro não sejam exibidas sem ação do usuário.
  private resetarFormularioPosteriorSeVazio(index: number) {
    let form: FormGroup | null = null;

    switch (index) {
      case 1:
        form = this.dadosPessoaisForm;
        break;
      case 2:
        form = this.dadosVoluntarioForm;
        break;
      case 3:
        form = this.dadosLoginForm;
        break;
      default:
        form = null;
    }

    if (!form) return;

    if (this.formularioEstaVazio(form)) {
      // Apenas limpar valores dos controles habilitados, preservando o estado
      // de controles desabilitados (por exemplo o CPF que costuma ficar disabled).
      Object.keys(form.controls).forEach((name) => {
        const ctrl = form.get(name);
        if (!ctrl) return;
        if (ctrl.disabled) return;
        ctrl.setValue('', { emitEvent: false });
        ctrl.setErrors(null);
        ctrl.markAsPristine({ onlySelf: true });
        ctrl.markAsUntouched({ onlySelf: true });
      });

      form.markAsPristine({ onlySelf: true });
      form.markAsUntouched({ onlySelf: true });
    }
  }

  private formularioEstaVazio(form: FormGroup): boolean {
    // Considera o formulário vazio quando todos os controles habilitados
    // têm valor '', null ou undefined.
    for (const name of Object.keys(form.controls)) {
      const ctrl = form.get(name);
      if (!ctrl) continue;
      if (ctrl.disabled) continue;
      const val = ctrl.value;
      if (val !== '' && val !== null && val !== undefined) {
        // Se for array, objeto ou outro tipo com conteúdo, consideramos preenchido
        if (Array.isArray(val) && val.length === 0) {
          continue;
        }
        if (typeof val === 'object' && val !== null) {
          // objeto vazio -> considera vazio, caso contrário preenchido
          if (Object.keys(val).length === 0) continue;
          return false;
        }
        return false;
      }
    }
    return true;
  }

  private preencherFluxoInicial() {
    if (!this.modoEdicao) {
      return;
    }

    this.preencherDadosPessoa(this.dados?.pessoa || null);
    if (this.dados?.pessoa?.cpf) {
      this.verificacaoCpfForm.patchValue(
        { cpf: this.dados.pessoa.cpf },
        { emitEvent: false },
      );
    }
  }

  private configurarPessoaEncontrada(pessoa: PessoaResposta) {
    this.pessoaEncontrada.set(pessoa);
    this.pessoaOriginal = pessoa;
    this.dadosPessoaConfirmados = this.normalizarDadosPessoa(pessoa);
    this.modoPessoaExistente.set(true);
    this.mostrarBannerPessoa.set(true);
    this.preencherDadosPessoa(pessoa);
  }

  private configurarNovaPessoa(cpf: string) {
    this.pessoaEncontrada.set(null);
    this.pessoaOriginal = null;
    this.dadosPessoaConfirmados = null;
    this.modoPessoaExistente.set(false);
    this.mostrarBannerPessoa.set(false);
    this.preencherDadosPessoaisNovaPessoa(cpf);
  }

  private preencherDadosPessoa(pessoa: PessoaResposta | null) {
    this.dadosPessoaisForm.patchValue(
      {
        nome: pessoa?.nome || '',
        cpf: pessoa?.cpf || this.dadosPessoaisForm.getRawValue().cpf || '',
        dataNascimento: pessoa?.dataNascimento || '',
      },
      { emitEvent: false },
    );

    this.dadosPessoaisForm.get('cpf')?.disable({ emitEvent: false });
  }

  private preencherDadosPessoaisNovaPessoa(cpf: string) {
    this.dadosPessoaisForm.patchValue(
      {
        nome: '',
        cpf,
        dataNascimento: '',
      },
      { emitEvent: false },
    );

    this.dadosPessoaisForm.get('cpf')?.disable({ emitEvent: false });
  }

  private avancarStep() {
    queueMicrotask(() => this.stepper?.next());
  }

  private normalizarCpf(valor: string) {
    return `${valor || ''}`.replace(/\D/g, '').slice(0, 11);
  }

  private deveAtualizarPessoa() {
    if (!this.pessoaOriginal || !this.dadosPessoaConfirmados) {
      return false;
    }

    const valores = this.normalizarDadosPessoa(
      this.dadosPessoaisForm.getRawValue(),
    );

    return (
      valores.nome !== this.dadosPessoaConfirmados.nome ||
      valores.cpf !== this.dadosPessoaConfirmados.cpf ||
      valores.dataNascimento !== this.dadosPessoaConfirmados.dataNascimento
    );
  }

  private obterPayloadAtualizacaoPessoa(): AtualizarPessoaRequest {
    const valores = this.dadosPessoaisForm.getRawValue();

    return {
      nome: valores.nome,
      cpf: valores.cpf,
      dataNascimento: valores.dataNascimento,
    };
  }

  private normalizarDadosPessoa(
    pessoa:
      | PessoaResposta
      | {
          nome?: string | null;
          cpf?: string | null;
          dataNascimento?: string | null;
        }
      | null,
  ) {
    return {
      nome: (pessoa?.nome || '').trim(),
      cpf: this.normalizarCpf(pessoa?.cpf || ''),
      dataNascimento: this.normalizarData(pessoa?.dataNascimento || ''),
    };
  }

  private normalizarData(valor: string) {
    const texto = `${valor || ''}`.trim();

    return texto.includes('T') ? texto.split('T')[0] : texto;
  }

  private obterPayloadCriacaoVoluntario(): CriarVoluntarioDto {
    const pessoa = this.dadosPessoaisForm.getRawValue();
    const voluntario = this.dadosVoluntarioForm.getRawValue();

    if (this.modoPessoaExistente() && this.pessoaOriginal) {
      return {
        pessoaId: this.pessoaOriginal.id,
        tipoVoluntario: voluntario.tipoVoluntario,
        formacaoAcademica: voluntario.formacaoAcademica || undefined,
        statusFormacao: voluntario.statusFormacao || undefined,
      } satisfies CriarVoluntarioComPessoaExistenteDto;
    }

    return {
      nome: pessoa.nome,
      cpf: pessoa.cpf,
      dataNascimento: pessoa.dataNascimento,
      tipoVoluntario: voluntario.tipoVoluntario,
      formacaoAcademica: voluntario.formacaoAcademica || undefined,
      statusFormacao: voluntario.statusFormacao || undefined,
    } satisfies CriarVoluntarioComNovaPessoaDto;
  }

  private obterPayloadAtualizacaoVoluntario(): AtualizarVoluntarioDto {
    const voluntario = this.dadosVoluntarioForm.getRawValue();

    return {
      tipoVoluntario: voluntario.tipoVoluntario,
      formacaoAcademica: voluntario.formacaoAcademica || undefined,
      statusFormacao: voluntario.statusFormacao || undefined,
    };
  }

  private senhasIguaisValidator(group: AbstractControl) {
    const senha = group.get('senha')?.value;
    const confirmarSenha = group.get('confirmarSenha')?.value;

    if (senha && confirmarSenha && senha !== confirmarSenha) {
      group.get('confirmarSenha')?.setErrors({ senhasNaoIguais: true });
      return { senhasNaoIguais: true };
    }

    if (confirmarSenha) {
      group.get('confirmarSenha')?.setErrors(null);
    }

    return null;
  }
}
