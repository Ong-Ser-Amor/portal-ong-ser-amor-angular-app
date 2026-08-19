import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs';

import { ModalComponent } from '../../../../../shared/components/ui/modal/modal.component';
import { SelectComponent } from '../../../../../shared/components/ui/select/select.component';
import { TurmaService } from '../../../../../core/services/turma.service';
import { VoluntarioService } from '../../../../../core/services/voluntario.service';
import { NotificacaoService } from '../../../../../core/services/notificacao.service';
import { OpcaoSelect } from '../../../../../core/models/opcao-select.model';

export interface DadosModalVincularProfessor {
  turmaId: string;
  professoresJaVinculadosIds: string[];
}

@Component({
  selector: 'app-modal-vincular-professor',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalComponent,
    SelectComponent,
  ],
  templateUrl: './modal-vincular-professor.component.html',
  styleUrl: './modal-vincular-professor.component.scss',
})
export class ModalVincularProfessorComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly turmaService = inject(TurmaService);
  private readonly voluntarioService = inject(VoluntarioService);
  private readonly dialogRef = inject(MatDialogRef<ModalVincularProfessorComponent>);
  private readonly notificacao = inject(NotificacaoService);

  readonly data = inject<DadosModalVincularProfessor>(MAT_DIALOG_DATA);

  form!: FormGroup;
  salvando = signal<boolean>(false);
  carregandoVoluntarios = signal<boolean>(false);
  opcoesVoluntarios = signal<OpcaoSelect<string>[]>([]);

  ngOnInit(): void {
    this.form = this.fb.group({
      professorId: ['', [Validators.required]],
    });

    this.carregarVoluntarios();
  }

  carregarVoluntarios(): void {
    this.carregandoVoluntarios.set(true);

    this.voluntarioService
      .buscarTodos({ pagina: 1, itensPorPagina: 100 })
      .pipe(finalize(() => this.carregandoVoluntarios.set(false)))
      .subscribe({
        next: (resposta) => {
          const vinculadosIds = new Set(this.data?.professoresJaVinculadosIds || []);
          const lista = (resposta.dados || [])
            .filter((voluntario) => !vinculadosIds.has(voluntario.id))
            .map((voluntario) => ({
              valor: voluntario.id,
              rotulo: voluntario.pessoa.nome,
            }));

          this.opcoesVoluntarios.set(lista);
        },
        error: (erro) => {
          console.error('Erro ao buscar voluntários:', erro);
          this.notificacao.erro('Erro ao carregar lista de voluntários.');
        },
      });
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { professorId } = this.form.getRawValue();
    this.salvando.set(true);

    this.turmaService
      .vincularProfessor(this.data.turmaId, professorId)
      .pipe(finalize(() => this.salvando.set(false)))
      .subscribe({
        next: () => {
          this.notificacao.sucesso('Professor vinculado com sucesso!');
          this.dialogRef.close(true);
        },
        error: (erro) => {
          console.error('Erro ao vincular professor:', erro);
          const mensagem = erro?.error?.message || 'Erro ao vincular professor à turma.';
          this.notificacao.erro(mensagem);
        },
      });
  }
}
