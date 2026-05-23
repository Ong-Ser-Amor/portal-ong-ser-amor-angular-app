import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ViewChild,
  inject,
  OnInit,
  signal,
} from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { finalize } from 'rxjs';
import { ValidacaoCpfStepComponent } from '../validacao-cpf-step/validacao-cpf-step.component';
import { LoginFormComponent } from '../../../../shared/components/login-form/login-form.component';
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
import { PessoaResposta } from '../../../../core/models/pessoa.model';
import { CreateUsuarioRequest } from '../../../../core/models/usuario.model';
import { DadosPessoaStepComponent } from '../dados-pessoa-step/dados-pessoa-step.component';
import { DadosVoluntarioStepComponent } from '../dados-voluntario-step/dados-voluntario-step.component';

@Component({
  selector: 'app-voluntario-form',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatStepperModule,
    MatButtonModule,
    ValidacaoCpfStepComponent,
    DadosPessoaStepComponent,
    DadosVoluntarioStepComponent,
    LoginFormComponent,
  ],
  templateUrl: './voluntario-form.component.html',
  styleUrl: './voluntario-form.component.scss',
})
export class VoluntarioFormComponent implements OnInit, AfterViewInit {
  @ViewChild(MatStepper) private stepper?: MatStepper;

  private voluntarioService = inject(VoluntarioService);
  private pessoaService = inject(PessoaService);
  private usuarioService = inject(UsuarioService);
  private dialogRef = inject(MatDialogRef<VoluntarioFormComponent>);
  private snackBar = inject(MatSnackBar);

  dados = inject<Voluntario | null>(MAT_DIALOG_DATA);

  modoEdicao = false;
  estaProcessando = signal(false);
  buscandoCpf = signal(false);

  // ESTADO DA PESSOA CENTRALIZADO
  pessoaOriginal = signal<PessoaResposta | null>(null);
  dadosPessoaisPreenchidos = signal<{
    nome: string;
    cpf: string;
    dataNascimento: string;
  }>({ nome: '', cpf: '', dataNascimento: '' });

  modoPessoaExistente = signal(false);
  cpfVerificado = signal(false);
  pessoaConfirmada = signal(false);
  voluntarioSalvo = signal<Voluntario | null>(null);

  // ESTADO DO VOLUNTÁRIO CENTRALIZADO
  dadosVoluntarioPreenchidos = signal<{
    formacaoAcademica: string;
    statusFormacao: string;
    tipoVoluntario: string;
  }>({ formacaoAcademica: '', statusFormacao: '', tipoVoluntario: '' });

  ngOnInit(): void {
    this.modoEdicao = !!this.dados;

    // Inicializa os dados do voluntário para o Passo 3
    this.dadosVoluntarioPreenchidos.set({
      formacaoAcademica: this.dados?.formacaoAcademica || '',
      statusFormacao: this.dados?.statusFormacao || '',
      tipoVoluntario: this.dados?.tipoVoluntario || '',
    });

    this.preencherFluxoInicial();
  }

  ngAfterViewInit(): void {
    if (this.modoEdicao) {
      queueMicrotask(() => {
        if (this.stepper) this.stepper.selectedIndex = 0;
      });
    }
  }

  get voluntarioSalvoNonNull(): Voluntario {
    return this.voluntarioSalvo() as Voluntario;
  }

