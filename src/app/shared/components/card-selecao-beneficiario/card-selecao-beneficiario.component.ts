import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { Subject, debounceTime, finalize } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { InputComponent } from '../input/input.component';
import { BotaoComponent } from '../botao/botao.component';
import { CardComponent } from '../card/card.component';
import { Beneficiario, FiltroBuscaBeneficiario } from '../../../core/models/beneficiario.model';
import { PessoaResposta } from '../../../core/models/pessoa.model';
import { BeneficiarioService } from '../../../core/services/beneficiario.service';

@Component({
  selector: 'app-card-selecao-beneficiario',
  standalone: true,
  imports: [
    MatIconModule,
    MatProgressBarModule,
    InputComponent,
    BotaoComponent,
    CardComponent,
  ],
  templateUrl: './card-selecao-beneficiario.component.html',
  styleUrl: './card-selecao-beneficiario.component.scss',
})
export class CardSelecaoBeneficiarioComponent implements OnInit {
  private readonly beneficiarioService = inject(BeneficiarioService);
  private readonly buscaSubject = new Subject<string>();

  // Inputs configuráveis
  titulo = input.required<string>();
  subtitulo = input<string>('');
  icone = input<string>('family_restroom');
  selecionado = input<PessoaResposta | null>(null);

  // Outputs
  selecionar = output<Beneficiario>();
  desvincular = output<void>();

  // Signals de estado interno
  buscando = signal<boolean>(false);
  erro = signal<string>('');
  nenhumEncontrado = signal<boolean>(false);
  opcoes = signal<Beneficiario[]>([]);

  ngOnInit(): void {
    this.buscaSubject
      .pipe(debounceTime(300))
      .subscribe((termo) => this.executarBusca(termo));
  }

  solicitarBusca(termo: string): void {
    this.buscaSubject.next(termo);
  }

  executarBusca(termo: string): void {
    const termoLimpo = (termo || '').trim();
    const somenteNumeros = termoLimpo.replace(/\D/g, '');
    const ehNumerico =
      somenteNumeros.length > 0 &&
      (somenteNumeros.length === termoLimpo.length ||
        termoLimpo.includes('.') ||
        termoLimpo.includes('-'));

    if (!termoLimpo) {
      this.opcoes.set([]);
      this.erro.set('');
      this.nenhumEncontrado.set(false);
      return;
    }

    const filtro: FiltroBuscaBeneficiario = {
      pagina: 1,
      itensPorPagina: 10,
    };

    if (ehNumerico) {
      if (somenteNumeros.length === 11) {
        filtro.cpf = somenteNumeros;
      } else {
        this.opcoes.set([]);
        this.nenhumEncontrado.set(false);
        this.erro.set('');
        return;
      }
    } else {
      if (termoLimpo.length >= 3) {
        filtro.nome = termoLimpo;
      } else {
        this.opcoes.set([]);
        this.nenhumEncontrado.set(false);
        this.erro.set('');
        return;
      }
    }

    this.buscando.set(true);
    this.erro.set('');
    this.nenhumEncontrado.set(false);

    this.beneficiarioService
      .buscarTodos(filtro)
      .pipe(finalize(() => this.buscando.set(false)))
      .subscribe({
        next: (resposta) => {
          const lista = resposta.dados || [];
          this.opcoes.set(lista);
          this.nenhumEncontrado.set(lista.length === 0);
        },
        error: (err) => {
          console.error('Erro ao buscar beneficiário:', err);
          this.erro.set('Erro ao realizar a busca pelo beneficiário.');
          this.opcoes.set([]);
          this.nenhumEncontrado.set(true);
        },
      });
  }

  aoSelecionar(beneficiario: Beneficiario): void {
    this.opcoes.set([]);
    this.nenhumEncontrado.set(false);
    this.erro.set('');
    this.selecionar.emit(beneficiario);
  }

  aoDesvincular(): void {
    this.opcoes.set([]);
    this.erro.set('');
    this.nenhumEncontrado.set(false);
    this.desvincular.emit();
  }
}
