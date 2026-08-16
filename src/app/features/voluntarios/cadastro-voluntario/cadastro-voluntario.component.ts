import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, finalize, map, merge, startWith } from 'rxjs';

import { CabecalhoPaginaComponent } from '../../../shared/components/ui/cabecalho-pagina/cabecalho-pagina.component';
import { CardComponent } from '../../../shared/components/ui/card/card.component';
import { BotaoComponent } from '../../../shared/components/ui/botao/botao.component';
import { FormularioDadosPessoaComponent } from '../../../shared/components/formularios/formulario-dados-pessoa/formulario-dados-pessoa.component';
import { FormularioDadosVoluntarioComponent } from '../../../shared/components/formularios/formulario-dados-voluntario/formulario-dados-voluntario.component';
import { PessoaFormService } from '../../../core/services/pessoa-form.service';
import { VoluntarioFormService } from '../../../core/services/voluntario-form.service';
import { VoluntarioService } from '../../../core/services/voluntario.service';
import { PessoaCadastroFacade } from '../../../core/services/pessoa-cadastro-facade.service';
import { CriarVoluntarioDto } from '../../../core/models/voluntario.model';
import { Pessoa } from '../../../core/models/pessoa.model';

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
    FormularioDadosPessoaComponent,
    FormularioDadosVoluntarioComponent,
  ],
  templateUrl: './cadastro-voluntario.component.html',
  styleUrl: './cadastro-voluntario.component.scss',
})
export class CadastroVoluntarioComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly voluntarioService = inject(VoluntarioService);
  private readonly pessoaFormService = inject(PessoaFormService);
  private readonly voluntarioFormService = inject(VoluntarioFormService);
  private readonly pessoaCadastroFacade = inject(PessoaCadastroFacade);
  private readonly snackBar = inject(MatSnackBar);

  private readonly buscaCpfSubject = new Subject<string>();

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
    // Escuta CPF para busca reativa e desbloqueio imediato ao apagar/alterar
    this.formPessoa.get('cpf')?.valueChanges.subscribe((val) => {
      this.pessoaExistente.set(null);
      this.atualizarEstadoCamposPessoa();

      const cpfLimpo = (val || '').replace(/\D/g, '');
      if (cpfLimpo.length === 11) {
        this.buscarDadosPessoa();
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

  private atualizarEstadoCamposPessoa(): void {
    if (this.pessoaExistente()) {
      this.pessoaFormService.bloquearCamposEdicao(this.formPessoa);
    } else {
      this.pessoaFormService.desbloquearCamposEdicao(this.formPessoa);
    }
  }

  private tratarSucessoBuscaPessoa(pessoa: Pessoa): void {
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
    this.pessoaExistente.set(null);
    this.atualizarEstadoCamposPessoa();
    const err = error as any;
    if (err?.status === 409) {
      const mensagem = err.error?.message || 'Esta pessoa já possui um cadastro de voluntário ativo no sistema.';
      this.snackBar.open(mensagem, 'Fechar', { duration: 5000 });
      this.formPessoa.get('cpf')?.setErrors({ voluntarioAtivo: true });
    } else {
      // 404 / não encontrada: nova pessoa
      console.error('Erro ao buscar dados da pessoa:', error);
    }
  }

  buscarDadosPessoa(): void {
    const cpfControl = this.formPessoa.get('cpf');
    const cpfRaw = cpfControl?.value || '';
    const cpfLimpo = cpfRaw.replace(/\D/g, '');

    if (cpfLimpo.length !== 11 || cpfControl?.invalid) {
      this.pessoaExistente.set(null);
      this.atualizarEstadoCamposPessoa();
      return;
    }

    this.buscaCpfSubject.next(cpfLimpo);
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

    this.estaSalvando.set(true);

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
