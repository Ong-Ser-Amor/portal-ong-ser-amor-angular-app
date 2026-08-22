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
import { CriterioAvaliacaoTurma } from '../../../../../core/models/turma.model';
import {
  AtualizarTurmaMatriculaDto,
  CriarTurmaMatriculaDto,
  OPCOES_RESULTADO_FINAL_MATRICULA,
  OPCOES_STATUS_MATRICULA,
  ResultadoFinalMatricula,
  StatusMatricula,
  TurmaMatricula,
} from '../../../../../core/models/turma-matricula.model';
import { OpcaoSelect } from '../../../../../core/models/opcao-select.model';

export interface DadosModalMatricula {
  turmaId: string;
  criterioAvaliacao?: CriterioAvaliacaoTurma;
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
    { valor: '', rotulo: 'Selecione o resultado' },
    ...OPCOES_RESULTADO_FINAL_MATRICULA,
  ];

  get ehMatriculaConcluida(): boolean {
    return this.form?.get('status')?.value === 'CONCLUIDA';
  }

  get turmaAvaliaNota(): boolean {
    return this.data?.criterioAvaliacao === 'POR_NOTA_PRESENCA';
  }

  ngOnInit(): void {
    this.ehEdicao = !!this.data?.matricula;
    const matricula = this.data?.matricula;

    if (this.ehEdicao && matricula) {
      this.form = this.fb.group({
        status: [matricula.status || 'ATIVA', [Validators.required]],
        resultadoFinal: [matricula.resultadoFinal || ''],
        notaFinal: [matricula.notaFinal || ''],
        parecerPedagogico: [matricula.parecerPedagogico || '', [Validators.maxLength(500)]],
      });

      this.atualizarRegrasPorStatus(matricula.status || 'ATIVA');

      this.form.get('status')?.valueChanges.subscribe((novoStatus: StatusMatricula) => {
        this.atualizarRegrasPorStatus(novoStatus);
      });
    } else {
      this.form = this.fb.group({
        beneficiarioId: ['', [Validators.required]],
      });
      this.carregarBeneficiarios();
    }
  }

  atualizarRegrasPorStatus(status: StatusMatricula): void {
    const resultadoControl = this.form.get('resultadoFinal');
    const notaControl = this.form.get('notaFinal');

    if (!resultadoControl || !notaControl) return;

    if (status === 'CONCLUIDA') {
      resultadoControl.enable();
      if (this.turmaAvaliaNota) {
        resultadoControl.setValidators([Validators.required]);
        notaControl.enable();
        notaControl.setValidators([
          Validators.required,
          Validators.pattern(/^\d{1,5}(\.\d{1,2})?$/),
        ]);
      } else {
        resultadoControl.clearValidators();
        notaControl.disable();
        notaControl.clearValidators();
        notaControl.setValue('');
      }
    } else {
      resultadoControl.disable();
      resultadoControl.clearValidators();
      resultadoControl.setValue('');

      notaControl.disable();
      notaControl.clearValidators();
      notaControl.setValue('');
    }

    resultadoControl.updateValueAndValidity();
    notaControl.updateValueAndValidity();
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
      const status = formRaw.status as StatusMatricula;
      const ehConcluida = status === 'CONCLUIDA';

      const payload: AtualizarTurmaMatriculaDto = {
        status,
        resultadoFinal: ehConcluida && formRaw.resultadoFinal ? (formRaw.resultadoFinal as ResultadoFinalMatricula) : null,
        notaFinal: ehConcluida && this.turmaAvaliaNota && formRaw.notaFinal ? formRaw.notaFinal.toString().trim() : null,
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
            const codigo = erro?.error?.codigo;
            let mensagem = 'Erro ao atualizar a matrícula. Verifique os dados e tente novamente.';

            if (codigo === 'MATRICULA_TURMA_POSSUI_AULAS_AGENDADAS') {
              mensagem = 'Não é possível concluir a matrícula: a turma ainda possui aulas agendadas pendentes.';
            } else if (codigo === 'MATRICULA_ATIVIDADE_AVALIATIVA_PENDENTE') {
              mensagem = 'Não é possível concluir a matrícula: existem atividades com notas pendentes para este aluno.';
            } else if (codigo === 'MATRICULA_TURMA_NAO_EM_ANDAMENTO') {
              mensagem = 'Não é possível alterar a matrícula: a turma não está em andamento.';
            } else if (codigo === 'MATRICULA_RESULTADO_FINAL_OBRIGATORIO') {
              mensagem = 'É obrigatório definir o resultado final para concluir a matrícula nesta turma.';
            } else if (codigo === 'MATRICULA_NOTA_FINAL_OBRIGATORIA') {
              mensagem = 'É obrigatório informar a nota final para concluir a matrícula nesta turma.';
            }

            this.notificacao.erro(mensagem);
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
