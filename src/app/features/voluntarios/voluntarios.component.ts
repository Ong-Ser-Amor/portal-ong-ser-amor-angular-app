import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { VoluntarioService } from '../../core/services/voluntario.service';
import { VoluntarioResumo } from '../../core/models/voluntario.model';
import { CommonModule } from '@angular/common';
import { PageEvent } from '@angular/material/paginator';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { BotaoComponent } from '../../shared/components/ui/botao/botao.component';
import { CabecalhoPaginaComponent } from '../../shared/components/ui/cabecalho-pagina/cabecalho-pagina.component';
import { CardBuscaComponent } from '../../shared/components/ui/card-busca/card-busca.component';
import {
  TabelaComponent,
  ColunaTabela,
} from '../../shared/components/ui/tabela/tabela.component';
import { TabelaCelulaDirective } from '../../shared/components/ui/tabela/directives/tabela-celula.directive';
import { ModalCadastroUsuarioComponent } from './components/modal-cadastro-usuario/modal-cadastro-usuario.component';
import { ModalConfirmacaoComponent } from '../../shared/components/ui/modal-confirmacao/modal-confirmacao.component';
import { CONFIG_MODAL } from '../../shared/components/ui/modal/modal.config';
import { FiltroBuscaVoluntario } from '../../core/models/voluntario.model';
import { NotificacaoService } from '../../core/services/notificacao.service';

@Component({
  selector: 'app-voluntarios',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatDialogModule,
    BotaoComponent,
    CabecalhoPaginaComponent,
    CardBuscaComponent,
    TabelaComponent,
    TabelaCelulaDirective,
  ],
  templateUrl: './voluntarios.component.html',
  styleUrl: './voluntarios.component.scss',
})
export class VoluntariosComponent implements OnInit {
  private router = inject(Router);
  private voluntarioService = inject(VoluntarioService);
  private dialog = inject(MatDialog);
  private notificacao = inject(NotificacaoService);

  voluntarios = signal<VoluntarioResumo[]>([]);
  estaCarregando = signal(false);
  termoBusca = signal('');

  // ESTADOS DE PAGINAÇÃO
  totalItens = signal(0);
  paginaAtual = signal(1);
  itensPorPagina = signal(10);

  colunas: ColunaTabela<VoluntarioResumo>[] = [
    { chave: 'nome', titulo: 'Nome', celula: (v) => v.pessoa.nome },
    { chave: 'tipoVoluntario', titulo: 'Tipo' },
    { chave: 'formacaoAcademica', titulo: 'Formação', celula: (v) => v.formacaoAcademica || '—' },
    { chave: 'acoes', titulo: '' },
  ];

  ngOnInit(): void {
    this.carregarVoluntarios();
  }

  carregarVoluntarios() {
    this.estaCarregando.set(true);

    const termo = this.termoBusca().trim();
    const filtro: FiltroBuscaVoluntario = {
      pagina: this.paginaAtual(),
      itensPorPagina: this.itensPorPagina(),
    };

    if (termo.length > 0) {
      if (termo.length >= 3) {
        filtro.nome = termo;
      } else {
        this.estaCarregando.set(false);
        return;
      }
    }

    this.voluntarioService
      .buscarTodos(filtro)
      .subscribe({
        next: (response) => {
          this.voluntarios.set(response.dados || []);
          this.totalItens.set(response.meta?.totalItens ?? (response.dados?.length || 0));
          this.itensPorPagina.set(response.meta?.itensPorPagina ?? 10);
          this.estaCarregando.set(false);
        },
        error: (err) => {
          console.error('Erro ao carregar voluntários:', err);
          this.notificacao.erro('Erro ao carregar voluntários.');
          this.estaCarregando.set(false);
        },
      });
  }

  buscar(termo: string) {
    this.termoBusca.set(termo);
    this.paginaAtual.set(1);
    this.carregarVoluntarios();
  }

  mudarPagina(event: PageEvent) {
    this.paginaAtual.set(event.pageIndex + 1);
    this.itensPorPagina.set(event.pageSize);
    this.carregarVoluntarios();
  }

  editarVoluntario(voluntario: VoluntarioResumo) {
    this.router.navigate(['/voluntarios', 'editar', voluntario.id]);
  }


  excluirVoluntario(voluntario: VoluntarioResumo) {
    const dialogRef = this.dialog.open(ModalConfirmacaoComponent, {
      ...CONFIG_MODAL.sm,
      data: {
        titulo: 'Excluir Voluntário',
        mensagem: `Tem certeza que deseja excluir o cadastro de "${voluntario.pessoa.nome}"? Esta ação não poderá ser desfeita.`,
        tipo: 'perigo',
      },
    });

    dialogRef.afterClosed().subscribe((confirmado) => {
      if (!confirmado) return;

      this.estaCarregando.set(true);
      this.voluntarioService.delete(voluntario.id).subscribe({
        next: () => {
          this.notificacao.sucesso('Voluntário excluído com sucesso!');
          this.carregarVoluntarios();
        },
        error: (err) => {
          console.error(err);
          this.notificacao.erro('Erro ao excluir voluntário.');
          this.estaCarregando.set(false);
        },
      });
    });
  }

  abrirModalCadastroUsuario(voluntario: VoluntarioResumo) {
    const dialogRef = this.dialog.open(ModalCadastroUsuarioComponent, {
      ...CONFIG_MODAL.sm,
      data: { voluntario },
    });

    dialogRef.afterClosed().subscribe((sucesso) => {
      if (sucesso) {
        this.carregarVoluntarios();
      }
    });
  }
}
