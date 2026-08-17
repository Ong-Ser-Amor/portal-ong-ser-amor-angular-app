import { Component, inject, OnInit, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs';

import { ModalComponent } from '../../../../../shared/components/ui/modal/modal.component';
import { FormularioEnderecoComponent } from '../../../../../shared/components/formularios/formulario-endereco/formulario-endereco.component';
import { EnderecoService } from '../../../../../core/services/endereco.service';
import { EnderecoFormService } from '../../../../../core/services/endereco-form.service';
import { NotificacaoService } from '../../../../../core/services/notificacao.service';
import { Beneficiario } from '../../../../../core/models/beneficiario.model';
import { AtualizarEnderecoDto, Endereco } from '../../../../../core/models/endereco.model';

export interface ModalEdicaoEnderecoData {
  beneficiario: Beneficiario;
  endereco: Endereco;
}

@Component({
  selector: 'app-modal-edicao-endereco',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    ModalComponent,
    FormularioEnderecoComponent,
  ],
  templateUrl: './modal-edicao-endereco.component.html',
  styleUrl: './modal-edicao-endereco.component.scss',
})
export class ModalEdicaoEnderecoComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<ModalEdicaoEnderecoComponent>);
  private readonly notificacao = inject(NotificacaoService);
  private readonly enderecoService = inject(EnderecoService);
  private readonly enderecoFormService = inject(EnderecoFormService);

  readonly data = inject<ModalEdicaoEnderecoData>(MAT_DIALOG_DATA);

  salvando = signal<boolean>(false);
  form!: FormGroup;

  ngOnInit(): void {
    this.form = this.enderecoFormService.criarForm(this.data.endereco);
  }

  fechar(): void {
    this.dialogRef.close(false);
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const valorForm = this.form.value;
    const dto: AtualizarEnderecoDto = {
      logradouro: valorForm.logradouro,
      numero: valorForm.numero || null,
      complemento: valorForm.complemento || null,
      bairro: valorForm.bairro,
      cep: (valorForm.cep || '').replace(/\D/g, ''),
      cidade: valorForm.cidade,
      uf: valorForm.uf,
    };

    this.salvando.set(true);

    this.enderecoService
      .atualizar(this.data.endereco.id, dto)
      .pipe(finalize(() => this.salvando.set(false)))
      .subscribe({
        next: () => {
          this.notificacao.sucesso('Endereço atualizado com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error('Erro ao atualizar endereço:', err);
          this.notificacao.erro('Erro ao atualizar o endereço. Tente novamente.');
        },
      });
  }
}
