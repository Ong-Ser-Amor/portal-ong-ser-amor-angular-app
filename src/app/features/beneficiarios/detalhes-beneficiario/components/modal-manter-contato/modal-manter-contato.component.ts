import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';

import { InputComponent, InputType } from '../../../../../shared/components/input/input.component';
import { SelectComponent } from '../../../../../shared/components/select/select.component';
import { CheckboxComponent } from '../../../../../shared/components/checkbox/checkbox.component';
import { ModalComponent } from '../../../../../shared/components/modal/modal.component';

import { ContatoService } from '../../../../../core/services/contato.service';
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
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<ModalManterContatoComponent>);
  private readonly snackBar = inject(MatSnackBar);
  private readonly contatoService = inject(ContatoService);

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

    this.form = this.fb.group({
      tipoContato: [contato?.tipoContato || '', [Validators.required]],
      valor: [contato?.valor || '', [Validators.required]],
      ehPrincipal: [contato?.ehPrincipal || false],
    });

    this.atualizarValidadoresValor(this.form.get('tipoContato')?.value);

    this.form.get('tipoContato')?.valueChanges.subscribe((novoTipo) => {
      this.atualizarValidadoresValor(novoTipo);
      if (novoTipo === 'EMAIL') {
        this.form.get('ehPrincipal')?.setValue(false, { emitEvent: false });
      }
    });
  }

  obterMascaraContato(): string {
    const tipo: TipoContato | '' = this.form?.get('tipoContato')?.value;
    if (tipo === 'CELULAR') return 'celular';
    if (tipo === 'TELEFONE_FIXO') return 'telefone_fixo';
    return '';
  }

  obterTipoInput(): InputType {
    const tipo: TipoContato = this.form?.get('tipoContato')?.value;
    return tipo === 'EMAIL' ? 'email' : 'text';
  }

  private atualizarValidadoresValor(tipo: TipoContato): void {
    const valorCtrl = this.form.get('valor');
    if (!valorCtrl) return;

    if (tipo === 'EMAIL') {
      valorCtrl.setValidators([Validators.required, Validators.email]);
    } else if (tipo === 'CELULAR') {
      valorCtrl.setValidators([Validators.required, Validators.pattern(/^\(\d{2}\)\s\d{5}-\d{4}$|^\d{11}$/)]);
    } else if (tipo === 'TELEFONE_FIXO') {
      valorCtrl.setValidators([Validators.required, Validators.pattern(/^\(\d{2}\)\s\d{4}-\d{4}$|^\d{10}$/)]);
    } else {
      valorCtrl.setValidators([Validators.required]);
    }

    valorCtrl.updateValueAndValidity({ emitEvent: false });
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
    const valorSanitizado = tipo === 'EMAIL'
      ? dadosFormulario.valor.trim()
      : (dadosFormulario.valor || '').replace(/\D/g, '');

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
