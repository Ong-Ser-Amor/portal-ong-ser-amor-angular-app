import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, finalize, map, merge, startWith } from 'rxjs';

import { CabecalhoPaginaComponent } from '../../../shared/components/ui/cabecalho-pagina/cabecalho-pagina.component';
import { CardComponent } from '../../../shared/components/ui/card/card.component';
import { BotaoComponent } from '../../../shared/components/ui/botao/botao.component';
import { AlertaComponent } from '../../../shared/components/ui/alerta/alerta.component';
import { FormularioDadosPessoaComponent } from '../../../shared/components/formularios/formulario-dados-pessoa/formulario-dados-pessoa.component';
import { FormularioDadosVoluntarioComponent } from '../../../shared/components/formularios/formulario-dados-voluntario/formulario-dados-voluntario.component';
import { PessoaFormService } from '../../../core/services/pessoa-form.service';
import { VoluntarioFormService } from '../../../core/services/voluntario-form.service';
import { VoluntarioService } from '../../../core/services/voluntario.service';
import { PessoaCadastroFacade } from '../../../core/services/pessoa-cadastro-facade.service';
import { AtualizarVoluntarioDto, CriarVoluntarioDto } from '../../../core/models/voluntario.model';
import { Pessoa } from '../../../core/models/pessoa.model';
import { formatarCpf } from '../../../shared/utils/cpf.utils';

export type TipoConflitoCpf =
  | 'OUTRA_PESSOA'
  | 'VOLUNTARIO_ATIVO_CRIACAO'
  | 'OUTRO_VOLUNTARIO_EDICAO';

export interface ConflitoCpfInfo {
  tipo: TipoConflitoCpf;
  nomePessoa?: string;
}

