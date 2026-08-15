import { Component, inject, OnInit, signal } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CabecalhoPaginaComponent } from '../../../shared/components/ui/cabecalho-pagina/cabecalho-pagina.component';
import { BotaoComponent } from '../../../shared/components/ui/botao/botao.component';
import { CardComponent } from '../../../shared/components/ui/card/card.component';
import { BeneficiarioService } from '../../../core/services/beneficiario.service';
import { ContatoService } from '../../../core/services/contato.service';
import {
  Beneficiario,
  BeneficiarioResumo,
  EstadoCivil,
  NivelEscolaridade,
  OPCOES_ESTADO_CIVIL,
  OPCOES_NIVEL_ESCOLARIDADE,
  OPCOES_VINCULO_EMPREGATICIO,
  VinculoEmpregaticio,
} from '../../../core/models/beneficiario.model';
import {
  FaixaRenda,
  OPCOES_FAIXA_RENDA,
  OPCOES_TIPO_MORADIA,
  TipoMoradia,
} from '../../../core/models/familia.model';
import { ContatoResposta, OPCOES_TIPO_CONTATO, TipoContato } from '../../../core/models/contato.model';
import { formatarCpf, ofuscarCpf } from '../../../shared/utils/cpf.utils';
import { formatarCep } from '../../../shared/utils/cep.utils';
import { calcularIdade, formatarData } from '../../../shared/utils/data.utils';
import { ModalEdicaoDadosBeneficiarioComponent } from './components/modal-edicao-dados-beneficiario/modal-edicao-dados-beneficiario.component';
import { ModalEdicaoContatoComponent } from './components/modal-edicao-contato/modal-edicao-contato.component';
import { ModalEdicaoEnderecoComponent } from './components/modal-edicao-endereco/modal-edicao-endereco.component';
import { CONFIG_MODAL } from '../../../shared/components/ui/modal/modal.config';

@Component({
  selector: 'app-detalhes-beneficiario',
  standalone: true,
  imports: [
    CabecalhoPaginaComponent,
    BotaoComponent,
    CardComponent,
    MatProgressBarModule,
    MatDialogModule,
    MatSnackBarModule,
  ],
  templateUrl: './detalhes-beneficiario.component.html',
  styleUrl: './detalhes-beneficiario.component.scss',
})
export class DetalhesBeneficiarioComponent implements OnInit {
  private readonly location = inject(Location);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly beneficiarioService = inject(BeneficiarioService);
  private readonly contatoService = inject(ContatoService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly ofuscarCpf = ofuscarCpf;
  readonly formatarCpf = formatarCpf;
  readonly formatarCep = formatarCep;
  readonly formatarData = formatarData;
  readonly calcularIdade = calcularIdade;

  beneficiario = signal<Beneficiario | null>(null);
  carregando = signal<boolean>(false);

  familiares = signal<BeneficiarioResumo[]>([]);
  carregandoFamiliares = signal<boolean>(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.carregarBeneficiario(id);
    }
  }

  carregarBeneficiario(id: string): void {
    this.carregando.set(true);
    this.beneficiarioService.buscarPorId(id).subscribe({
      next: (dados) => {
        this.carregando.set(false);
        this.beneficiario.set(dados);
        if (dados.familia?.id) {
          this.carregarFamiliares(dados.familia.id, dados.id);
        }
      },
      error: (erro) => {
        this.carregando.set(false);
        console.error('Erro ao carregar beneficiário:', erro);
      },
    });
  }

  carregarFamiliares(familiaId: string, beneficiarioIdAtual: string): void {
    this.carregandoFamiliares.set(true);
    this.beneficiarioService
      .buscarTodos({
        familiaId,
        ignorarId: beneficiarioIdAtual,
        itensPorPagina: 50,
      })
      .pipe(finalize(() => this.carregandoFamiliares.set(false)))
      .subscribe({
        next: (resposta) => {
          this.familiares.set(resposta.dados);
        },
        error: (erro) => {
          console.error('Erro ao carregar familiares:', erro);
          this.familiares.set([]);
        },
      });
  }

  obterVinculoFamiliar(familiar: BeneficiarioResumo): string {
    const atual = this.beneficiario();
    if (!atual) return 'Membro da Família';

    if (atual.pessoa.responsavelId === familiar.pessoa.id) {
      return 'Responsável Legal';
    }
    if (familiar.pessoa.responsavelId === atual.pessoa.id) {
      return 'Dependente';
    }
    return 'Membro da Família';
  }

  verDetalhesFamiliar(familiarId: string): void {
    this.router.navigate(['/beneficiarios', familiarId]);
  }

  obterRotuloEscolaridade(valor?: NivelEscolaridade | null): string {
    if (!valor) return '-';
    const opcao = OPCOES_NIVEL_ESCOLARIDADE.find((o) => o.valor === valor);
    return opcao ? opcao.rotulo : valor;
  }

