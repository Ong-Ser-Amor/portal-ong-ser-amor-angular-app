import { Component, inject, OnInit, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';

import { InputComponent, InputType } from '../../../../../shared/components/ui/input/input.component';
import { SelectComponent } from '../../../../../shared/components/ui/select/select.component';
import { CheckboxComponent } from '../../../../../shared/components/ui/checkbox/checkbox.component';
import { ModalComponent } from '../../../../../shared/components/ui/modal/modal.component';

import { ContatoService } from '../../../../../core/services/contato.service';
import { ContatoFormService } from '../../../../../core/services/contato-form.service';
import { Beneficiario } from '../../../../../core/models/beneficiario.model';
import { AtualizarContatoDto, ContatoResposta, CriarContatoDto, OPCOES_TIPO_CONTATO, TipoContato } from '../../../../../core/models/contato.model';

export interface ModalManterContatoData {
  beneficiario: Beneficiario;
  contato?: ContatoResposta;
}

@Component({
  selector: 'app-modal-manter-contato',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatSnackBarModule,
    InputComponent,
    SelectComponent,
    CheckboxComponent,
    ModalComponent,
  ],
  templateUrl: './modal-manter-contato.component.html',
  styleUrl: './modal-manter-contato.component.scss',
})
export class ModalManterContatoComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<ModalManterContatoComponent>);
  private readonly snackBar = inject(MatSnackBar);
  private readonly contatoService = inject(ContatoService);
  private readonly contatoFormService = inject(ContatoFormService);

  readonly data = inject<ModalManterContatoData>(MAT_DIALOG_DATA);

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

    this.form.get('tipoContato')?.valueChanges.subscribe((novoTipo) => {
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
            this.snackBar.open('Canal de contato atualizado com sucesso!', 'Fechar', { duration: 3000 });
            this.dialogRef.close(true);
          },
          error: (err) => {
            console.error('Erro ao atualizar canal de contato:', err);
            const msg = err.error?.message || 'Erro ao atualizar canal de contato.';
            this.snackBar.open(msg, 'Fechar', { duration: 4000 });
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
            this.snackBar.open('Canal de contato adicionado com sucesso!', 'Fechar', { duration: 3000 });
            this.dialogRef.close(true);
          },
          error: (err) => {
            console.error('Erro ao cadastrar canal de contato:', err);
            const msg = err.error?.message || 'Erro ao cadastrar canal de contato.';
            this.snackBar.open(msg, 'Fechar', { duration: 4000 });
          },
        });
    }
  }
}