@Component({
  selector: 'app-cadastro-voluntario',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatProgressBarModule,
    MatIconModule,
    MatSnackBarModule,
    CabecalhoPaginaComponent,
    CardComponent,
    BotaoComponent,
    AlertaComponent,
    FormularioDadosPessoaComponent,
    FormularioDadosVoluntarioComponent,
  ],
  templateUrl: './cadastro-voluntario.component.html',
  styleUrl: './cadastro-voluntario.component.scss',
})
export class CadastroVoluntarioComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly voluntarioService = inject(VoluntarioService);
  private readonly pessoaFormService = inject(PessoaFormService);
  private readonly voluntarioFormService = inject(VoluntarioFormService);
  private readonly pessoaCadastroFacade = inject(PessoaCadastroFacade);
  private readonly snackBar = inject(MatSnackBar);

  private readonly buscaCpfSubject = new Subject<string>();

  voluntarioId = signal<string | null>(null);
  cpfOriginal = signal<string | null>(null);
  conflitoCpf = signal<ConflitoCpfInfo | null>(null);
  modoEdicao = computed(() => !!this.voluntarioId());
  estaCarregando = signal<boolean>(false);
  buscandoCpf = signal<boolean>(false);
  estaSalvando = signal<boolean>(false);
  pessoaExistente = signal<Pessoa | null>(null);

  readonly formPessoa: FormGroup = this.pessoaFormService.criarForm();
  readonly formVoluntario: FormGroup = this.voluntarioFormService.criarForm();

  readonly form: FormGroup = this.fb.group({
    pessoa: this.formPessoa,
    voluntario: this.formVoluntario,
  });

  readonly formPessoaValido = toSignal(
    merge(this.formPessoa.statusChanges, this.formPessoa.valueChanges).pipe(
      map(() => this.formPessoa.valid || Boolean(this.pessoaExistente())),
      startWith(this.formPessoa.valid)
    ),
    { initialValue: false }
  );

  readonly formVoluntarioValido = toSignal(
    merge(this.formVoluntario.statusChanges, this.formVoluntario.valueChanges).pipe(
      map(() => this.formVoluntario.valid),
      startWith(this.formVoluntario.valid)
    ),
    { initialValue: false }
  );

  readonly formularioValido = computed(() => {
    return this.formPessoaValido() && this.formVoluntarioValido();
  });

  ngOnInit(): void {
    this.configurarBuscaCpfReativa();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.voluntarioId.set(id);
      this.carregarVoluntario(id);
    }
  }

  private configurarBuscaCpfReativa(): void {
    // Escuta CPF para busca reativa e desbloqueio imediato ao apagar/alterar
    this.formPessoa.get('cpf')?.valueChanges.subscribe((val) => {
      const cpfLimpo = (val || '').replace(/\D/g, '');

      if (this.modoEdicao()) {
        // Se voltou a ser o CPF original do próprio voluntário
        if (cpfLimpo === this.cpfOriginal()) {
          this.conflitoCpf.set(null);
          this.limparErrosConflitoCpf();
          return;
        }

        if (cpfLimpo.length !== 11) {
          return;
        }

        this.buscarDadosPessoa();
      } else {
        this.conflitoCpf.set(null);
        this.pessoaExistente.set(null);
        this.limparErrosConflitoCpf();
        this.atualizarEstadoCamposPessoa();

        if (cpfLimpo.length === 11) {
          this.buscarDadosPessoa();
        }
      }
    });

    const { estaCarregando } = this.pessoaCadastroFacade.iniciarBuscaCpfReativa({
      cpfSubject: this.buscaCpfSubject,
      buscarApiFn: (cpfLimpo) => this.voluntarioService.verificarCadastroPorCpf(cpfLimpo),
      getCpfAtualInput: () => this.formPessoa.get('cpf')?.value || '',
      onSucesso: (pessoa) => this.tratarSucessoBuscaPessoa(pessoa),
      onErro: (error) => this.tratarErroBuscaPessoa(error),
    });
    this.buscandoCpf = estaCarregando;
  }

  private carregarVoluntario(id: string): void {
    this.estaCarregando.set(true);
    this.voluntarioService
      .getById(id)
      .pipe(finalize(() => this.estaCarregando.set(false)))
      .subscribe({
        next: (voluntario) => {
          const cpfLimpo = (voluntario.pessoa.cpf || '').replace(/\D/g, '');
          this.cpfOriginal.set(cpfLimpo);
          this.pessoaExistente.set(voluntario.pessoa);
          this.pessoaFormService.preencherForm(this.formPessoa, voluntario.pessoa);
          this.voluntarioFormService.preencherForm(this.formVoluntario, voluntario);
        },
        error: (err) => {
          console.error('Erro ao carregar dados do voluntário:', err);
          this.snackBar.open('Erro ao carregar voluntário para edição.', 'Fechar', {
            duration: 4000,
          });
          this.router.navigate(['/voluntarios']);
        },
      });
  }

  private atualizarEstadoCamposPessoa(): void {
    if (this.pessoaExistente()) {
      this.pessoaFormService.bloquearCamposEdicao(this.formPessoa);
    } else {
      this.pessoaFormService.desbloquearCamposEdicao(this.formPessoa);
    }
  }

  private adicionarErroCpf(chave: 'cpfEmUso' | 'voluntarioAtivo'): void {
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
    delete errors['voluntarioAtivo'];

    cpfControl.setErrors(Object.keys(errors).length > 0 ? errors : null);
  }

  private tratarSucessoBuscaPessoa(pessoa: Pessoa): void {
    if (this.modoEdicao()) {
      // Na edição, se encontrou outra pessoa no banco com esse CPF, NÃO permite a alteração
      this.conflitoCpf.set({
        tipo: 'OUTRA_PESSOA',
      });
      this.adicionarErroCpf('cpfEmUso');
      return;
    }

    this.conflitoCpf.set(null);
    this.pessoaExistente.set(pessoa);
    this.pessoaFormService.preencherForm(this.formPessoa, pessoa);
    this.atualizarEstadoCamposPessoa();
    this.snackBar.open(
      'Pessoa identificada no sistema! Dados pessoais preenchidos automaticamente.',
      'Fechar',
      { duration: 4000 }
    );
  }

  private tratarErroBuscaPessoa(error: unknown): void {
    const err = error as any;

    if (this.modoEdicao()) {
      if (err?.status === 409) {
        this.conflitoCpf.set({ tipo: 'OUTRO_VOLUNTARIO_EDICAO' });
        this.adicionarErroCpf('cpfEmUso');
      } else {
        // 404 Not Found: nenhuma pessoa encontrada -> CPF livre para alteração!
        this.conflitoCpf.set(null);
        this.limparErrosConflitoCpf();
      }
      return;
    }

    this.pessoaExistente.set(null);
    this.atualizarEstadoCamposPessoa();
    if (err?.status === 409) {
      this.conflitoCpf.set({ tipo: 'VOLUNTARIO_ATIVO_CRIACAO' });
      this.adicionarErroCpf('voluntarioAtivo');
    } else {
      // 404 / não encontrada: nova pessoa livre para cadastro
      this.conflitoCpf.set(null);
      this.limparErrosConflitoCpf();
      console.error('Erro ao buscar dados da pessoa:', error);
    }
  }

  buscarDadosPessoa(): void {
    const cpfControl = this.formPessoa.get('cpf');
    const cpfRaw = cpfControl?.value || '';
    const cpfLimpo = cpfRaw.replace(/\D/g, '');

    if (cpfLimpo.length !== 11) {
      if (!this.modoEdicao()) {
        this.conflitoCpf.set(null);
        this.pessoaExistente.set(null);
        this.limparErrosConflitoCpf();
        this.atualizarEstadoCamposPessoa();
      }
      return;
    }

    if (this.modoEdicao() && cpfLimpo === this.cpfOriginal()) {
      this.conflitoCpf.set(null);
      this.limparErrosConflitoCpf();
      return;
    }

    this.buscaCpfSubject.next(cpfLimpo);
  }

  restaurarCpfOriginal(): void {
    if (this.cpfOriginal()) {
      this.formPessoa.get('cpf')?.setValue(formatarCpf(this.cpfOriginal()!));
      this.conflitoCpf.set(null);
      this.limparErrosConflitoCpf();
    }
  }

  salvar(): void {
    if (!this.formularioValido()) {
      this.formPessoa.markAllAsTouched();
      this.formVoluntario.markAllAsTouched();
      this.snackBar.open('Por favor, preencha corretamente os campos obrigatórios em destaque.', 'Fechar', {
        duration: 4000,
      });
      return;
    }

    this.estaSalvando.set(true);

    if (this.modoEdicao()) {
      const formVoluntarioVal = this.formVoluntario.value;
      const formPessoaVal = this.formPessoa.getRawValue();

      const payload: AtualizarVoluntarioDto = {
        nome: formPessoaVal.nome,
        cpf: (formPessoaVal.cpf || '').replace(/\D/g, ''),
        dataNascimento: formPessoaVal.dataNascimento,
        tipoVoluntario: formVoluntarioVal.tipoVoluntario,
        formacaoAcademica: formVoluntarioVal.formacaoAcademica || undefined,
        statusFormacao: formVoluntarioVal.statusFormacao || undefined,
      };

      this.voluntarioService
        .update(this.voluntarioId()!, payload)
        .pipe(finalize(() => this.estaSalvando.set(false)))
        .subscribe({
          next: () => {
            this.snackBar.open('Voluntário atualizado com sucesso!', 'Fechar', { duration: 3000 });
            this.router.navigate(['/voluntarios']);
          },
          error: (err) => {
            console.error('Erro ao atualizar voluntário:', err);
            const mensagem =
              err.error?.message || 'Erro ao atualizar voluntário. Verifique os dados e tente novamente.';
            this.snackBar.open(mensagem, 'Fechar', { duration: 5000 });
          },
        });
      return;
    }

    const formVoluntarioVal = this.formVoluntario.value;
    let payload: CriarVoluntarioDto;

    if (this.pessoaExistente()) {
      payload = {
        pessoaId: this.pessoaExistente()!.id,
        tipoVoluntario: formVoluntarioVal.tipoVoluntario,
        formacaoAcademica: formVoluntarioVal.formacaoAcademica || undefined,
        statusFormacao: formVoluntarioVal.statusFormacao || undefined,
      };
    } else {
      const formPessoaVal = this.formPessoa.getRawValue();
      payload = {
        nome: formPessoaVal.nome,
        cpf: (formPessoaVal.cpf || '').replace(/\D/g, ''),
        dataNascimento: formPessoaVal.dataNascimento,
        tipoVoluntario: formVoluntarioVal.tipoVoluntario,
        formacaoAcademica: formVoluntarioVal.formacaoAcademica || undefined,
        statusFormacao: formVoluntarioVal.statusFormacao || undefined,
      };
    }

    this.voluntarioService
      .create(payload)
      .pipe(finalize(() => this.estaSalvando.set(false)))
      .subscribe({
        next: () => {
          this.snackBar.open('Voluntário cadastrado com sucesso!', 'Fechar', { duration: 3000 });
          this.router.navigate(['/voluntarios']);
        },
        error: (err) => {
          console.error('Erro ao cadastrar voluntário:', err);
          const mensagem =
            err.error?.message ||
            (err.status === 409
              ? 'Já existe um cadastro ativo com este CPF.'
              : 'Erro ao cadastrar voluntário. Verifique os dados e tente novamente.');
          this.snackBar.open(mensagem, 'Fechar', { duration: 5000 });
        },
      });
  }
}