  obterRotuloEstadoCivil(valor?: EstadoCivil | null): string {
    if (!valor) return '-';
    const opcao = OPCOES_ESTADO_CIVIL.find((o) => o.valor === valor);
    return opcao ? opcao.rotulo : valor;
  }

  obterRotuloVinculo(valor?: VinculoEmpregaticio | null): string {
    if (!valor) return '-';
    const opcao = OPCOES_VINCULO_EMPREGATICIO.find((o) => o.valor === valor);
    return opcao ? opcao.rotulo : valor;
  }

  obterRotuloFaixaRenda(valor?: FaixaRenda | null): string {
    if (!valor) return '-';
    const opcao = OPCOES_FAIXA_RENDA.find((o) => o.valor === valor);
    return opcao ? opcao.rotulo : valor;
  }

  obterRotuloTipoMoradia(valor?: TipoMoradia | null): string {
    if (!valor) return '-';
    const opcao = OPCOES_TIPO_MORADIA.find((o) => o.valor === valor);
    return opcao ? opcao.rotulo : valor;
  }

  obterRotuloTipoContato(tipo?: TipoContato | null): string {
    if (!tipo) return '-';
    const opcao = OPCOES_TIPO_CONTATO.find((o) => o.valor === tipo);
    return opcao ? opcao.rotulo : tipo;
  }

  formatarValorContato(tipo: TipoContato | string, valor: string): string {
    if (!valor) return '-';
    const limpo = valor.replace(/\D/g, '');

    if (tipo === 'CELULAR' && limpo.length === 11) {
      return `(${limpo.substring(0, 2)}) ${limpo.substring(2, 7)}-${limpo.substring(7)}`;
    }
    if (tipo === 'TELEFONE_FIXO' && limpo.length === 10) {
      return `(${limpo.substring(0, 2)}) ${limpo.substring(2, 6)}-${limpo.substring(6)}`;
    }

    return valor;
  }

  voltar(): void {
    this.location.back();
  }

  abrirModalEditarDadosPessoais(beneficiario: Beneficiario): void {
    const dialogRef = this.dialog.open(ModalEdicaoDadosBeneficiarioComponent, {
      ...CONFIG_MODAL.md,
      data: { beneficiario },
    });

    dialogRef.afterClosed().subscribe((resultado) => {
      if (resultado) {
        this.beneficiario.set(resultado);
      }
    });
  }

  abrirModalAdicionarContato(beneficiario: Beneficiario): void {
    const dialogRef = this.dialog.open(ModalEdicaoContatoComponent, {
      ...CONFIG_MODAL.sm,
      data: { beneficiario },
    });

    dialogRef.afterClosed().subscribe((sucesso) => {
      if (sucesso) {
        this.carregarBeneficiario(beneficiario.id);
      }
    });
  }

  abrirModalEditarContato(beneficiario: Beneficiario, contato: ContatoResposta): void {
    const dialogRef = this.dialog.open(ModalEdicaoContatoComponent, {
      ...CONFIG_MODAL.sm,
      data: { beneficiario, contato },
    });

    dialogRef.afterClosed().subscribe((sucesso) => {
      if (sucesso) {
        this.carregarBeneficiario(beneficiario.id);
      }
    });
  }

  abrirModalEditarEndereco(beneficiario: Beneficiario): void {
    const endereco = beneficiario.familia?.endereco;
    if (!endereco) return;

    const dialogRef = this.dialog.open(ModalEdicaoEnderecoComponent, {
      ...CONFIG_MODAL.lg,
      data: { beneficiario, endereco },
    });

    dialogRef.afterClosed().subscribe((sucesso) => {
      if (sucesso) {
        this.carregarBeneficiario(beneficiario.id);
      }
    });
  }

  confirmarExcluirContato(beneficiario: Beneficiario, contato: ContatoResposta): void {
    const contatosAtuais = beneficiario.pessoa.contatos || [];
    if (contatosAtuais.length <= 1) {
      this.snackBar.open('O beneficiário deve possuir pelo menos 1 canal de contato.', 'Fechar', { duration: 4000 });
      return;
    }

    const valorFormatado = this.formatarValorContato(contato.tipoContato, contato.valor);
    if (confirm(`Tem certeza que deseja excluir o contato ${valorFormatado}?`)) {
      this.contatoService.remover(contato.id).subscribe({
        next: () => {
          this.snackBar.open('Contato removido com sucesso!', 'Fechar', { duration: 3000 });
          this.carregarBeneficiario(beneficiario.id);
        },
        error: (err) => {
          console.error('Erro ao remover contato:', err);
          const msg = err.error?.message || 'Erro ao remover contato.';
          this.snackBar.open(msg, 'Fechar', { duration: 4000 });
        },
      });
    }
  }
}
