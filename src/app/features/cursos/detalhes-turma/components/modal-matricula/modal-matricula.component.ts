import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs';

import { ModalComponent } from '../../../../../shared/components/ui/modal/modal.component';
import { InputComponent } from '../../../../../shared/components/ui/input/input.component';
import { SelectComponent } from '../../../../../shared/components/ui/select/select.component';
import { TurmaMatriculaService } from '../../../../../core/services/turma-matricula.service';
import { BeneficiarioService } from '../../../../../core/services/beneficiario.service';
import { NotificacaoService } from '../../../../../core/services/notificacao.service';
import {
  AtualizarTurmaMatriculaDto,
  CriarTurmaMatriculaDto,
  OPCOES_RESULTADO_FINAL_MATRICULA,
  OPCOES_STATUS_MATRICULA,
  ResultadoFinalMatricula,
  TurmaMatricula,
} from '../../../../../core/models/turma-matricula.model';
import { OpcaoSelect } from '../../../../../core/models/opcao-select.model';

export interface DadosModalMatricula {
  turmaId: string;
  matricula?: TurmaMatricula | null;
  matriculadosJaIds?: string[];
}

@Component({
  selector: 'app-modal-matricula',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalComponent,
    InputComponent,
    SelectComponent,
  ],
  templateUrl: './modal-matricula.component.html',
  styleUrl: './modal-matricula.component.scss',
})
export class ModalMatriculaComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly turmaMatriculaService = inject(TurmaMatriculaService);
  private readonly beneficiarioService = inject(BeneficiarioService);
  private readonly dialogRef = inject(MatDialogRef<ModalMatriculaComponent>);
  private readonly notificacao = inject(NotificacaoService);

  readonly data = inject<DadosModalMatricula>(MAT_DIALOG_DATA);

  form!: FormGroup;
  ehEdicao = false;
  salvando = signal<boolean>(false);
  carregandoBeneficiarios = signal<boolean>(false);
  opcoesBeneficiarios = signal<OpcaoSelect<string>[]>([]);

  readonly opcoesStatusMatricula = OPCOES_STATUS_MATRICULA;
  readonly opcoesResultadoFinal: OpcaoSelect<string>[] = [
    { valor: '', rotulo: 'Nenhum / Em Andamento' },
    ...OPCOES_RESULTADO_FINAL_MATRICULA,
  ];

  ngOnInit(): void {
    this.ehEdicao = !!this.data?.matricula;
    const matricula = this.data?.matricula;

    if (this.ehEdicao && matricula) {
      this.form = this.fb.group({
        status: [matricula.status || 'ATIVA', [Validators.required]],
        resultadoFinal: [matricula.resultadoFinal || ''],
        notaFinal: [matricula.notaFinal || ''],
        parecerPedagogico: [matricula.parecerPedagogico || ''],
      });
    } else {
      this.form = this.fb.group({
        beneficiarioId: ['', [Validators.required]],
      });
      this.carregarBeneficiarios();
    }
  }

  carregarBeneficiarios(): void {
    this.carregandoBeneficiarios.set(true);

    this.beneficiarioService
      .buscarTodos({ pagina: 1, itensPorPagina: 100 })
      .pipe(finalize(() => this.carregandoBeneficiarios.set(false)))
      .subscribe({
        next: (resposta) => {
          const jaMatriculados = new Set(this.data?.matriculadosJaIds || []);
          const lista = (resposta.dados || [])
            .filter((beneficiario) => !jaMatriculados.has(beneficiario.id))
            .map((beneficiario) => ({
              valor: beneficiario.id,
              rotulo: beneficiario.pessoa.nome,
            }));

          this.opcoesBeneficiarios.set(lista);
        },
        error: (erro) => {
          console.error('Erro ao buscar beneficiários:', erro);
          this.notificacao.erro('Erro ao carregar lista de beneficiários.');
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

    this.salvando.set(true);
    const formRaw = this.form.getRawValue();

    if (this.ehEdicao && this.data.matricula) {
      const payload: AtualizarTurmaMatriculaDto = {
        status: formRaw.status,
        resultadoFinal: formRaw.resultadoFinal ? (formRaw.resultadoFinal as ResultadoFinalMatricula) : null,
        notaFinal: formRaw.notaFinal ? formRaw.notaFinal.toString() : null,
        parecerPedagogico: formRaw.parecerPedagogico?.trim() || null,
      };

      this.turmaMatriculaService
        .atualizar(this.data.matricula.id, payload)
        .pipe(finalize(() => this.salvando.set(false)))
        .subscribe({
          next: () => {
            this.notificacao.sucesso('Matrícula atualizada com sucesso!');
            this.dialogRef.close(true);
          },
          error: (erro) => {
            console.error('Erro ao atualizar matrícula:', erro);
            this.notificacao.erro('Erro ao atualizar a matrícula. Tente novamente.');
          },
        });
    } else {
      const payload: CriarTurmaMatriculaDto = {
        turmaId: this.data.turmaId,
        beneficiarioId: formRaw.beneficiarioId,
      };

      this.turmaMatriculaService
        .criar(payload)
        .pipe(finalize(() => this.salvando.set(false)))
        .subscribe({
          next: () => {
            this.notificacao.sucesso('Aluno matriculado com sucesso!');
            this.dialogRef.close(true);
          },
          error: (erro) => {
            console.error('Erro ao matricular aluno:', erro);
            this.notificacao.erro('Erro ao matricular o aluno. Tente novamente.');
          },
        });
    }
  }
}
