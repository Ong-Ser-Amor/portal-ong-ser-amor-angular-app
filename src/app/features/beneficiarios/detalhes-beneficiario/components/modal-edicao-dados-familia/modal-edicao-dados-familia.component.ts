import { Component, inject, OnInit, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';

import { ModalComponent } from '../../../../../shared/components/ui/modal/modal.component';
import { FormularioDadosFamiliaComponent } from '../../../../../shared/components/formularios/formulario-dados-familia/formulario-dados-familia.component';
import { FamiliaService } from '../../../../../core/services/familia.service';
import { FamiliaFormService } from '../../../../../core/services/familia-form.service';
import { Beneficiario } from '../../../../../core/models/beneficiario.model';
import { AtualizarFamiliaDto, Familia } from '../../../../../core/models/familia.model';

export interface ModalEdicaoDadosFamiliaData {
  beneficiario: Beneficiario;
  familia: Familia;
}

@Component({
  selector: 'app-modal-edicao-dados-familia',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatSnackBarModule,
    ModalComponent,
    FormularioDadosFamiliaComponent,
  ],
  templateUrl: './modal-edicao-dados-familia.component.html',
  styleUrl: './modal-edicao-dados-familia.component.scss',
})
export class ModalEdicaoDadosFamiliaComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<ModalEdicaoDadosFamiliaComponent>);
  private readonly snackBar = inject(MatSnackBar);
  private readonly familiaService = inject(FamiliaService);
  private readonly familiaFormService = inject(FamiliaFormService);

  readonly data = inject<ModalEdicaoDadosFamiliaData>(MAT_DIALOG_DATA);

  salvando = signal<boolean>(false);
  form!: FormGroup;

  ngOnInit(): void {
    this.form = this.familiaFormService.criarForm(this.data.familia);
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
    const dto: AtualizarFamiliaDto = {
      faixaRenda: valorForm.faixaRenda,
      tipoMoradia: valorForm.tipoMoradia,
      possuiBeneficioSocial: Boolean(valorForm.possuiBeneficioSocial),
    };

    this.salvando.set(true);

    this.familiaService
      .atualizar(this.data.familia.id, dto)
      .pipe(finalize(() => this.salvando.set(false)))
      .subscribe({
        next: () => {
          this.snackBar.open('Dados da família atualizados com sucesso!', 'Fechar', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error('Erro ao atualizar dados da família:', err);
          this.snackBar.open('Erro ao atualizar os dados da família. Tente novamente.', 'Fechar', { duration: 4000 });
        },
      });
  }
}
