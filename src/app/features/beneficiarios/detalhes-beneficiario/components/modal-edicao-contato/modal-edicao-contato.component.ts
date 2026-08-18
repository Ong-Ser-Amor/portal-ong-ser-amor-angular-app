import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs';

import { InputComponent, InputType } from '../../../../../shared/components/ui/input/input.component';
import { SelectComponent } from '../../../../../shared/components/ui/select/select.component';
import { CheckboxComponent } from '../../../../../shared/components/ui/checkbox/checkbox.component';
import { ModalComponent } from '../../../../../shared/components/ui/modal/modal.component';

import { ContatoService } from '../../../../../core/services/contato.service';
import { ContatoFormService } from '../../../../../core/services/contato-form.service';
import { NotificacaoService } from '../../../../../core/services/notificacao.service';
import { Beneficiario } from '../../../../../core/models/beneficiario.model';
import { AtualizarContatoDto, ContatoResposta, CriarContatoDto, OPCOES_TIPO_CONTATO, TipoContato } from '../../../../../core/models/contato.model';

export interface DadosModalEdicaoContato {
  beneficiario: Beneficiario;
  contato?: ContatoResposta;
}

@Component({
  selector: 'app-modal-edicao-contato',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    InputComponent,
    SelectComponent,
    CheckboxComponent,
    ModalComponent,
  ],
  templateUrl: './modal-edicao-contato.component.html',
  styleUrl: './modal-edicao-contato.component.scss',
})
export class ModalEdicaoContatoComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<ModalEdicaoContatoComponent>);
  private readonly notificacao = inject(NotificacaoService);
  private readonly contatoService = inject(ContatoService);
  private readonly contatoFormService = inject(ContatoFormService);
  private readonly destroyRef = inject(DestroyRef);

  readonly data = inject<DadosModalEdicaoContato>(MAT_DIALOG_DATA);

  readonly tiposContato = OPCOES_TIPO_CONTATO;
  salvando = signal<boolean>(false);

  form!: FormGroup;

  get ehEdicao(): boolean {
    return !!this.data.contato;
  }

  get titulo(): string {
    return this.ehEdicao ? 'Editar Canal de Contato' : 'Adicionar Canal de Contato';
  }

  ngOnInit(): void {
    const contato = this.data.contato;

    this.form = this.contatoFormService.criarForm(
      contato,
      contato?.ehPrincipal || false,
      true
    );

    this.form
      .get('tipoContato')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((novoTipo) => {
        const valorCtrl = this.form.get('valor');
        if (valorCtrl) {
          this.contatoFormService.atualizarValidadoresValor(valorCtrl, novoTipo);
        }
        if (novoTipo === 'EMAIL') {
          this.form.get('ehPrincipal')?.setValue(false, { emitEvent: false });
        }
      });
  }

  obterMascaraContato(): string {
    const tipo: TipoContato | '' = this.form?.get('tipoContato')?.value;
    return this.contatoFormService.obterMascara(tipo) || '';
  }

  obterTipoInput(): InputType {
    const tipo: TipoContato = this.form?.get('tipoContato')?.value;
    return this.contatoFormService.obterTipoInput(tipo);
  }

  fechar(): void {
    this.dialogRef.close(false);
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const dadosFormulario = this.form.value;
    const tipo: TipoContato = dadosFormulario.tipoContato;
    const valorSanitizado = this.contatoFormService.sanitizarValor(tipo, dadosFormulario.valor);

    this.salvando.set(true);

    if (this.ehEdicao && this.data.contato) {
      const dto: AtualizarContatoDto = {
        tipoContato: tipo,
        valor: valorSanitizado,
        ehPrincipal: Boolean(dadosFormulario.ehPrincipal),
      };

      this.contatoService
        .atualizar(this.data.contato.id, dto)
        .pipe(finalize(() => this.salvando.set(false)))
        .subscribe({
          next: () => {
            this.notificacao.sucesso('Contato atualizado com sucesso!');
            this.dialogRef.close(true);
          },
          error: (err) => {
            console.error('Erro ao atualizar contato:', err);
            this.notificacao.erro('Erro ao atualizar o contato. Tente novamente.');
          },
        });
    } else {
      const dto: CriarContatoDto = {
        pessoaId: this.data.beneficiario.pessoa.id,
        tipoContato: tipo,
        valor: valorSanitizado,
        ehPrincipal: Boolean(dadosFormulario.ehPrincipal),
      };

      this.contatoService
        .criar(dto)
        .pipe(finalize(() => this.salvando.set(false)))
        .subscribe({
          next: () => {
            this.notificacao.sucesso('Contato adicionado com sucesso!');
            this.dialogRef.close(true);
          },
          error: (err) => {
            console.error('Erro ao cadastrar canal de contato:', err);
            this.notificacao.erro('Erro ao cadastrar o contato. Tente novamente.');
          },
        });
    }
  }
}