  verificarCpf(cpfDigitado: string) {
    if (this.modoEdicao) {
      this.avancarStep();
      return;
    }

    const cpf = cpfDigitado || '';

    if (cpf.length !== 11) {
      this.snackBar.open('CPF deve conter 11 dígitos.', 'Fechar', {
        duration: 3000,
      });
      return;
    }

    this.buscandoCpf.set(true);

    this.pessoaService
      .verificarCadastroVoluntarioPorCpf(cpfDigitado)
      .pipe(finalize(() => this.buscandoCpf.set(false)))
      .subscribe({
        next: (pessoa) => {
          this.cpfVerificado.set(true);
          this.configurarPessoa(pessoa, true);
          this.avancarStep();
        },
        error: (error) => {
          if (error?.status === 404) {
            this.cpfVerificado.set(true);
            this.configurarPessoa(
              { cpf: cpfDigitado, nome: '', dataNascimento: '' } as any,
              false,
            );
            this.avancarStep();
            return;
          }

          if (error?.status === 400) {
            this.snackBar.open('CPF inválido.', 'Fechar', { duration: 4000 });
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

  continuarDadosPessoais(novosDados: {
    nome: string;
    cpf: string;
    dataNascimento: string;
  }) {
    this.dadosPessoaisPreenchidos.set(novosDados);

    const pessoaAntiga = this.pessoaOriginal();

    if (pessoaAntiga && this.deveAtualizarPessoa(novosDados)) {
      this.estaProcessando.set(true);

      this.pessoaService
        .atualizar(pessoaAntiga.id, novosDados)
        .pipe(finalize(() => this.estaProcessando.set(false)))
        .subscribe({
          next: (pessoaAtualizada) => {
            this.pessoaOriginal.set(pessoaAtualizada);
            this.snackBar.open('Dados da pessoa atualizados!', 'Fechar', {
              duration: 3000,
            });
            this.pessoaConfirmada.set(true);
            this.avancarStep();
          },
          error: () =>
            this.snackBar.open(
              'Erro ao atualizar os dados da pessoa.',
              'Fechar',
            ),
        });
      return;
    }

    this.pessoaConfirmada.set(true);
    this.avancarStep();
  }

  salvarVoluntario(dadosSubmetidos: {
    formacaoAcademica: string;
    statusFormacao: string;
    tipoVoluntario: string;
  }) {
    this.estaProcessando.set(true);

    const payloadAtualizacao: AtualizarVoluntarioDto = {
      formacaoAcademica: dadosSubmetidos.formacaoAcademica || undefined,
      statusFormacao:
        (dadosSubmetidos.statusFormacao as NivelFormacao) || undefined,
      tipoVoluntario: dadosSubmetidos.tipoVoluntario as TipoVoluntario,
    };

    if (this.modoEdicao) {
      this.voluntarioService
        .update(this.dados!.id, payloadAtualizacao)
        .pipe(finalize(() => this.estaProcessando.set(false)))
        .subscribe({
          next: (vol) => {
            this.voluntarioSalvo.set(vol);
            this.snackBar.open('Voluntário atualizado!', 'Fechar', {
              duration: 3000,
            });
            this.dialogRef.close(true);
          },
          error: () =>
            this.snackBar.open('Erro ao salvar voluntário.', 'Fechar'),
        });
      return;
    }

    this.voluntarioService
      .create(this.obterPayloadCriacaoVoluntario(dadosSubmetidos))
      .pipe(finalize(() => this.estaProcessando.set(false)))
      .subscribe({
        next: (vol) => {
          this.voluntarioSalvo.set(vol);
          this.snackBar.open('Voluntário criado!', 'Fechar', {
            duration: 3000,
          });
          this.avancarStep();
        },
        error: () => this.snackBar.open('Erro ao salvar voluntário.', 'Fechar'),
      });
  }

  salvarLogin(dados: { email: string; senha: string }) {
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
      email: dados.email,
      senha: dados.senha,
    };

    this.usuarioService
      .create(payload)
      .pipe(finalize(() => this.estaProcessando.set(false)))
      .subscribe({
        next: () => {
          this.snackBar.open(
            'Voluntário e Login criados com sucesso!',
            'Fechar',
            {
              duration: 3000,
            },
          );
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

  ignorarLoginEFinalizar() {
    this.dialogRef.close(true);
  }

  voltarStepAnterior() {
    this.stepper?.previous();
  }

  private preencherFluxoInicial() {
    if (this.modoEdicao && this.dados?.pessoa) {
      this.cpfVerificado.set(true);
      this.configurarPessoa(this.dados.pessoa, true);
    }
  }

  private configurarPessoa(pessoa: PessoaResposta, existeNoBd: boolean) {
    this.pessoaOriginal.set(existeNoBd ? pessoa : null);
    this.modoPessoaExistente.set(existeNoBd);

    this.dadosPessoaisPreenchidos.set({
      nome: pessoa.nome || '',
      cpf: pessoa.cpf || '',
      dataNascimento: this.normalizarData(pessoa.dataNascimento || ''),
    });
  }

  private deveAtualizarPessoa(novosDados: any): boolean {
    const pOriginal = this.pessoaOriginal();
    if (!pOriginal) return false;

    const dataOriginalNormalizada = this.normalizarData(
      pOriginal.dataNascimento || '',
    );

    return (
      novosDados.nome !== pOriginal.nome ||
      novosDados.dataNascimento !== dataOriginalNormalizada
    );
  }

  private normalizarData(valor: string) {
    const texto = `${valor || ''}`.trim();
    return texto.includes('T') ? texto.split('T')[0] : texto;
  }

  private obterPayloadCriacaoVoluntario(dadosSubmetidos: {
    formacaoAcademica: string;
    statusFormacao: string;
    tipoVoluntario: string;
  }): CriarVoluntarioDto {
    const dadosPessoa = this.dadosPessoaisPreenchidos();

    if (this.modoPessoaExistente() && this.pessoaOriginal()) {
      return {
        pessoaId: this.pessoaOriginal()!.id,
        tipoVoluntario: dadosSubmetidos.tipoVoluntario as TipoVoluntario,
        formacaoAcademica: dadosSubmetidos.formacaoAcademica || undefined,
        statusFormacao:
          (dadosSubmetidos.statusFormacao as NivelFormacao) || undefined,
      } satisfies CriarVoluntarioComPessoaExistenteDto;
    }

    return {
      nome: dadosPessoa.nome,
      cpf: dadosPessoa.cpf,
      dataNascimento: dadosPessoa.dataNascimento,
      tipoVoluntario: dadosSubmetidos.tipoVoluntario as TipoVoluntario,
      formacaoAcademica: dadosSubmetidos.formacaoAcademica || undefined,
      statusFormacao:
        (dadosSubmetidos.statusFormacao as NivelFormacao) || undefined,
    } satisfies CriarVoluntarioComNovaPessoaDto;
  }

  private avancarStep() {
    setTimeout(() => this.stepper?.next());
  }

  aoMudarSelecaoStepper(event: StepperSelectionEvent) {
    if (event.previouslySelectedIndex > event.selectedIndex) {
      if (!this.modoEdicao && event.previouslySelectedIndex === 3) {
        this.bloquearSelecaoAnterior(
          event.previouslySelectedIndex,
          event.selectedIndex,
          'Não é possível voltar do passo de Login.',
        );
        return;
      }
      return;
    }

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
    queueMicrotask(() => {
      if (this.stepper) {
        this.stepper.selectedIndex = prevIndex;
      }
      if (mensagem) {
        this.snackBar.open(mensagem, 'Fechar', { duration: 3500 });
      }
    });
  }
}
