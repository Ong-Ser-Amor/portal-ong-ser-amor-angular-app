import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
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
import { NotificacaoService } from '../../../core/services/notificacao.service';
import { AtualizarVoluntarioDto, CriarVoluntarioDto } from '../../../core/models/voluntario.model';
import { Pessoa } from '../../../core/models/pessoa.model';
import { formatarCpf, limparCpf } from '../../../shared/utils/cpf.utils';
import { converterParaIsoDate } from '../../../shared/utils/data.utils';

type TipoConflitoCpf =
  | 'OUTRA_PESSOA'
  | 'VOLUNTARIO_ATIVO_CRIACAO'
  | 'OUTRO_VOLUNTARIO_EDICAO';

interface ConflitoCpfInfo {
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
  private readonly notificacao = inject(NotificacaoService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly buscaCpfSubject = new Subject<string | null>();

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
      startWith(this.formPessoa.valid || Boolean(this.pessoaExistente()))
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
    this.formPessoa.get('cpf')?.addValidators(() => {
      const conflito = this.conflitoCpf();
      if (conflito?.tipo === 'OUTRA_PESSOA' || conflito?.tipo === 'OUTRO_VOLUNTARIO_EDICAO') {
        return { cpfEmUso: true };
      }
      if (conflito?.tipo === 'VOLUNTARIO_ATIVO_CRIACAO') {
        return { voluntarioAtivo: true };
      }
      return null;
    });

    this.configurarBuscaCpfReativa();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.voluntarioId.set(id);
      this.carregarVoluntario(id);
    }
  }

  private configurarBuscaCpfReativa(): void {
    // Escuta CPF para busca reativa e desbloqueio imediato ao apagar/alterar
    this.formPessoa
      .get('cpf')
      ?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((val) => {
        const cpfLimpo = limparCpf(val);

        if (this.modoEdicao()) {
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
        } else {
          this.setConflitoCpf(null);
          this.pessoaExistente.set(null);
          this.atualizarEstadoCamposPessoa();

          if (cpfLimpo.length !== 11) {
            this.buscaCpfSubject.next(null);
          } else {
            this.buscarDadosPessoa();
          }
        }
      });

    const { estaCarregando } = this.pessoaCadastroFacade.iniciarBuscaCpfReativa<Pessoa>(
      {
        cpfSubject: this.buscaCpfSubject,
        buscarApiFn: (cpfLimpo) => this.voluntarioService.verificarCadastroPorCpf(cpfLimpo),
        getCpfAtualInput: () => this.formPessoa.get('cpf')?.value || '',
        onSucesso: (pessoa) => this.tratarSucessoBuscaPessoa(pessoa),
        onErro: (error) => this.tratarErroBuscaPessoa(error),
      },
      this.destroyRef,
    );
    this.buscandoCpf = estaCarregando;
  }

  private carregarVoluntario(id: string): void {
    this.estaCarregando.set(true);
    this.voluntarioService
      .getById(id)
      .pipe(finalize(() => this.estaCarregando.set(false)))
      .subscribe({
        next: (voluntario) => {
          const cpfLimpo = limparCpf(voluntario.pessoa.cpf);
          this.cpfOriginal.set(cpfLimpo);
          this.pessoaExistente.set(voluntario.pessoa);
          this.pessoaFormService.preencherForm(this.formPessoa, voluntario.pessoa);
          this.voluntarioFormService.preencherForm(this.formVoluntario, voluntario);
        },
        error: (err) => {
          console.error('Erro ao carregar dados do voluntário:', err);
          this.notificacao.erro('Erro ao carregar voluntário para edição.');
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

  private setConflitoCpf(conflito: ConflitoCpfInfo | null): void {
    this.conflitoCpf.set(conflito);
    this.formPessoa.get('cpf')?.updateValueAndValidity({ emitEvent: false });
  }

  private tratarSucessoBuscaPessoa(pessoa: Pessoa): void {
    if (this.modoEdicao()) {
      // Na edição, se encontrou outra pessoa no banco com esse CPF, NÃO permite a alteração
      this.setConflitoCpf({
        tipo: 'OUTRA_PESSOA',
      });
      return;
    }

    this.setConflitoCpf(null);
    this.pessoaExistente.set(pessoa);
    this.pessoaFormService.preencherForm(this.formPessoa, pessoa);
    this.atualizarEstadoCamposPessoa();
  }

  private tratarErroBuscaPessoa(error: unknown): void {
    const err = error as any;

    if (this.modoEdicao()) {
      if (err?.status === 409) {
        this.setConflitoCpf({ tipo: 'OUTRO_VOLUNTARIO_EDICAO' });
      } else {
        // 404 Not Found: nenhuma pessoa encontrada -> CPF livre para alteração!
        this.setConflitoCpf(null);
      }
      return;
    }

    this.pessoaExistente.set(null);
    this.atualizarEstadoCamposPessoa();
    if (err?.status === 409) {
      this.setConflitoCpf({ tipo: 'VOLUNTARIO_ATIVO_CRIACAO' });
    } else {
      // 404 / não encontrada: nova pessoa livre para cadastro
      this.setConflitoCpf(null);
      console.error('Erro ao buscar dados da pessoa:', error);
    }
  }

  buscarDadosPessoa(): void {
    const cpfControl = this.formPessoa.get('cpf');
    const cpfRaw = cpfControl?.value || '';
    const cpfLimpo = limparCpf(cpfRaw);

    if (cpfLimpo.length !== 11) {
      this.setConflitoCpf(null);
      this.buscaCpfSubject.next(null);
      if (!this.modoEdicao()) {
        this.pessoaExistente.set(null);
        this.atualizarEstadoCamposPessoa();
      }
      return;
    }

    if (this.modoEdicao() && cpfLimpo === this.cpfOriginal()) {
      this.setConflitoCpf(null);
      this.buscaCpfSubject.next(null);
      return;
    }

    this.buscaCpfSubject.next(cpfLimpo);
  }

  restaurarCpfOriginal(): void {
    if (this.cpfOriginal()) {
      this.formPessoa.get('cpf')?.setValue(formatarCpf(this.cpfOriginal()!));
      this.setConflitoCpf(null);
    }
  }

  salvar(): void {
    const pessoaValida = this.formPessoa.valid || Boolean(this.pessoaExistente());
    const voluntarioValido = this.formVoluntario.valid;

    if (!pessoaValida || !voluntarioValido) {
      this.formPessoa.markAllAsTouched();
      this.formVoluntario.markAllAsTouched();
      return;
    }

    this.estaSalvando.set(true);

    if (this.modoEdicao()) {
      const formVoluntarioVal = this.formVoluntario.value;
      const formPessoaVal = this.formPessoa.getRawValue();

      const payload: AtualizarVoluntarioDto = {
        nome: formPessoaVal.nome,
        cpf: limparCpf(formPessoaVal.cpf),
        dataNascimento: converterParaIsoDate(formPessoaVal.dataNascimento),
        tipoVoluntario: formVoluntarioVal.tipoVoluntario,
        formacaoAcademica: formVoluntarioVal.formacaoAcademica || undefined,
        statusFormacao: formVoluntarioVal.statusFormacao || undefined,
      };

      this.voluntarioService
        .update(this.voluntarioId()!, payload)
        .pipe(finalize(() => this.estaSalvando.set(false)))
        .subscribe({
          next: () => {
            this.notificacao.sucesso('Voluntário atualizado com sucesso!');
            this.router.navigate(['/voluntarios']);
          },
          error: (err) => {
            console.error('Erro ao atualizar voluntário:', err);
            const mensagem =
              err.error?.message || 'Erro ao atualizar voluntário. Verifique os dados e tente novamente.';
            this.notificacao.erro(mensagem);
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
        cpf: limparCpf(formPessoaVal.cpf),
        dataNascimento: converterParaIsoDate(formPessoaVal.dataNascimento),
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
          this.notificacao.sucesso('Voluntário cadastrado com sucesso!');
          this.router.navigate(['/voluntarios']);
        },
        error: (err) => {
          console.error('Erro ao cadastrar voluntário:', err);
          const mensagem =
            err.error?.message ||
            (err.status === 409
              ? 'Já existe um cadastro ativo com este CPF.'
              : 'Erro ao cadastrar voluntário. Verifique os dados e tente novamente.');
          this.notificacao.erro(mensagem);
        },
      });
  }
}
